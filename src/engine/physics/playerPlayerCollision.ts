import { PlayerState } from '../types';
import { RESTITUTION } from '@/config/constants';

export function resolvePlayerPlayerCollision(a: PlayerState, b: PlayerState): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const minD = a.r + b.r;

  if (dist >= minD || dist < 0.01) return;

  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = minD - dist;

  // Separate equally
  a.x -= nx * overlap * 0.5;
  a.y -= ny * overlap * 0.5;
  b.x += nx * overlap * 0.5;
  b.y += ny * overlap * 0.5;

  // Impulse on total velocity
  const aVx = a.vx + a.extVx;
  const aVy = a.vy + a.extVy;
  const bVx = b.vx + b.extVx;
  const bVy = b.vy + b.extVy;
  const rv = (bVx - aVx) * nx + (bVy - aVy) * ny;
  if (rv >= 0) return;

  const j = -(1 + RESTITUTION) * rv / 2; // equal mass
  a.extVx -= j * nx;
  a.extVy -= j * ny;
  b.extVx += j * nx;
  b.extVy += j * ny;
}
