import { GameState } from '../types';

export type GoalResult = {
  scored: 'red' | 'blue';
  isGameEnd: boolean;
} | null;

export function checkGoal(gs: GameState): GoalResult {
  const { ox, oy, fw, fh, gw, gd, ball } = gs;
  const midY = oy + fh / 2;
  const halfG = gw / 2;
  const br = ball.r;

  let scored: 'red' | 'blue' | null = null;

  if (ball.x - br < ox - gd + br && ball.y > midY - halfG && ball.y < midY + halfG) {
    scored = 'blue';
  }
  if (ball.x + br > ox + fw + gd - br && ball.y > midY - halfG && ball.y < midY + halfG) {
    scored = 'red';
  }

  if (!scored) return null;

  if (scored === 'red') gs.scoreRed++;
  else gs.scoreBlue++;

  // Overtime: first goal wins
  if (gs.overtime) {
    return { scored, isGameEnd: true };
  }

  // Goal limit check
  const limit = gs.goalLimit || 0;
  if (limit > 0 && (gs.scoreRed >= limit || gs.scoreBlue >= limit)) {
    return { scored, isGameEnd: true };
  }

  return { scored, isGameEnd: false };
}
