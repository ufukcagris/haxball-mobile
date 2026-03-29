'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { MenuScreen } from './MenuScreen';
import { CreateRoomScreen } from './CreateRoomScreen';
import { JoinRoomScreen } from './JoinRoomScreen';
import { LobbyScreen } from './LobbyScreen';
import { GameScreen } from './GameScreen';
import { tryAutoFullscreen } from '@/utils/fullscreen';

export function ScreenManager() {
  const screen = useAppStore((s) => s.screen);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > window.innerHeight) {
        tryAutoFullscreen();
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

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
