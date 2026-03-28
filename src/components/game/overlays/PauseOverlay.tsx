'use client';

import { useGameStore } from '@/stores/useGameStore';
import { useLobbyStore } from '@/stores/useLobbyStore';
import { OverlayButton } from '@/components/ui/OverlayButton';

interface PauseOverlayProps {
  onResume: () => void;
  onMenu: () => void;
  onLobby?: () => void;
}

export function PauseOverlay({ onResume, onMenu, onLobby }: PauseOverlayProps) {
  const isPaused = useGameStore((s) => s.paused);
  const myRole = useLobbyStore((s) => s.myRole);

  if (!isPaused) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center flex-col gap-2.5 z-[100]"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', pointerEvents: 'all' }}
    >
      <div className="text-[clamp(1.6rem,5vw,2.6rem)] font-black tracking-tight mb-4 text-[var(--accent)]">⏸ DURAKLATILDI</div>
      <div className="flex flex-col gap-3 w-[220px]">
        <OverlayButton onClick={onResume}>DEVAM ET</OverlayButton>
        {myRole === 'host' && onLobby && (
          <OverlayButton onClick={onLobby} className="!border-[var(--yellow)] !text-[var(--yellow)]">LOBIYE DON</OverlayButton>
        )}
        <OverlayButton onClick={onMenu} variant="secondary">ANA MENU</OverlayButton>
      </div>
    </div>
  );
}
