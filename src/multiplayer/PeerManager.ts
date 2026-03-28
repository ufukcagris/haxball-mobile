import Peer, { DataConnection } from 'peerjs';

export class PeerManager {
  private peer: Peer | null = null;
  private _peerId: string | null = null;
  private isConnecting = false;

  get peerId(): string | null { return this._peerId; }
  get isReady(): boolean { return !!this.peer && !this.peer.destroyed && !!this._peerId; }

  init(onOpen: (id: string) => void, onError: (err: string) => void, onConnection?: (conn: DataConnection) => void): void {
    if (this.isReady && this._peerId) {
      onOpen(this._peerId);
      return;
    }

    if (this.isConnecting) {
      // If already connecting, we wait for the existing peer instance to open
      const check = setInterval(() => {
        if (this.isReady && this._peerId) {
          clearInterval(check);
          onOpen(this._peerId);
        }
      }, 100);
      return;
    }

    this.isConnecting = true;
    this.peer = new Peer({
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ]
      }
    });

    this.peer.on('open', (id) => {
      this._peerId = id;
      this.isConnecting = false;
      onOpen(id);
    });

    this.peer.on('error', (e) => {
      this.isConnecting = false;
      onError(e.type);
    });

    if (onConnection) {
      this.peer.on('connection', onConnection);
    }
  }

  connect(peerId: string, metadata?: Record<string, unknown>): DataConnection | null {
    if (!this.peer || !this.isReady) return null;
    return this.peer.connect(peerId, { metadata });
  }

  destroy(): void {
    this.peer?.destroy();
    this.peer = null;
    this._peerId = null;
    this.isConnecting = false;
  }
}
