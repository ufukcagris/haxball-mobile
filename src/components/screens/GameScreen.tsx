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
import { LobbyScreen } from './LobbyScreen';

export function GameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const jBaseRef = useRef<HTMLDivElement>(null);
  const jKnobRef = useRef<HTMLDivElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const goalFlashRef = useRef<HTMLDivElement>(null);

  const { config, screen, setScreen } = useAppStore();
  const { paused, setPaused, showFullLobby, setShowFullLobby } = useGameStore();
  const { myRole, lobbyState, myPeerId, setLobbyState } = useLobbyStore();

  const goLobbyReturn = useCallback(() => {
    if (myRole === 'host') {
      const hostManager = getSharedHost();
      if (hostManager) {
        hostManager.broadcastLobbyReturn(lobbyState);
      }
    }
    engineRef.current?.destroy();
    engineRef.current = null;
    useGameStore.getState().reset();
    setScreen('lobby');
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
    });

    engine.onHUDUpdate = (data) => {
      useGameStore.getState().updateHUD(data);
    };
    engine.onGoal = (team) => {
      useGameStore.getState().setGoal(team);
      const flash = goalFlashRef.current;
      if (flash) {
        flash.className = `goal-flash flash-${team}`;
        setTimeout(() => { flash.className = 'goal-flash'; }, 500);
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

    engine.keyboardInput.attach(
      () => {
        const currentlyPaused = useGameStore.getState().paused;
        if (!currentlyPaused) {
          useGameStore.getState().setPaused(true);
          if (myRole === 'solo') engine.pause();
        } else {
          useGameStore.getState().setPaused(false);
          useGameStore.getState().setShowFullLobby(false);
          if (myRole === 'solo') engine.resume();
        }
      },
      () => engine.getLocalPlayer()
    );
    engine.keyboardInput.setGameState(engine.getState());

    if (zoneRef.current && jBaseRef.current && jKnobRef.current) {
      engine.touchInput.attach(
        zoneRef.current,
        jBaseRef.current,
        jKnobRef.current,
        () => engine.getLocalPlayer()
      );
    }

    if (myRole === 'solo') {
      useGameStore.getState().setNicks(config.nick, config.diff === 'none' ? '—' : 'BOT');
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
        guestManager.onGameEnd = (scoreRed, scoreBlue) => {
          // Sync end state for guests
          useGameStore.getState().updateHUD({
            scoreRed,
            scoreBlue,
            timeLeft: 0,
            overtime: false,
            time: config.time
          });
          useGameStore.getState().setEnd();
          
          // Guests also auto return after 3s
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, myRole, myPeerId, setLobbyState, setScreen, JSON.stringify(lobbyState.settings)]);

  useEffect(() => {
    if (screen !== 'game') return;
    useGameStore.getState().reset();
    const cleanup = initEngine();
    return cleanup;
  }, [screen, initEngine]);

  useEffect(() => {
    if (screen === 'game' && myRole !== 'solo' && engineRef.current) {
      const players = [
        ...lobbyState.red.map((p, i) => ({ id: p.id, nick: p.nick, team: 'red' as const, idx: i, total: lobbyState.red.length })),
        ...lobbyState.blue.map((p, i) => ({ id: p.id, nick: p.nick, team: 'blue' as const, idx: i, total: lobbyState.blue.length }))
      ];
      engineRef.current.updateMultiPlayers(players);

      const redNick = lobbyState.red.map(p => p.nick).join(' & ') || 'KIRMIZI';
      const blueNick = lobbyState.blue.map(p => p.nick).join(' & ') || 'MAVİ';
      useGameStore.getState().setNicks(redNick, blueNick);
    }
  }, [lobbyState, screen, myRole]);

  const resumeGame = () => {
    setPaused(false);
    setShowFullLobby(false);
    engineRef.current?.resume();
  };

  const goMenu = () => {
    engineRef.current?.destroy();
    engineRef.current = null;
    useGameStore.getState().reset();
    setScreen('menu');
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

      <div
        className="absolute bottom-0 right-0 pointer-events-none z-31"
        style={{
          top: `${HUD_HEIGHT}px`,
          width: '33.33%',
          borderLeft: '1px solid rgba(255,200,0,0.12)',
        }}
      >
        <span className="absolute bottom-7 left-1/2 -translate-x-1/2 text-[1.2rem] opacity-18">⚡</span>
      </div>

      {!showFullLobby && (
        <PauseOverlay 
          onResume={resumeGame} 
          onMenu={goMenu} 
          onLobby={() => setShowFullLobby(true)} 
        />
      )}

      {showFullLobby && paused && (
        <div className="absolute inset-0 z-110 bg-[#0a0e1a] flex flex-col">
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
