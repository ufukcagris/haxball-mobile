import { PlayerState, GameState } from '../types';
import {
  KICK_POWER, JOYSTICK_DEAD,
  POWER_SHOT_START, POWER_SHOT_MAX,
  FIRST_TOUCH_DOT, FIRST_TOUCH_SPD
} from '@/config/constants';
import { spawnParticles } from './particleSystem';

export function doKick(player: PlayerState | null, gs: GameState): void {
  if (!player) return;

  const ball = gs.ball;

  // Flash always (even if not touching ball)
  player.kickFlash = 12;

  const dist = Math.hypot(ball.x - player.x, ball.y - player.y);
  if (dist >= player.r + ball.r + 6 || player.kickCd > 0) return;

  const kx = ball.x - player.x;
  const ky = ball.y - player.y;
  const km = Math.hypot(kx, ky) || 1;
  const S = gs.scale;
  const basePwr = KICK_POWER * S;

  // 1. Power shot multiplier
  const overShot = Math.max(0, player.moveDuration - POWER_SHOT_START);
  const powerMult = 1.0 + Math.min(POWER_SHOT_MAX - 1.0, (overShot / 80) * (POWER_SHOT_MAX - 1.0));
  if (powerMult > 1.1) {
    player.kickFlash = Math.round(12 + (powerMult - 1.0) * 20);
  }

  // 2. First touch detection
  const ballSpd = Math.hypot(ball.vx, ball.vy);
  const headOnDot = ballSpd > 0.01
    ? (ball.vx * (-kx / km) + ball.vy * (-ky / km)) / ballSpd
    : 0;
  const isFirstTouch = headOnDot > FIRST_TOUCH_DOT && ballSpd > FIRST_TOUCH_SPD * S;

  if (isFirstTouch) {
    // First touch: absorb + redirect
    const inX = gs.input.dx;
    const inY = gs.input.dy;
    const inSpd = Math.hypot(inX, inY);
    const hasDir = inSpd > JOYSTICK_DEAD;

    let rdx: number, rdy: number;
    if (hasDir) {
      rdx = inX / inSpd;
      rdy = inY / inSpd;
    } else {
      const pvspd = Math.hypot(player.vx, player.vy);
      if (pvspd > 0.3) {
        rdx = player.vx / pvspd;
        rdy = player.vy / pvspd;
      } else {
        rdx = -1;
        rdy = 0;
      }
    }

    ball.vx = ball.vx * 0.15 + rdx * basePwr * 0.88 * powerMult;
    ball.vy = ball.vy * 0.15 + rdy * basePwr * 0.88 * powerMult;
    spawnParticles(gs, ball.x, ball.y, '#00ffcc');
  } else {
    // Normal kick / power shot
    ball.vx += (kx / km) * basePwr * powerMult;
    ball.vy += (ky / km) * basePwr * powerMult;
  }

  ball.lastKickedBy = 'red';
  player.kickCd = 16;
  player.moveDuration = 0;
  if (powerMult <= 1.1) {
    spawnParticles(gs, ball.x, ball.y, '#ffcc00');
  } else {
    spawnParticles(gs, ball.x, ball.y, '#ff8800', 12);
  }
}
