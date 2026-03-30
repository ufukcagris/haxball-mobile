import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PitchSize } from '@/config/pitchConfigs';

export type ScreenId = 'menu' | 'create' | 'join' | 'lobby' | 'game';

interface AppConfig {
  nick: string;
  pitch: PitchSize;
  time: number;
  goals: number;
  isTraining: boolean;
}

interface AppState {
  screen: ScreenId;
  config: AppConfig;
  setScreen: (screen: ScreenId) => void;
  setConfig: (partial: Partial<AppConfig>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      screen: 'menu',
      config: {
        nick: 'Oyuncu',
        pitch: 'medium',
        time: 180,
        goals: 5,
        isTraining: false,
      },
      setScreen: (screen) => set({ screen }),
      setConfig: (partial) =>
        set((s) => ({ config: { ...s.config, ...partial } })),
    }),
    {
      name: 'haxball-app-storage',
      partialize: (state) => ({ config: state.config }), // Sadece config'i (nick, ayarlar) kaydet, mevcut ekranı (screen) değil
    },
  ),
);
