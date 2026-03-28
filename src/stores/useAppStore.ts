import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PitchSize } from '@/config/pitchConfigs';
import type { BotDifficulty } from '@/config/botDifficulty';

export type ScreenId = 'menu' | 'create' | 'join' | 'lobby' | 'game';

interface AppConfig {
  nick: string;
  pitch: PitchSize;
  time: number;
  diff: BotDifficulty;
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
        diff: 'medium',
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
