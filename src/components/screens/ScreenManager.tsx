'use client';

import { useAppStore } from '@/stores/useAppStore';
import { MenuScreen } from './MenuScreen';
import { CreateRoomScreen } from './CreateRoomScreen';
import { JoinRoomScreen } from './JoinRoomScreen';
import { LobbyScreen } from './LobbyScreen';
import { GameScreen } from './GameScreen';

export function ScreenManager() {
  const screen = useAppStore((s) => s.screen);

  return (
    <div className="w-full h-full relative">
      <div className={`screen ${screen !== 'menu' ? 'hidden' : ''}`}>
        <MenuScreen />
      </div>
      <div className={`screen ${screen !== 'create' ? 'hidden' : ''}`}>
        <CreateRoomScreen />
      </div>
      <div className={`screen ${screen !== 'join' ? 'hidden' : ''}`}>
        <JoinRoomScreen />
      </div>
      <div className={`screen ${screen !== 'lobby' ? 'hidden' : ''}`}>
        <LobbyScreen />
      </div>
      <div className={`screen ${screen !== 'game' ? 'hidden' : ''}`}>
        <GameScreen />
      </div>
    </div>
  );
}
