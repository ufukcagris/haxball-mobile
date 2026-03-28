'use client';

import { useAppStore } from '@/stores/useAppStore';
import { useLobbyStore } from '@/stores/useLobbyStore';
import { PlayButton } from '@/components/ui/PlayButton';
import { SelectorButton } from '@/components/ui/SelectorButton';
import { getSharedHost, resetSharedHost } from './CreateRoomScreen';
import { getSharedGuest } from './JoinRoomScreen';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Toast } from '@/components/ui/Toast';
import { tryAutoFullscreen } from '@/utils/fullscreen';
import { activeEngine } from './GameScreen';

interface LobbyScreenProps {
  isOverlay?: boolean;
  onBackToGame?: () => void;
  onEndMatch?: () => void;
}

export function LobbyScreen({
  isOverlay = false,
  onBackToGame,
  onEndMatch,
}: LobbyScreenProps) {
  const { config, setScreen } = useAppStore();
  const {
    lobbyState,
    myRole,
    myPeerId,
    selectedChipId,
    setSelectedChip,
    setLobbyState,
    resetLobby,
    addToLobby,
    chatMessages,
    addChatMessage,
  } = useLobbyStore();

  const [toast, setToast] = useState({ message: '', visible: false });
  const [chatInput, setChatInput] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const colors = [
    '#00e5ff',
    '#ff3d71',
    '#00ff88',
    '#ffd600',
    '#ff8800',
    '#ff00ff',
    '#ffffff',
    '#4ade80',
    '#60a5fa',
    '#f87171',
  ];

  const getNickColor = (nick: string) => {
    let hash = 0;
    for (let i = 0; i < nick.length; i++) {
      hash = nick.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const ls = lobbyState;
  const isHost = myRole === 'host';
  const total = ls.red.length + ls.blue.length + ls.spec.length;

  const triggerInGameBubble = useCallback(
    (nick: string, message: string) => {
      if (!activeEngine) return;
      const all = [...ls.red, ...ls.blue, ...ls.spec];
      const p = all.find((x) => x.nick === nick);
      if (p) {
        activeEngine.triggerChatBubble(p.id, message);
      }
    },
    [ls.red, ls.blue, ls.spec],
  );

  const setTypingStatus = useCallback(
    (isTyping: boolean) => {
      const nick = config.nick;
      if (isHost) {
        getSharedHost()?.broadcastTyping(nick, isTyping);
        if (activeEngine && myPeerId)
          activeEngine.setTyping(myPeerId, isTyping);
      } else {
        getSharedGuest()?.sendTyping(nick, isTyping);
      }
    },
    [isHost, config.nick, myPeerId],
  );

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Sync guest with game start and lobby updates
  useEffect(() => {
    if (!isHost) {
      const guest = getSharedGuest();
      if (guest) {
        guest.onGameStart = () => {
          console.log('[LobbyScreen] Guest received game_start!');
          if (!isOverlay) setScreen('game');
        };
        guest.onLobbyUpdate = (state) => {
          setLobbyState(state);
        };
        guest.onChatMessage = (nick, msg) => {
          addChatMessage(nick, msg);
          triggerInGameBubble(nick, msg);
        };
        guest.onPlayerTyping = (nick, typing) => {
          if (!activeEngine) return;
          const p = [...ls.red, ...ls.blue, ...ls.spec].find(
            (x) => x.nick === nick,
          );
          if (p) activeEngine.setTyping(p.id, typing);
        };
        guest.onNickUpdate = (newNick) => {
          console.log('[LobbyScreen] Nick updated by host:', newNick);
          useAppStore.getState().setConfig({ nick: newNick });
        };
      }
    } else {
      const host = getSharedHost();
      if (host) {
        host.onChatMessage = (nick, msg) => {
          addChatMessage(nick, msg);
          triggerInGameBubble(nick, msg);
        };
        host.onPlayerTyping = (nick, typing) => {
          if (!activeEngine) return;
          const p = [...ls.red, ...ls.blue, ...ls.spec].find(
            (x) => x.nick === nick,
          );
          if (p) activeEngine.setTyping(p.id, typing);
        };
      }
    }
  }, [
    isHost,
    setScreen,
    setLobbyState,
    isOverlay,
    addChatMessage,
    triggerInGameBubble,
    ls.red,
    ls.blue,
    ls.spec,
  ]);

  // Broadcast lobby changes when host modifies state
  useEffect(() => {
    if (isHost) {
      getSharedHost()?.broadcastLobby(ls);
    }
  }, [ls, isHost]);

  // Late join sync: If match is live, go to game screen
  useEffect(() => {
    if (ls.isLive && !isOverlay) {
      console.log('[LobbyScreen] Joining a live match, switching to game...');
      setScreen('game');
    }
  }, [ls.isLive, isOverlay, setScreen]);

  const sendChat = () => {
    const msg = chatInput.trim();
    if (!msg) return;

    let currentNick = config.nick;
    if (myPeerId) {
      const found = [...ls.red, ...ls.blue, ...ls.spec].find(
        (p) => p.id === myPeerId,
      );
      if (found) currentNick = found.nick;
    }

    if (isHost) {
      getSharedHost()?.broadcastChat(currentNick, msg);
      addChatMessage(currentNick, msg);
      triggerInGameBubble(currentNick, msg);
    } else {
      getSharedGuest()?.sendChat(currentNick, msg);
    }
    setChatInput('');
  };

  const onChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') sendChat();
  };

  const copyCode = () => {
    const code = ls.hostId || myPeerId || '';
    if (!code) return;
    navigator.clipboard?.writeText(code).then(() => {
      setToast({ message: '📋 Kod kopyalandi!', visible: true });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
    });
  };

  const selectChip = (pid: string) => {
    setSelectedChip(selectedChipId === pid ? null : pid);
  };

  const dropSelected = (team: 'red' | 'blue' | 'spec') => {
    if (!isHost || !selectedChipId) return;
    const perTeam = ls.maxPlayers / 2;
    if (team !== 'spec' && ls[team].length >= perTeam) return;
    const nick = findNick(selectedChipId);
    addToLobby(selectedChipId, nick, team);
    setSelectedChip(null);

    // Immediate broadcast for mid-game team changes
    if (isOverlay) {
      const updatedLs = useLobbyStore.getState().lobbyState;
      getSharedHost()?.broadcastLobby(updatedLs);
    }
  };

  const findNick = (pid: string): string => {
    for (const t of ['red', 'blue', 'spec'] as const) {
      const p = ls[t].find((x) => x.id === pid);
      if (p) return p.nick;
    }
    return 'Oyuncu';
  };

  const randomize = () => {
    if (!isHost) return;
    const perTeam = Math.floor(ls.maxPlayers / 2);
    const all = [...ls.red, ...ls.blue, ...ls.spec];
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    setLobbyState({
      ...ls,
      red: all.slice(0, perTeam),
      blue: all.slice(perTeam, perTeam * 2),
      spec: all.slice(perTeam * 2),
    });
  };

  const setSetting = (
    key: 'pitch' | 'time' | 'goals',
    val: string | number,
  ) => {
    if (!isHost) return;
    setLobbyState({
      ...ls,
      settings: { ...ls.settings, [key]: val },
    });
  };

  const startMatch = () => {
    if (!isHost) return;
    const players = [
      ...ls.red.map((p, i) => ({
        id: p.id,
        nick: p.nick,
        team: 'red' as const,
        idx: i,
        total: ls.red.length,
      })),
      ...ls.blue.map((p, i) => ({
        id: p.id,
        nick: p.nick,
        team: 'blue' as const,
        idx: i,
        total: ls.blue.length,
      })),
    ];
    getSharedHost()?.broadcastGameStart(players, ls.settings);
    tryAutoFullscreen();
    setScreen('game');
  };

  const leaveLobby = () => {
    if (isHost) {
      getSharedHost()?.closeAll();
      resetSharedHost();
    } else {
      getSharedGuest()?.disconnect();
    }
    resetLobby();
    setScreen('menu');
  };

  const canStart = ls.red.length > 0 || ls.blue.length > 0;

  if (showExitConfirm) {
    return (
      <div
        className='flex flex-col items-center justify-center gap-6 w-full h-full'
        style={{
          background:
            'radial-gradient(ellipse at 40% 30%, #0d2040 0%, #0a0e1a 70%)',
        }}
      >
        <div className='menu-bg' />
        <div className='text-[1.2rem] font-bold text-white z-1 text-center leading-tight'>
          Odadan ayrilmak istedigine
          <br />
          emin misin?
        </div>
        <div className='flex flex-col gap-3 w-[240px] z-1'>
          <PlayButton onClick={leaveLobby} variant='red' className='py-3!'>
            EVET, AYRIL
          </PlayButton>
          <PlayButton
            onClick={() => setShowExitConfirm(false)}
            variant='secondary'
            className='py-3!'
          >
            HAYIR, KAL
          </PlayButton>
        </div>
      </div>
    );
  }

  const renderTeam = (
    team: 'red' | 'blue' | 'spec',
    label: string,
    borderColor: string,
  ) => (
    <div
      onClick={() => dropSelected(team)}
      className={`bg-[rgba(17,24,39,0.75)] rounded-[14px] py-2 px-[6px] flex flex-col gap-[5px] min-h-[260px]
        border-[1.5px] cursor-pointer transition-all duration-200`}
      style={{ borderColor }}
    >
      <div
        className='text-[0.6rem] font-black tracking-[2px] uppercase text-center pb-1 border-b border-white/8'
        style={{
          color:
            team === 'red'
              ? 'var(--red-team)'
              : team === 'blue'
                ? 'var(--blue-team)'
                : 'var(--text-dim)',
        }}
      >
        {label}
      </div>
      {ls[team].map((p) => (
        <div
          key={p.id}
          onClick={(e) => {
            e.stopPropagation();
            if (isHost) selectChip(p.id);
          }}
          className={`bg-white/7 rounded-lg py-[5px] px-[7px] text-[0.72rem] font-bold
            flex items-center justify-between gap-1 cursor-pointer transition-all duration-150
            border-[1.5px]`}
          style={{
            borderColor:
              p.id === selectedChipId
                ? 'var(--yellow)'
                : p.id === myPeerId
                  ? 'rgba(255,255,255,0.25)'
                  : team === 'red'
                    ? 'rgba(255,61,113,0.25)'
                    : team === 'blue'
                      ? 'rgba(0,229,255,0.25)'
                      : 'transparent',
            background:
              p.id === selectedChipId ? 'rgba(255,214,0,0.12)' : undefined,
          }}
        >
          <span className='overflow-hidden text-ellipsis whitespace-nowrap flex-1'>
            {p.nick}
          </span>
          {p.id === ls.hostId && (
            <span className='text-[0.58rem] text-(--yellow)'>HOST</span>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div
      className='flex flex-col items-center justify-center overflow-y-auto py-4 px-[6px] gap-3 w-full h-full'
      style={{
        background:
          'radial-gradient(ellipse at 40% 30%, #0d2040 0%, #0a0e1a 70%)',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
      }}
    >
      <div className='menu-bg' />
      <Toast
        message={toast.message}
        visible={toast.visible}
        color='var(--accent)'
      />

      <div className='w-[min(98vw,900px)] flex flex-col gap-3 shrink-0'>
        {/* Header */}
        <div className='flex items-center justify-between gap-2 z-1'>
          <div className='flex-1 min-w-0'>
            <div className='text-[0.85rem] font-black text-(--accent) tracking-[1px] uppercase truncate'>
              {ls.roomName || 'Lobi'}
            </div>
            <div className='text-[0.72rem] text-(--text-dim)'>
              {total} / {ls.maxPlayers} oyuncu
            </div>
          </div>
          <div
            onClick={copyCode}
            className='bg-(--surface2) border-2 border-(--accent) rounded-[12px] py-2 px-3
              text-center cursor-pointer transition-colors duration-150 shrink-0 max-w-[55%] min-w-[140px]
              active:bg-[rgba(0,229,255,0.15)]'
            style={{ touchAction: 'manipulation' }}
          >
            <div className='text-[0.58rem] text-(--text-dim) tracking-[2px] uppercase mb-0.5'>
              📋 Oda Kodu — Kopyala
            </div>
            <div className="font-['Share_Tech_Mono',monospace] text-[clamp(0.65rem,1.4vw,0.9rem)] text-(--accent) tracking-[2px] break-all leading-[1.4] truncate">
              {ls.hostId || myPeerId || '—'}
            </div>
          </div>
        </div>

        {/* Teams */}
        <div className='grid grid-cols-3 gap-1.5 z-1'>
          {renderTeam('red', '🔴 Kirmizi', 'rgba(255,61,113,0.3)')}
          {renderTeam('spec', '👁 Izleyici', 'rgba(100,116,139,0.3)')}
          {renderTeam('blue', '🔵 Mavi', 'rgba(0,229,255,0.3)')}
        </div>

        {/* Settings */}
        <div
          className='bg-[rgba(17,24,39,0.75)] rounded-[14px] p-2.5 grid grid-cols-3 gap-2 z-1'
          style={{ pointerEvents: isHost ? 'all' : 'none' }}
        >
          <div className='flex flex-col gap-1'>
            <div className='text-[0.58rem] font-bold tracking-[2px] uppercase text-(--text-dim)'>
              Saha
            </div>
            <div className='flex gap-1 flex-wrap'>
              {(['small', 'medium', 'large'] as const).map((v) => (
                <SelectorButton
                  key={v}
                  active={ls.settings.pitch === v}
                  onClick={() => setSetting('pitch', v)}
                  className='text-[0.7rem] py-[5px] border-[1.5px]! rounded-[7px]! min-w-[32px]'
                >
                  {v === 'small' ? 'Kucuk' : v === 'medium' ? 'Orta' : 'Buyuk'}
                </SelectorButton>
              ))}
            </div>
          </div>
          <div className='flex flex-col gap-1'>
            <div className='text-[0.58rem] font-bold tracking-[2px] uppercase text-(--text-dim)'>
              Sure
            </div>
            <div className='flex gap-1 flex-wrap'>
              {[
                { v: 120, l: '2dk' },
                { v: 180, l: '3dk' },
                { v: 300, l: '5dk' },
                { v: 0, l: '∞' },
              ].map((t) => (
                <SelectorButton
                  key={t.v}
                  active={ls.settings.time === t.v}
                  onClick={() => setSetting('time', t.v)}
                  className='text-[0.7rem] py-[5px] border-[1.5px]! rounded-[7px]! min-w-[32px]'
                >
                  {t.l}
                </SelectorButton>
              ))}
            </div>
          </div>
          <div className='flex flex-col gap-1'>
            <div className='text-[0.58rem] font-bold tracking-[2px] uppercase text-(--text-dim)'>
              Gol
            </div>
            <div className='flex gap-1 flex-wrap'>
              {[1, 3, 5, 0].map((g) => (
                <SelectorButton
                  key={g}
                  active={ls.settings.goals === g}
                  onClick={() => setSetting('goals', g)}
                  className='text-[0.7rem] py-[5px] border-[1.5px]! rounded-[7px]! min-w-[32px]'
                >
                  {g === 0 ? '∞' : g}
                </SelectorButton>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className='h-[160px] flex flex-col bg-[rgba(17,24,39,0.75)] rounded-[14px] border border-white/5 overflow-hidden shrink-0'>
          <div
            className='flex-1 overflow-y-auto p-2 space-y-1.5'
            ref={chatScrollRef}
          >
            {chatMessages.length === 0 && (
              <div className='h-full flex items-center justify-center text-(--text-dim) text-[0.65rem] italic opacity-50 uppercase tracking-widest'>
                Sohbet baslasin...
              </div>
            )}
            {chatMessages.map((m) => (
              <div
                key={m.id}
                className='text-[0.75rem] leading-tight break-all'
              >
                <span
                  className='font-black mr-1.5'
                  style={{ color: getNickColor(m.nick) }}
                >
                  [{m.nick}]:
                </span>
                <span className='text-white/90'>{m.message}</span>
              </div>
            ))}
          </div>
          <div className='p-1.5 bg-black/20 border-t border-white/5 flex gap-1.5'>
            <input
              type='text'
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={onChatKeyDown}
              onFocus={() => setTypingStatus(true)}
              onBlur={() => setTypingStatus(false)}
              placeholder='Mesaj yaz...'
              className='flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[0.8rem] text-white focus:outline-none focus:border-(--accent)/50'
            />
            <button
              onClick={sendChat}
              className='bg-(--accent) text-black text-[0.7rem] font-black px-3 rounded-lg active:scale-95 transition-transform uppercase'
            >
              Gonder
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className='flex gap-2 z-1 pb-2'>
          {!isOverlay ? (
            <>
              <PlayButton
                onClick={() => setShowExitConfirm(true)}
                variant='secondary'
                className='flex-none w-[80px] py-[12px]! text-[0.9rem]! rounded-[11px]!'
              >
                ← Cik
              </PlayButton>
              {isHost && (
                <PlayButton
                  onClick={randomize}
                  variant='purple'
                  className='flex-1 py-[12px]! text-[0.9rem]! rounded-[11px]!'
                >
                  🎲 Rastgele
                </PlayButton>
              )}
              <PlayButton
                onClick={startMatch}
                disabled={!canStart || !isHost}
                className='flex-2 py-[12px]! text-[0.9rem]! rounded-[11px]!'
              >
                {isHost ? '⚽ MACA BASLA' : 'Host baslatacak...'}
              </PlayButton>
            </>
          ) : (
            <>
              <PlayButton
                onClick={onBackToGame || (() => {})}
                className='flex-2 py-[12px]! text-[0.9rem]! rounded-[11px]!'
              >
                ← OYUNA DON
              </PlayButton>
              {isHost && (
                <PlayButton
                  onClick={onEndMatch || (() => {})}
                  variant='secondary'
                  className='flex-1 py-[12px]! text-[0.9rem]! rounded-[11px]! border-red-500/50! text-red-400!'
                >
                  MACI BITIR
                </PlayButton>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
