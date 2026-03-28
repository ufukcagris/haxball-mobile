import type { GameState } from '@/engine/types';

export interface NormalizedGameState {
  type: 'game_state';
  ball: { nx: number; ny: number; nvx: number; nvy: number };
  players: Array<{
    nx: number; ny: number;
    nvx: number; nvy: number;
    kickFlash: number;
    peerId: string;
  }>;
  scoreRed: number;
  scoreBlue: number;
  timeLeft: number;
  overtime: boolean;
}

export function normalizeGameState(gs: GameState): NormalizedGameState {
  const normX = (v: number) => (v - gs.ox) / gs.fw;
  const normY = (v: number) => (v - gs.oy) / gs.fh;
  const normVx = (v: number) => v / gs.fw;
  const normVy = (v: number) => v / gs.fh;

  return {
    type: 'game_state',
    ball: {
      nx: normX(gs.ball.x), ny: normY(gs.ball.y),
      nvx: normVx(gs.ball.vx), nvy: normVy(gs.ball.vy),
    },
    players: gs.players.map(p => ({
      nx: normX(p.x), ny: normY(p.y),
      nvx: normVx(p.vx), nvy: normVy(p.vy),
      kickFlash: p.kickFlash,
      peerId: p.peerId || '',
    })),
    scoreRed: gs.scoreRed,
    scoreBlue: gs.scoreBlue,
    timeLeft: gs.timeLeft,
    overtime: gs.overtime,
  };
}
