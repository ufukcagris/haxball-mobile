import { DataConnection } from 'peerjs';
import { PeerManager } from './PeerManager';
import { useLobbyStore } from '@/stores/useLobbyStore';
import type {
  LobbyState,
  NetworkMessage,
  LobbySettings,
  MultiPlayerNetInfo,
  LobbyPlayer,
} from './types';

export class HostManager {
  private peerManager: PeerManager;
  private connections: Record<string, DataConnection> = {};
  private playerNicks: Record<string, string> = {};
  private netSendCounter = 0;
  private isMatchLive = false;

  public onPlayerJoined: ((pid: string, nick: string) => void) | null = null;
  public onPlayerLeft: ((pid: string) => void) | null = null;
  public onChatMessage: ((nick: string, message: string) => void) | null = null;
  public onPlayerTyping: ((nick: string, typing: boolean) => void) | null = null;
  public onRemoteInput:
    | ((
        pid: string,
        input: { dx: number; dy: number; kickHeld: boolean },
      ) => void)
    | null = null;

  constructor(peerManager: PeerManager) {
    this.peerManager = peerManager;
  }

  setupConnectionListener(): void {
    this.peerManager.init(
      () => {},
      () => {},
      (conn: DataConnection) => {
        const pid = conn.peer;
        console.log('[HostManager] Incoming connection attempt from:', pid);

        // CLEANUP: If there's an existing connection for this pid, close it first
        if (this.connections[pid]) {
          console.log(
            '[HostManager] Cleaning up existing stale connection for:',
            pid,
          );
          try {
            this.connections[pid].close();
          } catch {
            /* ignore */
          }
          delete this.connections[pid];
          delete this.playerNicks[pid];
        }

        // Check capacity
        const ls = useLobbyStore.getState().lobbyState;
        const currentCount = ls.red.length + ls.blue.length + ls.spec.length;

        if (currentCount >= ls.maxPlayers) {
          setTimeout(() => {
            try {
              conn.send({ type: 'error', message: 'Oda dolu!' });
              conn.close();
            } catch {
              /* ignore */
            }
          }, 500);
          return;
        }

        this.connections[pid] = conn;

        const handleJoin = () => {
          // If we already assigned a nick to THIS SPECIFIC connection object, stop.
          const connExt = conn as DataConnection & { _haxJoined?: boolean };
          if (connExt._haxJoined) return;
          connExt._haxJoined = true;

          console.log('[HostManager] Processing join for:', pid);
          const metadata = conn.metadata as { nick?: string } | undefined;
          let nick = (metadata?.nick || 'Oyuncu').trim();

          const currentLs = useLobbyStore.getState().lobbyState;
          const allNicks = [
            ...currentLs.red.map((p: LobbyPlayer) => p.nick),
            ...currentLs.blue.map((p: LobbyPlayer) => p.nick),
            ...currentLs.spec.map((p: LobbyPlayer) => p.nick),
          ];

          if (allNicks.includes(nick)) {
            let counter = 1;
            let newNick = `${nick}${counter}`;
            while (allNicks.includes(newNick)) {
              counter++;
              newNick = `${nick}${counter}`;
            }
            nick = newNick;
          }

          this.playerNicks[pid] = nick;
          this.onPlayerJoined?.(pid, nick);

          try {
            conn.send({ type: 'nick_update', nick });
          } catch {
            /* ignore */
          }

          this.broadcastChat('SİSTEM', `${nick} odaya katildi`);
          this.onChatMessage?.('SİSTEM', `${nick} odaya katildi`);

          setTimeout(() => {
            const currentLobby = useLobbyStore.getState().lobbyState;
            try {
              conn.send({
                type: 'lobby',
                state: { ...currentLobby, isLive: this.isMatchLive },
              });
            } catch {
              /* ignore */
            }
          }, 500);
        };

        // Only use 'open' event, don't check conn.open immediately to avoid race conditions with React
        conn.on('open', handleJoin);

        conn.on('data', (d) => {
          const msg = d as NetworkMessage;
          if (msg.type === 'chat') {
            const authoritativeNick = this.playerNicks[pid] || msg.nick;
            this.onChatMessage?.(authoritativeNick, msg.message);
            this.broadcastChat(authoritativeNick, msg.message);
          }
          if (msg.type === 'typing') {
            const authoritativeNick = this.playerNicks[pid] || msg.nick;
            this.onPlayerTyping?.(authoritativeNick, msg.typing);
            this.broadcastTyping(authoritativeNick, msg.typing);
          }
          if (msg.type === 'input') {
            this.onRemoteInput?.(pid, {
              dx: msg.dx,
              dy: msg.dy,
              kickHeld: msg.kickHeld,
            });
          }
        });

        const handleLeave = () => {
          // Only handle leave if it's the current active connection for this pid
          if (this.connections[pid] !== conn) return;

          const nick = this.playerNicks[pid];
          if (nick) {
            this.broadcastChat('SİSTEM', `${nick} odadan ayrildi`);
            this.onChatMessage?.('SİSTEM', `${nick} odadan ayrildi`);
            delete this.playerNicks[pid];
          }
          delete this.connections[pid];
          this.onPlayerLeft?.(pid);
        };

        conn.on('close', handleLeave);
        conn.on('error', handleLeave);
      },
    );
  }

  broadcastLobby(lobbyState: LobbyState): void {
    const msg: NetworkMessage = {
      type: 'lobby',
      state: { ...lobbyState, isLive: this.isMatchLive },
    };
    this.sendToAll(msg);
  }

  broadcastGameStart(
    players: MultiPlayerNetInfo[],
    settings: LobbySettings,
  ): void {
    this.isMatchLive = true;
    this.sendToAll({ type: 'game_start', players, settings });
  }

  broadcastGameState(stateMsg: NetworkMessage): void {
    this.netSendCounter++;
    if (this.netSendCounter % 2 !== 0) return;
    this.sendToAll(stateMsg);
  }

  broadcastGoal(team: 'red' | 'blue'): void {
    this.sendToAll({ type: 'goal', team });
  }

  broadcastEndGame(scoreRed: number, scoreBlue: number): void {
    this.isMatchLive = false;
    this.sendToAll({ type: 'game_end', scoreRed, scoreBlue });
  }

  broadcastLobbyReturn(lobbyState: LobbyState): void {
    this.isMatchLive = false;
    this.sendToAll({ type: 'lobby_return', state: lobbyState });
  }

  broadcastChat(nick: string, message: string): void {
    this.sendToAll({ type: 'chat', nick, message });
  }

  broadcastTyping(nick: string, typing: boolean): void {
    this.sendToAll({ type: 'typing', nick, typing });
  }

  private sendToAll(msg: NetworkMessage): void {
    Object.values(this.connections).forEach((c) => {
      try {
        if (c && c.open) {
          c.send(msg);
        }
      } catch {
        /* ignore */
      }
    });
  }

  closeAll(): void {
    Object.values(this.connections).forEach((c) => {
      try {
        c.close();
      } catch {
        /* ignore */
      }
    });
    this.connections = {};
    this.playerNicks = {};
    this.isMatchLive = false;
  }
}
