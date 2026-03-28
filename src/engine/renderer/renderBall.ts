import { GameState } from '../types';

export function renderBall(ctx: CanvasRenderingContext2D, gs: GameState): void {
  const ball = gs.ball;

  // Shadow
  ctx.beginPath();
  ctx.ellipse(ball.x, ball.y + ball.r * 0.8, ball.r * 0.9, ball.r * 0.3, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.fill();

  // Ball body
  const grad = ctx.createRadialGradient(
    ball.x - ball.r * 0.3, ball.y - ball.r * 0.3, 1,
    ball.x, ball.y, ball.r
  );
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.4, '#e0e0e0');
  grad.addColorStop(1, '#888');

  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.shadowColor = 'rgba(255,255,255,0.4)';
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Panel lines — rotate only when moving
  const ballSpd = Math.hypot(ball.vx, ball.vy);
  if (ballSpd > 0.05) {
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const a = ball.angle + (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(ball.x + Math.cos(a) * ball.r * 0.2, ball.y + Math.sin(a) * ball.r * 0.2);
      ctx.lineTo(ball.x + Math.cos(a) * ball.r * 0.9, ball.y + Math.sin(a) * ball.r * 0.9);
      ctx.stroke();
    }
  }
}
