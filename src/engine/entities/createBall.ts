import { BallState } from '../types';

export function createBall(x: number, y: number, r: number): BallState {
  return { x, y, vx: 0, vy: 0, r, lastKickedBy: null, angle: 0 };
}
