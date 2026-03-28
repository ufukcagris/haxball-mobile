export type BotDifficulty = 'none' | 'easy' | 'medium' | 'hard';

export interface BotConfig {
  spd: number;
  accel: number;
  kickCd: number;
  spread: number;
}

import { MAX_PLAYER_SPEED } from './constants';

export function getBotConfig(difficulty: BotDifficulty, scale: number): BotConfig | null {
  if (difficulty === 'none') return null;

  const configs: Record<Exclude<BotDifficulty, 'none'>, BotConfig> = {
    easy:   { spd: MAX_PLAYER_SPEED * 0.82 * scale, accel: 0.10, kickCd: 36, spread: 0.50 },
    medium: { spd: MAX_PLAYER_SPEED * 1.00 * scale, accel: 0.16, kickCd: 18, spread: 0.20 },
    hard:   { spd: MAX_PLAYER_SPEED * 1.15 * scale, accel: 0.24, kickCd:  8, spread: 0.05 },
  };

  return configs[difficulty];
}
