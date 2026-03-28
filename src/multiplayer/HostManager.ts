import { DataConnection } from 'peerjs';
import { PeerManager } from './PeerManager';
import type { LobbyState, NetworkMessage, LobbySettings } from './types';

export class HostManager {
  private peerManager: PeerManager;
  private connections: Record<string, DataConnection> = {};
  private netSendCounter = 0;

  public onPlayerJoined: ((pid: string, nick: string) => void) | null = null;
  public onPlayerLeft: ((pid: string) => void) | null = null;
  public onRemoteInput: ((pid: string, input: { dx: number; dy: number; kickHeld: boolean }) => void) | null = null;

  constructor(peerManager: PeerManager) {
    this.peerManager = peerManager;
  }

  setupConnectionListener(): void {
    this.peerManager.init(
      () => {},
      () => {},
      (conn: DataConnection) => {
        const pid = conn.peer;
        this.connections[pid] = conn;

        conn.on('open', () => {
          const nick = (conn.metadata as any)?.nick || 'Oyuncu';
          this.onPlayerJoined?.(pid, nick);
        });

        conn.on('data', (d) => {
          const msg = d as NetworkMessage;
          if (msg.type === 'input') {
            this.onRemoteInput?.(pid, { dx: msg.dx, dy: msg.dy, kickHeld: msg.kickHeld });
          }
        });

        conn.on('close', () => this.onPlayerLeft?.(pid));
        conn.on('error', () => this.onPlayerLeft?.(pid));
      }
    );
  }

  broadcastLobby(lobbyState: LobbyState): void {
    const msg: NetworkMessage = { type: 'lobby', state: lobbyState };
    this.sendToAll(msg);
  }

  broadcastGameStart(players: Array<{ id: string; nick: string; team: 'red' | 'blue'; idx: number; total: number }>, settings: LobbySettings): void {
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

  private sendToAll(msg: NetworkMessage): void {
    Object.values(this.connections).forEach(c => {
      try { c.send(msg); } catch (e) { /* ignore */ }
    });
  }

  closeAll(): void {
    Object.values(this.connections).forEach(c => {
      try { c.close(); } catch (e) { /* ignore */ }
    });
    this.connections = {};
  }
}
