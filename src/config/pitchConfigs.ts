export interface PitchConfig {
  fw: number;
  fh: number;
  goalW: number;
  goalDepth: number;
  wallT: number;
}

export type PitchSize = 'small' | 'medium' | 'large';

export const PITCH_CONFIGS: Record<PitchSize, PitchConfig> = {
  small:  { fw: 520, fh: 320, goalW: 70,  goalDepth: 22, wallT: 18 },
  medium: { fw: 680, fh: 400, goalW: 90,  goalDepth: 26, wallT: 20 },
  large:  { fw: 860, fh: 480, goalW: 110, goalDepth: 30, wallT: 22 },
};
