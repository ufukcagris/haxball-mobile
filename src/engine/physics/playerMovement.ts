import { PlayerState, InputState, GameState } from '../types';
import {
  MAX_PLAYER_SPEED, ACCEL_FACTOR, DECEL_FACTOR, JOYSTICK_DEAD,
  EXT_FRICTION, POWER_SHOT_START
} from '@/config/constants';

export function applyPlayerMovement(
  player: PlayerState,
  input: InputState,
  gs: GameState
): void {
  const maxSpd = MAX_PLAYER_SPEED * gs.scale;

  const inX = Math.abs(input.dx) > JOYSTICK_DEAD ? input.dx : 0;
  const inY = Math.abs(input.dy) > JOYSTICK_DEAD ? input.dy : 0;
  const moving = inX !== 0 || inY !== 0;

  // moveDuration: accumulates while dribbling ball fast in straight line
  const ball = gs.ball;
  const dribbleDist = Math.hypot(ball.x - player.x, ball.y - player.y);
  const isDribbling = dribbleDist < player.r + ball.r + 18 * gs.scale;

  const ballSpd = Math.hypot(ball.vx, ball.vy);
  const playerSpd = Math.hypot(player.vx, player.vy);
  const isFastDribble = ballSpd > playerSpd * 0.6 && playerSpd > MAX_PLAYER_SPEED * gs.scale * 0.55;

  // Direction consistency: reset on sudden turn
  let isStraight = false;
  if (isFastDribble) {
    const inputMag = Math.hypot(inX, inY);
    if (inputMag > JOYSTICK_DEAD) {
      const nx = inX / inputMag;
      const ny = inY / inputMag;
      const pd = gs.prevInputDir;
      const dot = pd ? nx * pd.x + ny * pd.y : 1;
      isStraight = dot > 0.90;
      gs.prevInputDir = { x: nx, y: ny };
    } else {
      gs.prevInputDir = null;
    }
  } else {
    gs.prevInputDir = null;
  }

  if (isDribbling && isFastDribble && isStraight) {
    player.moveDuration = Math.min(player.moveDuration + 1, POWER_SHOT_START + 80);
  } else {
    player.moveDuration = 0;
  }

  // Kick held = 18% slower
  const speedMult = input.kickHeld ? 0.82 : 1.0;
  const targetVx = inX * maxSpd * speedMult;
  const targetVy = inY * maxSpd * speedMult;
  const lerpF = moving ? ACCEL_FACTOR : DECEL_FACTOR;
  player.vx += (targetVx - player.vx) * lerpF;
  player.vy += (targetVy - player.vy) * lerpF;

  // External force decay
  player.extVx *= EXT_FRICTION;
  player.extVy *= EXT_FRICTION;
}
