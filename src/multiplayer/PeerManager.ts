import Peer, { DataConnection } from 'peerjs';

export class PeerManager {
  private peer: Peer | null = null;
  private _peerId: string | null = null;

  get peerId(): string | null { return this._peerId; }
  get isReady(): boolean { return !!this.peer && !this.peer.destroyed; }

  init(onOpen: (id: string) => void, onError: (err: string) => void, onConnection?: (conn: DataConnection) => void): void {
    if (this.peer && !this.peer.destroyed) {
      if (this._peerId) onOpen(this._peerId);
      return;
    }

    this.peer = new Peer();

    this.peer.on('open', (id) => {
      this._peerId = id;
      onOpen(id);
    });

    this.peer.on('error', (e) => {
      onError(e.type);
    });

    if (onConnection) {
      this.peer.on('connection', onConnection);
    }
  }

  connect(peerId: string, metadata?: Record<string, unknown>): DataConnection | null {
    if (!this.peer) return null;
    return this.peer.connect(peerId, { metadata });
  }

  destroy(): void {
    this.peer?.destroy();
    this.peer = null;
    this._peerId = null;
  }
}
