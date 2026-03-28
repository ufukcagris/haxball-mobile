import { DataConnection } from 'peerjs';
import { PeerManager } from './PeerManager';
import { useLobbyStore } from '@/stores/useLobbyStore';
import type { LobbyState, NetworkMessage, LobbySettings, MultiPlayerNetInfo, LobbyPlayer } from './types';

export class HostManager {
  private peerManager: PeerManager;
  private connections: Record<string, DataConnection> = {};
  private netSendCounter = 0;

  public onPlayerJoined: ((pid: string, nick: string) => void) | null = null;
  public onPlayerLeft: ((pid: string) => void) | null = null;
  public onChatMessage: ((nick: string, message: string) => void) | null = null;
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
          console.log('[HostManager] Connection OPEN with:', pid);
          const metadata = conn.metadata as { nick?: string } | undefined;
          let nick = (metadata?.nick || 'Oyuncu').trim();

          // Ensure unique nick - Use top-level import and correct types
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

          this.onPlayerJoined?.(pid, nick);

          // Send current lobby state immediately to the newcomer
          console.log('[HostManager] Sending initial lobby state to:', pid);
          setTimeout(() => {
            const currentLobby = useLobbyStore.getState().lobbyState;
            try {
              conn.send({ type: 'lobby', state: currentLobby });
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
          console.log(`[HostManager] Received message from ${pid}:`, msg.type);

          if (msg.type === 'join') {
            console.log(
              `[HostManager] Player ${pid} joined with nick: ${msg.nick}`,
            );
            this.onPlayerJoined?.(pid, msg.nick);

            // Respond immediately with the current lobby state
            const currentLobby = useLobbyStore.getState().lobbyState;
            conn.send({ type: 'lobby', state: currentLobby });
            console.log(
              '[HostManager] Sent initial lobby state in response to join message',
            );
          }

          if (msg.type === 'chat') {
            console.log(`[HostManager] Chat from ${pid}: ${msg.message}`);
            this.onChatMessage?.(msg.nick, msg.message);
            this.broadcastChat(msg.nick, msg.message);
          }

          if (msg.type === 'input') {
            this.onRemoteInput?.(pid, {
              dx: msg.dx,
              dy: msg.dy,
              kickHeld: msg.kickHeld,
            });
          }
        });

        conn.on('close', () => this.onPlayerLeft?.(pid));
        conn.on('error', () => this.onPlayerLeft?.(pid));
      },
    );
  }

  broadcastLobby(lobbyState: LobbyState): void {
    const msg: NetworkMessage = { type: 'lobby', state: lobbyState };
    this.sendToAll(msg);
  }

  broadcastGameStart(
    players: MultiPlayerNetInfo[],
    settings: LobbySettings,
  ): void {
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
    this.sendToAll({ type: 'game_end', scoreRed, scoreBlue });
  }

  broadcastLobbyReturn(lobbyState: LobbyState): void {
    this.sendToAll({ type: 'lobby_return', state: lobbyState });
  }

  broadcastChat(nick: string, message: string): void {
    this.sendToAll({ type: 'chat', nick, message });
  }

  private sendToAll(msg: NetworkMessage): void {
    Object.values(this.connections).forEach((c) => {
      try {
        c.send(msg);
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
  }
}
