import { BallState, GameState } from '../types';

export function resolveBallWallCollision(ball: BallState, gs: GameState): void {
  const { ox, oy, fw, fh, gw, gd } = gs;
  const midY = oy + fh / 2;
  const halfG = gw / 2;
  const br = ball.r;

  // Left wall (Red goal mouth)
  if (ball.x - br < ox) {
    const inGoal = ball.y > midY - halfG && ball.y < midY + halfG;
    if (!inGoal) {
      ball.x = ox + br;
      ball.vx *= -0.65;
    }
  }
  // Right wall (Blue goal mouth)
  if (ball.x + br > ox + fw) {
    const inGoal = ball.y > midY - halfG && ball.y < midY + halfG;
    if (!inGoal) {
      ball.x = ox + fw - br;
      ball.vx *= -0.65;
    }
  }
  // Top/bottom
  if (ball.y - br < oy) { ball.y = oy + br; ball.vy *= -0.65; }
  if (ball.y + br > oy + fh) { ball.y = oy + fh - br; ball.vy *= -0.65; }

  // Goal back walls
  if (ball.x - br < ox - gd) { ball.x = ox - gd + br; ball.vx *= -0.6; }
  if (ball.x + br > ox + fw + gd) { ball.x = ox + fw + gd - br; ball.vx *= -0.6; }

  // Goal top/bottom inside
  if (ball.x < ox) {
    if (ball.y - br < midY - halfG) { ball.y = midY - halfG + br; ball.vy *= -0.6; }
    if (ball.y + br > midY + halfG) { ball.y = midY + halfG - br; ball.vy *= -0.6; }
  }
  if (ball.x > ox + fw) {
    if (ball.y - br < midY - halfG) { ball.y = midY - halfG + br; ball.vy *= -0.6; }
    if (ball.y + br > midY + halfG) { ball.y = midY + halfG - br; ball.vy *= -0.6; }
  }
}
