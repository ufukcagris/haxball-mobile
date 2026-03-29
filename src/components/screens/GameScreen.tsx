'use client';

import { getSharedHost } from '@/components/screens/CreateRoomScreen';
import { getSharedGuest } from '@/components/screens/JoinRoomScreen';
import { useRef, useEffect, useCallback, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useGameStore } from '@/stores/useGameStore';
import { useLobbyStore } from '@/stores/useLobbyStore';
import { GameEngine } from '@/engine/GameEngine';
import { HUD } from '@/components/game/HUD';
import { JoystickZone } from '@/components/game/JoystickZone';
import { PauseOverlay } from '@/components/game/overlays/PauseOverlay';
import { GoalOverlay } from '@/components/game/overlays/GoalOverlay';
import { EndOverlay } from '@/components/game/overlays/EndOverlay';
import { HUD_HEIGHT } from '@/config/constants';
import { LobbyScreen } from './LobbyScreen';
import { PlayButton } from '../ui/PlayButton';
import { tryAutoFullscreen } from '@/utils/fullscreen';

export let activeEngine: GameEngine | null = null;

export function GameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const jBaseRef = useRef<HTMLDivElement>(null);
  const jKnobRef = useRef<HTMLDivElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const goalFlashRef = useRef<HTMLDivElement>(null);

  const { config, screen, setScreen } = useAppStore();
  const { paused, setPaused, showFullLobby, setShowFullLobby } = useGameStore();
  const { myRole, lobbyState, myPeerId, setLobbyState, resetLobby } =
    useLobbyStore();
  const [showRoomClosed, setShowRoomClosed] = useState(false);

  const goLobbyReturn = useCallback(() => {
    if (myRole === 'host') {
      const hostManager = getSharedHost();
      if (hostManager) {
        hostManager.broadcastLobbyReturn(lobbyState);
      }
    }
    engineRef.current?.destroy();
    engineRef.current = null;
    activeEngine = null;
    useGameStore.getState().reset();
    setScreen(myRole === 'solo' ? 'menu' : 'lobby');
  }, [myRole, lobbyState, setScreen]);

  const initEngine = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = Math.max(window.innerHeight - HUD_HEIGHT, 100);

    const engine = new GameEngine(canvas, {
      pitch: config.pitch,
      time: config.time,
      diff: config.diff,
      nick: config.nick,
      goalLimit: lobbyState.settings.goals,
    });

    engine.onHUDUpdate = (data) => {
      useGameStore.getState().updateHUD(data);
    };
    engine.onGoal = (team) => {
      useGameStore.getState().setGoal(team);

      // Broadcast goal if Host
      if (myRole === 'host') {
        getSharedHost()?.broadcastGoal(team);
      }

      const flash = goalFlashRef.current;
      if (flash) {
        flash.className = `goal-flash flash-${team}`;
        setTimeout(() => {
          flash.className = 'goal-flash';
        }, 500);
      }
      setTimeout(() => {
        useGameStore.getState().clearGoal();
      }, 3000);
    };
    engine.onEnd = () => {
      useGameStore.getState().setEnd();
      // Auto return to lobby after 3 seconds
      setTimeout(() => {
        goLobbyReturn();
      }, 3000);
    };

    const togglePause = () => {
      const currentlyPaused = useGameStore.getState().paused;
      if (!currentlyPaused) {
        useGameStore.getState().setPaused(true);
        if (myRole === 'solo') engineRef.current?.pause();
      } else {
        useGameStore.getState().setPaused(false);
        useGameStore.getState().setShowFullLobby(false);
        engineRef.current?.resume();
      }
    };

    engine.keyboardInput.attach(
      togglePause,
      () => engine.getLocalPlayer(),
    );
    engine.keyboardInput.setGameState(engine.getState());

    if (zoneRef.current && jBaseRef.current && jKnobRef.current) {
      engine.touchInput.attach(
        zoneRef.current,
        jBaseRef.current,
        jKnobRef.current,
        () => engine.getLocalPlayer(),
      );
    }

    if (myRole === 'solo') {
      useGameStore
        .getState()
        .setNicks(config.nick, config.diff === 'none' ? '—' : 'BOT');
      engine.initSoloGame();
    } else {
      const redNick =
        lobbyState.red.map((p) => p.nick).join(' & ') || 'KIRMIZI';
      const blueNick = lobbyState.blue.map((p) => p.nick).join(' & ') || 'MAVİ';
      useGameStore.getState().setNicks(redNick, blueNick);

      const players = [
        ...lobbyState.red.map((p, i) => ({
          id: p.id,
          nick: p.nick,
          team: 'red' as const,
          idx: i,
          total: lobbyState.red.length,
        })),
        ...lobbyState.blue.map((p, i) => ({
          id: p.id,
          nick: p.nick,
          team: 'blue' as const,
          idx: i,
          total: lobbyState.blue.length,
        })),
      ];

      engine.initMultiGame(
        players,
        lobbyState.settings,
        myPeerId || '',
        myRole === 'host',
      );

      const hostManager = getSharedHost();
      const guestManager = getSharedGuest();

      if (myRole === 'host' && hostManager) {
        let netSendCounter = 0;
        engine.onSendGameState = () => {
          netSendCounter++;
          if (netSendCounter % 2 !== 0) return;
          const gs = engine.getNormalizedState();
          if (gs) hostManager.broadcastGameState({ type: 'game_state', ...gs });
        };
        hostManager.onRemoteInput = (pid, input) => {
          engine.setRemoteInput(pid, input);
        };
      } else if (myRole === 'guest' && guestManager) {
        engine.onSendInput = (input) => {
          guestManager.sendInput(input.dx, input.dy, input.kickHeld);
        };
        guestManager.onGameState = (state) => {
          engine.applyRemoteState(state);
        };
        guestManager.onGoal = (team) => {
          engine.onGoal?.(team);
        };
        guestManager.onLobbyUpdate = (state) => {
          console.log('[GameScreen] Guest received lobby sync mid-game');
          setLobbyState(state);
        };
        guestManager.onDisconnect = () => {
          console.log('[GameScreen] Disconnected from host during game');
          setShowRoomClosed(true);
        };
        guestManager.onGameEnd = (scoreRed, scoreBlue) => {
          useGameStore.getState().updateHUD({
            scoreRed,
            scoreBlue,
            timeLeft: 0,
            overtime: false,
            time: config.time,
          });
          useGameStore.getState().setEnd();
          setTimeout(() => {
            setScreen('lobby');
          }, 3000);
        };
        guestManager.onLobbyReturn = (state) => {
          setLobbyState(state);
          engine.destroy();
          setScreen('lobby');
        };
      }
    }

    engine.start();
    engineRef.current = engine;
    activeEngine = engine;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = Math.max(window.innerHeight - HUD_HEIGHT, 100);
      engine.resize();
      
      if (window.innerWidth > window.innerHeight) {
        tryAutoFullscreen();
      }
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      engine.destroy();
      engineRef.current = null;
      activeEngine = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config,
    myRole,
    myPeerId,
    setLobbyState,
    setScreen,
    lobbyState.settings.pitch,
    lobbyState.settings.time,
    lobbyState.settings.goals,
  ]);

  useEffect(() => {
    if (screen !== 'game') return;
    useGameStore.getState().reset();
    const cleanup = initEngine();
    return cleanup;
  }, [screen, initEngine]);

  useEffect(() => {
    if (screen === 'game' && myRole !== 'solo' && engineRef.current) {
      const players = [
        ...lobbyState.red.map((p, i) => ({
          id: p.id,
          nick: p.nick,
          team: 'red' as const,
          idx: i,
          total: lobbyState.red.length,
        })),
        ...lobbyState.blue.map((p, i) => ({
          id: p.id,
          nick: p.nick,
          team: 'blue' as const,
          idx: i,
          total: lobbyState.blue.length,
        })),
      ];

      console.log('[GameScreen] Syncing players mid-game:', players.length);
      engineRef.current.updateMultiPlayers(players);

      const redNick =
        lobbyState.red.map((p) => p.nick).join(' & ') || 'KIRMIZI';
      const blueNick = lobbyState.blue.map((p) => p.nick).join(' & ') || 'MAVİ';
      useGameStore.getState().setNicks(redNick, blueNick);
    }
  }, [lobbyState, screen, myRole]);

  const togglePauseFromHUD = useCallback(() => {
    const currentlyPaused = useGameStore.getState().paused;
    if (!currentlyPaused) {
      setPaused(true);
      if (myRole === 'solo') engineRef.current?.pause();
    } else {
      setPaused(false);
      setShowFullLobby(false);
      engineRef.current?.resume();
    }
  }, [myRole, setPaused, setShowFullLobby]);

  const resumeGame = () => {
    setPaused(false);
    setShowFullLobby(false);
    engineRef.current?.resume();
  };

  const goMenu = () => {
    engineRef.current?.destroy();
    engineRef.current = null;
    activeEngine = null;
    useGameStore.getState().reset();
    setScreen('menu');
  };

  if (showRoomClosed) {
    return (
      <div
        className='flex flex-col items-center overflow-y-auto w-full h-full'
        style={{
          background:
            'radial-gradient(ellipse at 40% 30%, #400d0d 0%, #0a0e1a 70%)',
        }}
      >
        <div className='menu-bg fixed inset-0' />
        <div className='my-auto flex flex-col items-center gap-6 w-full shrink-0 py-6 z-1'>
          <div className='text-[1.2rem] font-bold text-white z-10 text-center leading-tight'>
          Baglanti Kesildi
          <br />
          <span className='text-[0.9rem] opacity-60 font-normal'>
            Oda kapatildi veya host ayrildi
          </span>
        </div>
          <div className='flex flex-col gap-3 w-[240px] z-10'>
            <PlayButton
              onClick={() => {
                resetLobby();
                setScreen('menu');
              }}
              variant='secondary'
              className='py-3!'
            >
              ANA MENUYE DON
            </PlayButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className='bg-black flex flex-col overflow-hidden w-full h-full'
      style={{ touchAction: 'none' }}
    >
      <HUD onPause={togglePauseFromHUD} />

      <div
        className='absolute left-0 right-0 bottom-0 flex items-center justify-center overflow-hidden'
        style={{
          top: `${HUD_HEIGHT}px`,
          touchAction: 'none',
          background: '#060a10',
        }}
      >
        <canvas
          ref={canvasRef}
          className='block'
          style={{ touchAction: 'none' }}
        />
      </div>

      <div ref={goalFlashRef} className='goal-flash' />
      <JoystickZone zoneRef={zoneRef} jBaseRef={jBaseRef} jKnobRef={jKnobRef} />



      {!showFullLobby && (
        <PauseOverlay
          onResume={resumeGame}
          onMenu={goMenu}
          onLobby={() => setShowFullLobby(true)}
        />
      )}

      {showFullLobby && paused && (
        <div className='absolute inset-0 z-110 bg-[#0a0e1a] flex flex-col'>
          <LobbyScreen
            isOverlay
            onBackToGame={() => setShowFullLobby(false)}
            onEndMatch={goLobbyReturn}
          />
        </div>
      )}

      <GoalOverlay />
      <EndOverlay />
    </div>
  );
}
