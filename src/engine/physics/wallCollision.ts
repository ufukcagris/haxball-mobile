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

  // Arena outer bounds for ball (prevent it from flying away too far if it glitches)
  if (ball.x - br < ox - gd * 1.5) { ball.x = ox - gd * 1.5 + br; ball.vx *= -0.5; }
  if (ball.x + br > ox + fw + gd * 1.5) { ball.x = ox + fw + gd * 1.5 - br; ball.vx *= -0.5; }
  if (ball.y - br < oy - gd) { ball.y = oy - gd + br; ball.vy *= -0.5; }
  if (ball.y + br > oy + fh + gd) { ball.y = oy + fh + gd - br; ball.vy *= -0.5; }

  // Goal Posts (4 points)
  const postRadius = 4 * gs.scale;
  const posts = [
    { x: ox, y: midY - halfG }, // Red top
    { x: ox, y: midY + halfG }, // Red bottom
    { x: ox + fw, y: midY - halfG }, // Blue top
    { x: ox + fw, y: midY + halfG }, // Blue bottom
  ];

  posts.forEach(post => {
    const dx = ball.x - post.x;
    const dy = ball.y - post.y;
    const dist = Math.hypot(dx, dy);
    const minD = ball.r + postRadius;

    if (dist < minD) {
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = minD - dist;

      ball.x += nx * overlap;
      ball.y += ny * overlap;

      const rv = ball.vx * nx + ball.vy * ny;
      if (rv < 0) {
        ball.vx -= 1.5 * rv * nx;
        ball.vy -= 1.5 * rv * ny;
      }
    }
  });
}

export function resolvePlayerPostCollision(player: any, gs: GameState): void {
  const { ox, oy, fw, fh, gw } = gs;
  const midY = oy + fh / 2;
  const halfG = gw / 2;
  const postRadius = 4 * gs.scale;

  const posts = [
    { x: ox, y: midY - halfG },
    { x: ox, y: midY + halfG },
    { x: ox + fw, y: midY - halfG },
    { x: ox + fw, y: midY + halfG },
  ];

  posts.forEach(post => {
    const dx = player.x - post.x;
    const dy = player.y - post.y;
    const dist = Math.hypot(dx, dy);
    const minD = player.r + postRadius;

    if (dist < minD) {
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = minD - dist;

      player.x += nx * overlap;
      player.y += ny * overlap;

      const rv = player.vx * nx + player.vy * ny;
      if (rv < 0) {
        player.vx -= rv * nx;
        player.vy -= rv * ny;
      }
    }
  });
}
