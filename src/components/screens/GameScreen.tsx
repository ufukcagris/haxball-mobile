'use client';

import { getSharedHost } from '@/components/screens/CreateRoomScreen';
import { getSharedGuest } from '@/components/screens/JoinRoomScreen';
import { useRef, useEffect, useCallback } from 'react';
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

export function GameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const jBaseRef = useRef<HTMLDivElement>(null);
  const jKnobRef = useRef<HTMLDivElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const goalFlashRef = useRef<HTMLDivElement>(null);

  const { config, screen, setScreen } = useAppStore();
  const gameStore = useGameStore();
  const { myRole, lobbyState, myPeerId } = useLobbyStore();

  const initEngine = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Size canvas
    canvas.width = window.innerWidth;
    canvas.height = Math.max(window.innerHeight - HUD_HEIGHT, 100);

    const engine = new GameEngine(canvas, {
      pitch: config.pitch,
      time: config.time,
      diff: config.diff,
      nick: config.nick,
    });

    // Callbacks
    engine.onHUDUpdate = (data) => {
      useGameStore.getState().updateHUD(data);
    };
    engine.onGoal = (team) => {
      useGameStore.getState().setGoal(team);
      // Flash
      const flash = goalFlashRef.current;
      if (flash) {
        flash.className = `goal-flash flash-${team}`;
        setTimeout(() => { flash.className = 'goal-flash'; }, 500);
      }
      setTimeout(() => {
        useGameStore.getState().clearGoal();
      }, 2000);
    };
    engine.onEnd = () => {
      useGameStore.getState().setEnd();
    };

    // Keyboard
    engine.keyboardInput.attach(
      () => {
        // Toggle pause/menu overlay
        const currentlyPaused = useGameStore.getState().isPaused;
        if (!currentlyPaused) {
          useGameStore.getState().setPaused(true);
          if (myRole === 'solo') engine.pause();
        } else {
          useGameStore.getState().setPaused(false);
          if (myRole === 'solo') engine.resume();
        }
      },
      () => engine.getLocalPlayer()
    );
    engine.keyboardInput.setGameState(engine.getState());

    // Touch
    if (zoneRef.current && jBaseRef.current && jKnobRef.current) {
      engine.touchInput.attach(
        zoneRef.current,
        jBaseRef.current,
        jKnobRef.current,
        () => engine.getLocalPlayer()
      );
    }

    // Setup nicks
    if (myRole === 'solo') {
      useGameStore.getState().setNicks(
        config.nick,
        config.diff === 'none' ? '—' : 'BOT'
      );
      engine.initSoloGame();
    } else {
      const redNick = lobbyState.red.map(p => p.nick).join(' & ') || 'KIRMIZI';
      const blueNick = lobbyState.blue.map(p => p.nick).join(' & ') || 'MAVİ';
      useGameStore.getState().setNicks(redNick, blueNick);

      const players = [
        ...lobbyState.red.map((p, i) => ({ id: p.id, nick: p.nick, team: 'red' as const, idx: i, total: lobbyState.red.length })),
        ...lobbyState.blue.map((p, i) => ({ id: p.id, nick: p.nick, team: 'blue' as const, idx: i, total: lobbyState.blue.length }))
      ];

      engine.initMultiGame(players, lobbyState.settings, myPeerId || '', myRole === 'host');
      
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
        guestManager.onGameEnd = () => {
          engine.onEnd?.();
        };
      }
    }

    engine.start();
    engineRef.current = engine;

    // Resize handler
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = Math.max(window.innerHeight - HUD_HEIGHT, 100);
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
      engineRef.current = null;
    };
  }, [config, myRole, lobbyState, myPeerId]);

  useEffect(() => {
    if (screen !== 'game') return;
    useGameStore.getState().reset();
    const cleanup = initEngine();
    return cleanup;
  }, [screen, initEngine]);

  const resumeGame = () => {
    useGameStore.getState().setPaused(false);
    engineRef.current?.resume();
  };

  const goMenu = () => {
    engineRef.current?.destroy();
    engineRef.current = null;
    useGameStore.getState().reset();
    setScreen('menu');
  };

  const restartGame = () => {
    useGameStore.getState().reset();
    if (myRole !== 'solo') {
      goMenu();
    } else {
      engineRef.current?.stop();
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = Math.max(window.innerHeight - HUD_HEIGHT, 100);
      }
      engineRef.current?.initSoloGame();
      engineRef.current?.start();
    }
  };

  return (
    <div className="bg-black flex flex-col overflow-hidden w-full h-full" style={{ touchAction: 'none' }}>
      <HUD />

      <div className="absolute left-0 right-0 bottom-0 flex items-center justify-center overflow-hidden"
        style={{ top: `${HUD_HEIGHT}px`, touchAction: 'none', background: '#060a10' }}
      >
        <canvas ref={canvasRef} className="block" style={{ touchAction: 'none' }} />
      </div>

      <div ref={goalFlashRef} className="goal-flash" />

      <JoystickZone zoneRef={zoneRef} jBaseRef={jBaseRef} jKnobRef={jKnobRef} />

      {/* Kick zone hint */}
      <div
        className="absolute bottom-0 right-0 pointer-events-none z-[31]"
        style={{
          top: `${HUD_HEIGHT}px`,
          width: '33.33%',
          borderLeft: '1px solid rgba(255,200,0,0.12)',
        }}
      >
        <span className="absolute bottom-7 left-1/2 -translate-x-1/2 text-[1.2rem] opacity-[0.18]">⚡</span>
      </div>

      <PauseOverlay onResume={resumeGame} onMenu={goMenu} />
      <GoalOverlay />
      <EndOverlay onRestart={restartGame} onMenu={goMenu} />
    </div>
  );
}
