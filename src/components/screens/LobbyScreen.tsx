'use client';

import { useAppStore } from '@/stores/useAppStore';
import { useLobbyStore } from '@/stores/useLobbyStore';
import { PlayButton } from '@/components/ui/PlayButton';
import { SelectorButton } from '@/components/ui/SelectorButton';
import { getSharedPeer, getSharedHost } from './CreateRoomScreen';
import { getSharedGuest } from './JoinRoomScreen';
import { useState, useCallback, useEffect } from 'react';
import { Toast } from '@/components/ui/Toast';
import { tryAutoFullscreen } from '@/utils/fullscreen';

export function LobbyScreen() {
  const { setScreen } = useAppStore();
  const {
    lobbyState, myRole, myPeerId, selectedChipId,
    setSelectedChip, setLobbyState, resetLobby, addToLobby,
  } = useLobbyStore();

  const [toast, setToast] = useState({ message: '', visible: false });

  const ls = lobbyState;
  const isHost = myRole === 'host';
  const total = ls.red.length + ls.blue.length + ls.spec.length;

  // Broadcast lobby changes when host modifies state
  useEffect(() => {
    if (isHost) {
      getSharedHost()?.broadcastLobby(ls);
    }
  }, [ls, isHost]);

  const copyCode = () => {
    const code = ls.hostId || myPeerId || '';
    if (!code) return;
    navigator.clipboard?.writeText(code).then(() => {
      setToast({ message: '📋 Kod kopyalandi!', visible: true });
      setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
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
  };

  const findNick = (pid: string): string => {
    for (const t of ['red', 'blue', 'spec'] as const) {
      const p = ls[t].find(x => x.id === pid);
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

  const setSetting = (key: 'pitch' | 'time' | 'goals', val: any) => {
    if (!isHost) return;
    setLobbyState({
      ...ls,
      settings: { ...ls.settings, [key]: val },
    });
  };

  const startMatch = () => {
    if (!isHost) return;
    const players = [
      ...ls.red.map((p, i) => ({ id: p.id, nick: p.nick, team: 'red' as const, idx: i, total: ls.red.length })),
      ...ls.blue.map((p, i) => ({ id: p.id, nick: p.nick, team: 'blue' as const, idx: i, total: ls.blue.length })),
    ];
    getSharedHost()?.broadcastGameStart(players, ls.settings);
    tryAutoFullscreen();
    setScreen('game');
  };

  const leaveLobby = () => {
    if (isHost) {
      getSharedHost()?.closeAll();
      const { resetSharedHost } = require('./CreateRoomScreen');
      resetSharedHost();
    } else {
      getSharedGuest()?.disconnect();
    }
    resetLobby();
    setScreen('menu');
  };

  const canStart = ls.red.length > 0 || ls.blue.length > 0;

  const renderTeam = (team: 'red' | 'blue' | 'spec', label: string, borderColor: string) => (
    <div
      onClick={() => dropSelected(team)}
      className={`bg-[rgba(17,24,39,0.75)] rounded-[14px] py-2 px-[6px] flex flex-col gap-[5px] min-h-[140px]
        border-[1.5px] cursor-pointer transition-all duration-200`}
      style={{ borderColor }}
    >
      <div
        className="text-[0.6rem] font-black tracking-[2px] uppercase text-center pb-1 border-b border-white/[0.08]"
        style={{ color: team === 'red' ? 'var(--red-team)' : team === 'blue' ? 'var(--blue-team)' : 'var(--text-dim)' }}
      >
        {label}
      </div>
      {ls[team].map(p => (
        <div
          key={p.id}
          onClick={(e) => { e.stopPropagation(); if (isHost) selectChip(p.id); }}
          className={`bg-white/[0.07] rounded-lg py-[5px] px-[7px] text-[0.72rem] font-bold
            flex items-center justify-between gap-1 cursor-pointer transition-all duration-150
            border-[1.5px]`}
          style={{
            borderColor: p.id === selectedChipId ? 'var(--yellow)' :
              p.id === myPeerId ? 'rgba(255,255,255,0.25)' :
              team === 'red' ? 'rgba(255,61,113,0.25)' :
              team === 'blue' ? 'rgba(0,229,255,0.25)' : 'transparent',
            background: p.id === selectedChipId ? 'rgba(255,214,0,0.12)' : undefined,
          }}
        >
          <span className="overflow-hidden text-ellipsis whitespace-nowrap flex-1">{p.nick}</span>
          {p.id === ls.hostId && <span className="text-[0.58rem] text-[var(--yellow)]">HOST</span>}
        </div>
      ))}
    </div>
  );

  return (
    <div
      className="flex flex-col items-center justify-center overflow-y-auto py-4 px-[6px] gap-3 w-full h-full"
      style={{
        background: 'radial-gradient(ellipse at 40% 30%, #0d2040 0%, #0a0e1a 70%)',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
      }}
    >
      <div className="menu-bg" />
      <Toast message={toast.message} visible={toast.visible} color="var(--accent)" />

      {/* Header */}
      <div className="w-[min(98vw,900px)] flex items-center justify-between shrink-0 gap-2 z-[1]">
        <div className="flex-1 min-w-0">
          <div className="text-[0.85rem] font-black text-[var(--accent)] tracking-[1px] uppercase truncate">
            {ls.roomName || 'Lobi'}
          </div>
          <div className="text-[0.72rem] text-[var(--text-dim)]">{total} / {ls.maxPlayers} oyuncu</div>
        </div>
        <div
          onClick={copyCode}
          className="bg-[var(--surface2)] border-2 border-[var(--accent)] rounded-[12px] py-2 px-3
            text-center cursor-pointer transition-colors duration-150 shrink-0 max-w-[55%] min-w-[140px]
            active:bg-[rgba(0,229,255,0.15)]"
          style={{ touchAction: 'manipulation' }}
        >
          <div className="text-[0.58rem] text-[var(--text-dim)] tracking-[2px] uppercase mb-0.5">📋 Oda Kodu — Kopyala</div>
          <div className="font-['Share_Tech_Mono',monospace] text-[clamp(0.65rem,1.4vw,0.9rem)] text-[var(--accent)] tracking-[2px] break-all leading-[1.4] truncate">
            {ls.hostId || myPeerId || '—'}
          </div>
        </div>
      </div>

      {/* Teams */}
      <div className="grid grid-cols-3 gap-1.5 w-[min(98vw,900px)] shrink-0 z-[1]">
        {renderTeam('red', '🔴 Kirmizi', 'rgba(255,61,113,0.3)')}
        {renderTeam('spec', '👁 Izleyici', 'rgba(100,116,139,0.3)')}
        {renderTeam('blue', '🔵 Mavi', 'rgba(0,229,255,0.3)')}
      </div>

      <div className="text-[0.65rem] text-[var(--text-dim)] text-center z-[1]">
        {isHost ? 'Oyuncu sec → takim kolonuna tasi' : 'Host maci baslatana kadar bekle'}
      </div>

      {/* Settings */}
      <div className="w-[min(98vw,900px)] bg-[rgba(17,24,39,0.75)] rounded-[14px] p-2.5 grid grid-cols-3 gap-2 shrink-0 z-[1]"
        style={{ pointerEvents: isHost ? 'all' : 'none' }}
      >
        <div className="flex flex-col gap-1">
          <div className="text-[0.58rem] font-bold tracking-[2px] uppercase text-[var(--text-dim)]">Saha</div>
          <div className="flex gap-1 flex-wrap">
            {(['small', 'medium', 'large'] as const).map(v => (
              <SelectorButton key={v} active={ls.settings.pitch === v} onClick={() => setSetting('pitch', v)} className="text-[0.7rem] py-[5px] !border-[1.5px] !rounded-[7px] min-w-[32px]">
                {v === 'small' ? 'Kucuk' : v === 'medium' ? 'Orta' : 'Buyuk'}
              </SelectorButton>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-[0.58rem] font-bold tracking-[2px] uppercase text-[var(--text-dim)]">Sure</div>
          <div className="flex gap-1 flex-wrap">
            {[{ v: 120, l: '2dk' }, { v: 180, l: '3dk' }, { v: 300, l: '5dk' }, { v: 0, l: '∞' }].map(t => (
              <SelectorButton key={t.v} active={ls.settings.time === t.v} onClick={() => setSetting('time', t.v)} className="text-[0.7rem] py-[5px] !border-[1.5px] !rounded-[7px] min-w-[32px]">
                {t.l}
              </SelectorButton>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-[0.58rem] font-bold tracking-[2px] uppercase text-[var(--text-dim)]">Gol Limiti</div>
          <div className="flex gap-1 flex-wrap">
            {[1, 3, 5, 0].map(g => (
              <SelectorButton key={g} active={ls.settings.goals === g} onClick={() => setSetting('goals', g)} className="text-[0.7rem] py-[5px] !border-[1.5px] !rounded-[7px] min-w-[32px]">
                {g === 0 ? '∞' : g}
              </SelectorButton>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="w-[min(98vw,900px)] flex gap-2 shrink-0 z-[1]">
        <PlayButton onClick={leaveLobby} variant="secondary" className="flex-none w-[80px] !py-[12px] !text-[0.9rem] !rounded-[11px]">← Cik</PlayButton>
        {isHost && (
          <PlayButton onClick={randomize} variant="purple" className="flex-1 !py-[12px] !text-[0.9rem] !rounded-[11px]">🎲 Rastgele</PlayButton>
        )}
        <PlayButton onClick={startMatch} disabled={!canStart || !isHost} className="flex-[2] !py-[12px] !text-[0.9rem] !rounded-[11px]">
          {isHost ? '⚽ MACA BASLA' : 'Host baslatacak...'}
        </PlayButton>
      </div>
    </div>
  );
}
