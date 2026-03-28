import { GameState } from '../types';
import { renderPitch } from './renderPitch';
import { renderBall } from './renderBall';
import { renderPlayers } from './renderPlayers';
import { renderParticles } from './renderParticles';

export function render(ctx: CanvasRenderingContext2D, gs: GameState): void {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.clearRect(0, 0, W, H);

  renderPitch(ctx, gs);
  renderParticles(ctx, gs);
  renderBall(ctx, gs);
  renderPlayers(ctx, gs);
}
