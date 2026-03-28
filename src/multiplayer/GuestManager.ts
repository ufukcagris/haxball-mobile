import { DataConnection } from 'peerjs';
import { PeerManager } from './PeerManager';
import type { NetworkMessage, LobbyState, LobbySettings } from './types';
import { NormalizedState } from '@/engine/types';

export class GuestManager {
  private peerManager: PeerManager;
  private hostConn: DataConnection | null = null;

  public onLobbyUpdate: ((state: LobbyState) => void) | null = null;
  public onGameStart:
    | ((
        players: Array<{
          id: string;
          nick: string;
          team: 'red' | 'blue';
          idx: number;
          total: number;
        }>,
        settings: LobbySettings,
      ) => void)
    | null = null;
  public onGameState: ((msg: NormalizedState) => void) | null = null;
  public onGoal: ((team: 'red' | 'blue') => void) | null = null;
  public onGameEnd: ((scoreRed: number, scoreBlue: number) => void) | null =
    null;
  public onLobbyReturn: ((state: LobbyState) => void) | null = null;
  public onChatMessage: ((nick: string, message: string) => void) | null = null;
  public onNickUpdate: ((newNick: string) => void) | null = null;
  public onDisconnect: (() => void) | null = null;
  public onError: ((err: string) => void) | null = null;

  constructor(peerManager: PeerManager) {
    this.peerManager = peerManager;
  }

  connect(code: string, nick: string): void {
    console.log('[GuestManager] Attempting to connect to host:', code);
    const conn = this.peerManager.connect(code, { nick });
    if (!conn) {
      console.error(
        '[GuestManager] PeerManager failed to return a connection object',
      );
      return;
    }

    this.hostConn = conn;

    conn.on('open', () => {
      console.log(
        '[GuestManager] Connection to host OPENED. Sending join message...',
      );
      conn.send({ type: 'join', nick });
    });

    conn.on('data', (d) => {
      const msg = d as NetworkMessage;
      console.log('[GuestManager] Received message from host:', msg.type);
      switch (msg.type) {
        case 'lobby':
          this.onLobbyUpdate?.(msg.state);
          break;
        case 'game_start':
          this.onGameStart?.(msg.players, msg.settings);
          break;
        case 'game_state':
          this.onGameState?.(msg as unknown as NormalizedState);
          break;
        case 'goal':
          this.onGoal?.(msg.team);
          break;
        case 'game_end':
          this.onGameEnd?.(msg.scoreRed, msg.scoreBlue);
          break;
        case 'lobby_return':
          this.onLobbyReturn?.(msg.state);
          break;
        case 'chat':
          this.onChatMessage?.(msg.nick, msg.message);
          break;
        case 'nick_update':
          this.onNickUpdate?.(msg.nick);
          break;
        case 'error':
          this.onError?.(msg.message || 'Bilinmeyen hata');
          break;
      }
    });

    conn.on('close', () => this.onDisconnect?.());
    conn.on('error', (e) => this.onError?.(e.type));
  }

  sendInput(dx: number, dy: number, kickHeld: boolean): void {
    if (!this.hostConn) return;
    try {
      this.hostConn.send({ type: 'input', dx, dy, kickHeld });
    } catch {
      /* ignore */
    }
  }

  sendChat(nick: string, message: string): void {
    if (!this.hostConn) return;
    try {
      this.hostConn.send({ type: 'chat', nick, message });
    } catch {
      /* ignore */
    }
  }

  disconnect(): void {
    try {
      this.hostConn?.close();
    } catch {
      /* ignore */
    }
    this.hostConn = null;
  }
}
