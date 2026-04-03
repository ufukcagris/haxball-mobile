import Peer, { DataConnection } from 'peerjs';

export class PeerManager {
  private peer: Peer | null = null;
  private _peerId: string | null = null;
  private isConnecting = false;

  get peerId(): string | null {
    return this._peerId;
  }
  get isReady(): boolean {
    return !!this.peer && !this.peer.destroyed && !!this._peerId;
  }

  init(
    onOpen: (id: string) => void,
    onError: (err: string) => void,
    onConnection?: (conn: DataConnection) => void,
  ): void {
    if (onConnection && this.peer) {
      this.peer.on('connection', (conn) => {
        console.log('[PeerManager] Incoming connection from:', conn.peer);
        onConnection(conn);
      });
    }

    if (this.isReady && this._peerId) {
      onOpen(this._peerId);
      return;
    }

    if (this.isConnecting) {
      const check = setInterval(() => {
        if (this.isReady && this._peerId) {
          clearInterval(check);
          onOpen(this._peerId);
        }
      }, 100);
      return;
    }

    this.isConnecting = true;
    const isSecure =
      typeof window !== 'undefined' && window.location.protocol === 'https:';
    console.log('[PeerManager] Initializing Peer...', { isSecure });

    const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
    const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
    const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

    const iceServers: Array<{
      urls: string;
      username?: string;
      credential?: string;
    }> = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
      { urls: 'stun:stun.services.mozilla.com' },
    ];

    if (turnUrl && turnUsername && turnCredential) {
      const domainMatch = turnUrl.match(/turn:([^:]+)/);
      const domain = domainMatch
        ? domainMatch[1]
        : turnUrl.replace('turn:', '').split(':')[0];

      iceServers.push({
        urls: `turn:${domain}:80`,
        username: turnUsername,
        credential: turnCredential,
      });
      iceServers.push({
        urls: `turn:${domain}:80?transport=tcp`,
        username: turnUsername,
        credential: turnCredential,
      });
      iceServers.push({
        urls: `turn:${domain}:443`,
        username: turnUsername,
        credential: turnCredential,
      });
      iceServers.push({
        urls: `turns:${domain}:443?transport=tcp`,
        username: turnUsername,
        credential: turnCredential,
      });
    }

    this.peer = new Peer({
      secure: isSecure,
      debug: 3,
      config: {
        iceServers: iceServers,
        iceTransportPolicy: 'all',
        sdpSemantics: 'unified-plan',
        iceCandidatePoolSize: 10,
      },
    });

    this.peer.on('open', (id) => {
      console.log('[PeerManager] Peer opened with ID:', id);
      this._peerId = id;
      this.isConnecting = false;
      onOpen(id);
    });

    this.peer.on('error', (e) => {
      console.error('[PeerManager] Peer error:', e.type, e);
      this.isConnecting = false;
      onError(e.type);
    });

    if (onConnection) {
      this.peer.on('connection', (conn) => {
        console.log('[PeerManager] Incoming connection from:', conn.peer);
        onConnection(conn);
      });
    }
  }

  connect(
    peerId: string,
    metadata?: Record<string, unknown>,
  ): DataConnection | null {
    if (!this.peer || !this.isReady) return null;
    return this.peer.connect(peerId, {
      metadata,
      reliable: true,
      serialization: 'json',
    });
  }

  destroy(): void {
    this.peer?.destroy();
    this.peer = null;
    this._peerId = null;
    this.isConnecting = false;
  }
}
