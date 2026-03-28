import { GameState } from '../types';

export function renderParticles(ctx: CanvasRenderingContext2D, gs: GameState): void {
  gs.particles.forEach(p => {
    const alpha = p.life / 70; // (40+30)
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.min(1, alpha * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}
