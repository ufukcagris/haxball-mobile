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
      {screen === 'menu' && (
        <div className="screen">
          <MenuScreen />
        </div>
      )}
      {screen === 'create' && (
        <div className="screen">
          <CreateRoomScreen />
        </div>
      )}
      {screen === 'join' && (
        <div className="screen">
          <JoinRoomScreen />
        </div>
      )}
      {screen === 'lobby' && (
        <div className="screen">
          <LobbyScreen />
        </div>
      )}
      {screen === 'game' && (
        <div className="screen">
          <GameScreen />
        </div>
      )}
    </div>
  );
}
