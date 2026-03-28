import { PitchSize } from '@/config/pitchConfigs';
import { BotDifficulty } from '@/config/botDifficulty';

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  lastKickedBy: 'red' | 'blue' | null;
  angle: number;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  extVx: number;
  extVy: number;
  r: number;
  team: 'red' | 'blue';
  isHuman: boolean;
  kickCd: number;
  kickFlash: number;
  moveDuration: number;
  // Multiplayer fields
  peerId?: string;
  nick?: string;
  isMe?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
}

export interface InputState {
  dx: number;
  dy: number;
  kick: boolean;
  kickCharge: number;
  kickHeld: boolean;
}

export interface KickoffState {
  active: boolean;
  team: 'red' | 'blue';
}

export interface GameState {
  // Pitch computed
  pc: { fw: number; fh: number; goalW: number; goalDepth: number; wallT: number };
  scale: number;
  fw: number;
  fh: number;
  ox: number;
  oy: number;
  pr: number;
  br: number;
  gw: number;
  gd: number;
  wt: number;

  // Game flow
  paused: boolean;
  over: boolean;
  goalCooldown: number;

  // Timer
  timeLeft: number;
  timerRunning: boolean;
  overtime: boolean;

  // Score
  scoreRed: number;
  scoreBlue: number;
  goalLimit: number;

  // Entities
  particles: Particle[];
  ball: BallState;
  players: PlayerState[];

  // Input
  input: InputState;
  kickCharging: boolean;
  prevInputDir: { x: number; y: number } | null;

  // Kickoff
  kickoff: KickoffState | null;

  // Multi
  isMulti: boolean;
}

export interface GameConfig {
  pitch: PitchSize;
  time: number;
  diff: BotDifficulty;
  nick: string;
  goalLimit?: number;
}

export interface MultiPlayerInfo {
  id: string;
  nick: string;
  team: 'red' | 'blue';
  idx: number;
  total: number;
}

export interface HUDData {
  scoreRed: number;
  scoreBlue: number;
  timeLeft: number;
  overtime: boolean;
  time: number;
}
