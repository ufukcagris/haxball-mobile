import { GameState } from '../types';
import { FIXED_STEP } from '@/config/constants';

export function updateTimer(gs: GameState): boolean {
  // If timer is not running or we are in goal cooldown, don't update
  if (!gs.timerRunning || gs.goalCooldown > 0) return false;

  // If we are waiting for kickoff (ball hasn't been touched), don't update time
  if (gs.kickoff?.active) {
    return false;
  }

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
