import { DataConnection } from 'peerjs';
import { PeerManager } from './PeerManager';
import { useLobbyStore } from '@/stores/useLobbyStore';
import type { LobbyState, NetworkMessage, LobbySettings, MultiPlayerNetInfo, LobbyPlayer } from './types';

export class HostManager {
  private peerManager: PeerManager;
  private connections: Record<string, DataConnection> = {};
  private playerNicks: Record<string, string> = {}; // Track nicks for leave messages
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
        console.log('[HostManager] Peer connecting:', pid);

        // Check capacity
        const ls = useLobbyStore.getState().lobbyState;
        const currentCount = ls.red.length + ls.blue.length + ls.spec.length; // includes host

        if (currentCount >= ls.maxPlayers) {
          console.warn('[HostManager] Room is full. Rejecting:', pid);
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
          // STRICT CHECK: Don't process join twice for the same connection
          if (this.playerNicks[pid]) {
            console.log('[HostManager] Ignoring duplicate join for:', pid);
            return;
          }

          console.log('[HostManager] Connection OPEN with:', pid);
          const metadata = conn.metadata as { nick?: string } | undefined;
          let nick = (metadata?.nick || 'Oyuncu').trim();

          // Ensure unique nick - only check existing players
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
          
          // Inform the guest about their final (possibly numbered) nickname
          try {
            conn.send({ type: 'nick_update', nick });
          } catch {
            /* ignore */
          }
          
          // System message: Joined (Broadcast to others)
          this.broadcastChat('SİSTEM', `${nick} odaya katildi`);
          this.onChatMessage?.('SİSTEM', `${nick} odaya katildi`);

          // Send current lobby state immediately to the newcomer
          console.log('[HostManager] Sending initial lobby state to:', pid);
          setTimeout(() => {
            const currentLobby = useLobbyStore.getState().lobbyState;
            try {
              conn.send({ type: 'lobby', state: { ...currentLobby, isLive: this.isMatchLive } });
              console.log(
                '[HostManager] Lobby state sent successfully to:',
                pid,
              );
            } catch (error) {
              console.error(
                '[HostManager] Error sending lobby state to:',
                pid,
                error,
              );
            }
          }, 500);
        };

        if (conn.open) {
          handleJoin();
        } else {
          conn.on('open', handleJoin);
        }

        conn.on('data', (d) => {
          const msg = d as NetworkMessage;
          
          // We no longer handle 'join' here to prevent duplicates.
          // Everything is handled by handleJoin triggered via connection/open events.

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
          const nick = this.playerNicks[pid];
          if (nick) {
            console.log('[HostManager] Player left:', nick);
            this.broadcastChat('SİSTEM', `${nick} odadan ayrildi`);
            this.onChatMessage?.('SİSTEM', `${nick} odadan ayrildi`);
            delete this.playerNicks[pid];
          }
          if (this.connections[pid]) {
            delete this.connections[pid];
            this.onPlayerLeft?.(pid);
          }
        };

        conn.on('close', handleLeave);
        conn.on('error', handleLeave);
      },
    );
  }

  broadcastLobby(lobbyState: LobbyState): void {
    const msg: NetworkMessage = { 
      type: 'lobby', 
      state: { ...lobbyState, isLive: this.isMatchLive } 
    };
    this.sendToAll(msg);
  }

  broadcastGameStart(
    players: MultiPlayerNetInfo[],
    settings: LobbySettings,
  ): void {
    this.isMatchLive = true;
    const msg: NetworkMessage = { type: 'game_start', players, settings };
    this.sendToAll(msg);
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
        if (c.open) c.send(msg);
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
