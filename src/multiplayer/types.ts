export interface LobbyPlayer {
  id: string;
  nick: string;
}

export interface LobbySettings {
  pitch: 'small' | 'medium' | 'large';
  time: number;
  goals: number;
}

export interface LobbyState {
  roomName: string;
  maxPlayers: number;
  red: LobbyPlayer[];
  blue: LobbyPlayer[];
  spec: LobbyPlayer[];
  settings: LobbySettings;
  hostId: string | null;
}

export type MyRole = 'solo' | 'host' | 'guest';

export interface RemoteInput {
  dx: number;
  dy: number;
  kickHeld: boolean;
}

// Network message types
export type NetworkMessage =
  | { type: 'lobby'; state: LobbyState }
  | { type: 'join'; nick: string }
  | { type: 'input'; dx: number; dy: number; kickHeld: boolean }
  | { type: 'game_start'; players: MultiPlayerNetInfo[]; settings: LobbySettings }
  | { type: 'game_state'; ball: NormalizedBall; players: NormalizedPlayer[]; scoreRed: number; scoreBlue: number; timeLeft: number; overtime: boolean }
  | { type: 'goal'; team: 'red' | 'blue' }
  | { type: 'game_end'; scoreRed: number; scoreBlue: number }
  | { type: 'lobby_return'; state: LobbyState };

export interface MultiPlayerNetInfo {
  id: string;
  nick: string;
  team: 'red' | 'blue';
  idx: number;
  total: number;
}

export interface NormalizedBall {
  nx: number;
  ny: number;
  nvx: number;
  nvy: number;
}

export interface NormalizedPlayer {
  nx: number;
  ny: number;
  nvx: number;
  nvy: number;
  kickFlash: number;
  peerId: string;
}
