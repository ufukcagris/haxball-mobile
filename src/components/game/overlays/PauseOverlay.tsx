'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/useGameStore';
import { useLobbyStore } from '@/stores/useLobbyStore';
import { OverlayButton } from '@/components/ui/OverlayButton';
import { IngameLobbyOverlay } from './IngameLobbyOverlay';

interface PauseOverlayProps {
  onResume: () => void;
  onMenu: () => void;
  onLobby?: () => void;
}

export function PauseOverlay({ onResume, onMenu, onLobby }: PauseOverlayProps) {
  const isPaused = useGameStore((s) => s.paused);
  const myRole = useLobbyStore((s) => s.myRole);
  const [showConfirmExit, setShowConfirmExit] = useState(false);

  if (!isPaused) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center flex-col p-4 z-100"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', pointerEvents: 'all' }}
    >
      {showConfirmExit ? (
        <div className="flex flex-col items-center">
          <div className="text-[1.1rem] font-bold text-white mb-6 text-center leading-tight">
            Oyundan cikmak istedigine<br/>emin misin?
          </div>
          <div className="flex flex-col gap-3 w-[220px]">
            <OverlayButton onClick={onMenu} variant="secondary" className="border-red-500/50! text-red-400!">EVET, CIK</OverlayButton>
            <OverlayButton onClick={() => setShowConfirmExit(false)}>HAYIR, DEVAM ET</OverlayButton>
          </div>
        </div>
      ) : (
        <>
          <div className="text-[clamp(1.4rem,4vw,2.2rem)] font-black tracking-tight mb-6 text-(--accent) uppercase">⏸ DURAKLATILDI</div>
          
          <div className="flex flex-col gap-3 w-[220px]">
            <OverlayButton onClick={onResume}>DEVAM ET</OverlayButton>
            {onLobby && myRole !== 'solo' && (
              <OverlayButton onClick={onLobby} className="border-(--yellow)! text-(--yellow)!">LOBIYI AC</OverlayButton>
            )}
            <OverlayButton onClick={() => setShowConfirmExit(true)} variant="secondary">OYUNDAN CIK</OverlayButton>
          </div>

          {myRole !== 'solo' && (
            <>
              <div className="mt-8 text-[0.6rem] text-white/40 uppercase tracking-[2px] font-bold">Takimlar</div>
              <IngameLobbyOverlay />
            </>
          )}

          {myRole === 'host' && (
            <div className="mt-4 text-[0.65rem] text-(--yellow) opacity-60">
              * Oyuncu sec → takima tikla (Takim degistir)
            </div>
          )}
        </>
      )}
    </div>
  );
}
