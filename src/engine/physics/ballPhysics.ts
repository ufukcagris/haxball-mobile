import { BallState, GameState } from '../types';
import { BALL_FRICTION } from '@/config/constants';

export function updateBall(ball: BallState, gs: GameState): void {
  ball.vx *= BALL_FRICTION;
  ball.vy *= BALL_FRICTION;
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Rotation angle proportional to speed
  const spd = Math.hypot(ball.vx, ball.vy);
  if (spd > 0.05) {
    ball.angle += spd * 0.06;
    // Kickoff ends when ball moves
    if (gs.kickoff?.active) {
      gs.kickoff.active = false;
    }
  }
}
