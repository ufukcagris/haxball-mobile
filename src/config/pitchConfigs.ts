export interface PitchConfig {
  fw: number;
  fh: number;
  goalW: number;
  goalDepth: number;
  wallT: number;
}

export type PitchSize = 'small' | 'medium' | 'large';

export const PITCH_CONFIGS: Record<PitchSize, PitchConfig> = {
  small:  { fw: 520, fh: 320, goalW: 95,  goalDepth: 30, wallT: 18 },
  medium: { fw: 680, fh: 400, goalW: 120,  goalDepth: 35, wallT: 20 },
  large:  { fw: 1100, fh: 580, goalW: 180, goalDepth: 45, wallT: 22 },
};
