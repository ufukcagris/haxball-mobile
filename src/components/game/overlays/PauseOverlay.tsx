'use client';

import { useGameStore } from '@/stores/useGameStore';
import { OverlayButton } from '@/components/ui/OverlayButton';

interface PauseOverlayProps {
  onResume: () => void;
  onMenu: () => void;
}

export function PauseOverlay({ onResume, onMenu }: PauseOverlayProps) {
  const show = useGameStore((s) => s.showPauseOverlay);

  if (!show) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center flex-col gap-2.5 z-[100]"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)' }}
    >
      <div className="text-[clamp(1.6rem,5vw,2.6rem)] font-black tracking-tight">⏸ DURAKLADI</div>
      <OverlayButton onClick={onResume}>DEVAM ET</OverlayButton>
      <OverlayButton onClick={onMenu} variant="secondary">ANA MENU</OverlayButton>
    </div>
  );
}
