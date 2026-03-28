import { Particle } from '../types';

export function createParticle(
  x: number,
  y: number,
  color: string,
  life?: number,
  size?: number
): Particle {
  const angle = Math.random() * Math.PI * 2;
  const spd = 1 + Math.random() * 3;
  return {
    x, y,
    vx: Math.cos(angle) * spd,
    vy: Math.sin(angle) * spd,
    color,
    life: life ?? (20 + Math.random() * 20),
    size: size ?? (2 + Math.random() * 3),
  };
}
