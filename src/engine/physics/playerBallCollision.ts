import { PlayerState, BallState, GameState } from '../types';
import { BALL_MASS, PLAYER_MASS, RESTITUTION } from '@/config/constants';

export function resolvePlayerBallCollision(player: PlayerState, ball: BallState, gs: GameState): void {
  const dx = ball.x - player.x;
  const dy = ball.y - player.y;
  const dist = Math.hypot(dx, dy);
  const minD = player.r + ball.r;

  if (dist >= minD || dist < 0.01) return;

  // Touch detected! If kickoff was active, it's over now.
  if (gs.kickoff?.active) {
    gs.kickoff.active = false;
  }

  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = minD - dist;
  const totalMass = BALL_MASS + PLAYER_MASS;

  // Separate fully — no interpenetration
  ball.x += nx * overlap * (PLAYER_MASS / totalMass);
  ball.y += ny * overlap * (PLAYER_MASS / totalMass);
  player.x -= nx * overlap * (BALL_MASS / totalMass);
  player.y -= ny * overlap * (BALL_MASS / totalMass);

  const pTotalVx = player.vx + player.extVx;
  const pTotalVy = player.vy + player.extVy;
  const rv = (ball.vx - pTotalVx) * nx + (ball.vy - pTotalVy) * ny;
  if (rv >= 0) return;

  const j = -(1 + RESTITUTION) * rv / (1 / BALL_MASS + 1 / PLAYER_MASS);
  ball.vx += (j / BALL_MASS) * nx;
  ball.vy += (j / BALL_MASS) * ny;
  player.extVx -= (j / PLAYER_MASS) * nx;
  player.extVy -= (j / PLAYER_MASS) * ny;
}
