import { PlayerState } from '../types';

export function createPlayer(
  x: number,
  y: number,
  r: number,
  team: 'red' | 'blue',
  isHuman: boolean
): PlayerState {
  return {
    x, y, vx: 0, vy: 0, extVx: 0, extVy: 0,
    r, team, isHuman,
    kickCd: 0, kickFlash: 0, moveDuration: 0,
  };
}
