'use client';

import { useLobbyStore } from '@/stores/useLobbyStore';
import { useGameStore } from '@/stores/useGameStore';
import { getSharedHost } from '@/components/screens/CreateRoomScreen';

export function IngameLobbyOverlay() {
  const isPaused = useGameStore((s) => s.paused);
  const {
    lobbyState,
    myRole,
    myPeerId,
    selectedChipId,
    setSelectedChip,
    addToLobby,
  } = useLobbyStore();

  const ls = lobbyState;
  const isHost = myRole === 'host';

  if (!isPaused) return null;

  const selectChip = (pid: string) => {
    setSelectedChip(selectedChipId === pid ? null : pid);
  };

  const dropSelected = (team: 'red' | 'blue' | 'spec') => {
    if (!isHost || !selectedChipId) return;
    const perTeam = ls.maxPlayers / 2;
    if (team !== 'spec' && ls[team].length >= perTeam) return;

    // Find nick
    let nick = 'Oyuncu';
    for (const t of ['red', 'blue', 'spec'] as const) {
      const p = ls[t].find((x) => x.id === selectedChipId);
      if (p) {
        nick = p.nick;
        break;
      }
    }

    addToLobby(selectedChipId, nick, team);
    setSelectedChip(null);

    // Broadcast change immediately so guests see it in their PauseOverlay
    const updatedLs = useLobbyStore.getState().lobbyState;
    getSharedHost()?.broadcastLobby(updatedLs);
  };

  const renderTeam = (
    team: 'red' | 'blue' | 'spec',
    label: string,
    color: string,
  ) => (
    <div
      onClick={() => dropSelected(team)}
      className='flex-1 bg-black/40 rounded-lg p-2 border border-white/10 flex flex-col gap-1.5 min-w-[100px] cursor-pointer'
    >
      <div
        className='text-[0.55rem] font-black uppercase tracking-[1px] text-center mb-1 opacity-70'
        style={{ color }}
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
          className={`py-1 px-1.5 rounded text-[0.65rem] font-bold truncate transition-all
            ${p.id === selectedChipId ? 'bg-(--yellow) text-black shadow-[0_0_8px_rgba(255,214,0,0.4)]' : 'bg-white/10 text-white'}
            ${p.id === myPeerId ? 'ring-1 ring-white/40' : ''}
            ${isHost ? 'cursor-pointer hover:bg-white/20' : 'cursor-default'}
          `}
        >
          {p.nick}
        </div>
      ))}
    </div>
  );

  return (
    <div className='flex flex-col gap-3 w-full max-w-[500px] mt-4 z-101'>
      <div className='grid grid-cols-3 gap-2'>
        {renderTeam('red', 'Kirmizi', 'var(--red-team)')}
        {renderTeam('spec', 'Izleyici', 'var(--text-dim)')}
        {renderTeam('blue', 'Mavi', 'var(--blue-team)')}
      </div>
    </div>
  );
}
