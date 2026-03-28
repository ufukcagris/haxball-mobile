'use client';

import { useGameStore } from '@/stores/useGameStore';
import { useAppStore } from '@/stores/useAppStore';
import { OverlayButton } from '@/components/ui/OverlayButton';

interface EndOverlayProps {
  onRestart: () => void;
  onMenu: () => void;
}

export function EndOverlay({ onRestart, onMenu }: EndOverlayProps) {
  const { showEndOverlay, scoreRed, scoreBlue } = useGameStore();

  if (!showEndOverlay) return null;

  const winner = scoreRed > scoreBlue ? 'red' : scoreBlue > scoreRed ? 'blue' : 'draw';

  return (
    <div className="absolute inset-0 flex items-center justify-center flex-col gap-2.5 z-[100]"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
    >
      <div className="text-[0.8rem] font-black tracking-[4px] text-white/40 uppercase mb-2">Mac Sona Erdi</div>
      
      <div className="flex items-center gap-[18px] font-['Share_Tech_Mono',monospace] text-[2.2rem] font-bold">
        <span className="text-[var(--red-team)]" style={{ textShadow: '0 0 15px rgba(255,61,113,0.5)' }}>{scoreRed}</span>
        <span className="text-white/20">-</span>
        <span className="text-[var(--blue-team)]" style={{ textShadow: '0 0 15px rgba(0,229,255,0.5)' }}>{scoreBlue}</span>
      </div>

      <div className={`mt-4 text-[1.1rem] font-black tracking-[2px] uppercase
        ${winner === 'red' ? 'text-[var(--red-team)]' : winner === 'blue' ? 'text-[var(--blue-team)]' : 'text-white/60'}`}
      >
        {winner === 'red' ? '🔴 KIRMIZI KAZANDI' : winner === 'blue' ? '🔵 MAVİ KAZANDI' : '🤝 BERABERE'}
      </div>

      <div className="mt-10 text-[0.65rem] text-white/30 tracking-[2px] animate-pulse uppercase">
        3 saniye sonra lobiye donuluyor...
      </div>
    </div>
  );
}
