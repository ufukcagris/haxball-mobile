import { GameState } from '../types';
import { FIXED_STEP } from '@/config/constants';

export function updateTimer(gs: GameState): boolean {
  if (!gs.timerRunning || gs.goalCooldown > 0) return false;

  gs.timeLeft -= FIXED_STEP / 1000;
  if (gs.timeLeft <= 0) {
    gs.timeLeft = 0;
    return true; // time's up
  }
  return false;
}

export function checkOvertime(gs: GameState): boolean {
  if (gs.timerRunning && gs.scoreRed === gs.scoreBlue && !gs.overtime) {
    gs.overtime = true;
    gs.timerRunning = false;
    return true;
  }
  return false;
}
