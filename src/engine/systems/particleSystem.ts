import { GameState, Particle } from '../types';
import { createParticle } from '../entities/createParticle';

export function spawnParticles(
  gs: GameState,
  x: number,
  y: number,
  color: string,
  count: number = 6
): void {
  for (let i = 0; i < count; i++) {
    gs.particles.push(createParticle(x, y, color));
  }
}

export function spawnGoalParticles(gs: GameState, team: 'red' | 'blue'): void {
  const color = team === 'red' ? '#ff3d71' : '#00e5ff';
  const cx = gs.ox + gs.fw / 2;
  const cy = gs.oy + gs.fh / 2;

  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = 2 + Math.random() * 6;
    gs.particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      color,
      life: 40 + Math.random() * 30,
      size: 3 + Math.random() * 5,
    });
  }
}

export function updateParticles(gs: GameState): void {
  gs.particles = gs.particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.95;
    p.vy *= 0.95;
    p.life--;
    return p.life > 0;
  });
}
