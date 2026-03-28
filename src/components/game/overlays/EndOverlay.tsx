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
  const { config } = useAppStore();

  if (!showEndOverlay) return null;

  let sub = 'Beraberlik! 🤝';
  if (scoreRed > scoreBlue) sub = `${config.nick} Kazandi! 🏆 🔴`;
  else if (scoreBlue > scoreRed) sub = 'Bot Kazandi! 🤖 🔵';

  return (
    <div className="absolute inset-0 flex items-center justify-center flex-col gap-2.5 z-[100]"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)' }}
    >
      <div className="text-[clamp(1.6rem,5vw,2.6rem)] font-black tracking-tight">⚽ MAC SONA ERDI</div>
      <div className="flex items-center gap-[18px] font-['Share_Tech_Mono',monospace] text-[2.2rem] font-bold">
        <span style={{ color: 'var(--red-team)' }}>{scoreRed}</span>
        <span className="text-[var(--text-dim)] text-[1.4rem]">-</span>
        <span style={{ color: 'var(--blue-team)' }}>{scoreBlue}</span>
      </div>
      <div className="text-[0.85rem] text-[var(--text-dim)] tracking-[1px]">{sub}</div>
      <OverlayButton onClick={onRestart}>TEKRAR OYNA</OverlayButton>
      <OverlayButton onClick={onMenu} variant="secondary">ANA MENU</OverlayButton>
    </div>
  );
}
