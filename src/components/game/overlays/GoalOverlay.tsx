'use client';

import { useGameStore } from '@/stores/useGameStore';
import { useAppStore } from '@/stores/useAppStore';

export function GoalOverlay() {
  const { showGoalOverlay, goalTeam } = useGameStore();
  const { config } = useAppStore();

  if (!showGoalOverlay || !goalTeam) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center flex-col gap-2.5 z-[100]"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)' }}
    >
      <div
        className="text-[3rem] font-black"
        style={{ color: goalTeam === 'red' ? 'var(--red-team)' : 'var(--blue-team)' }}
      >
        ⚽ GOL!
      </div>
      <div className="text-[0.85rem] text-[var(--text-dim)] tracking-[1px]">
        {goalTeam === 'red' ? `${config.nick} GOL ATTI! 🔴` : 'BOT GOL ATTI! 🔵'}
      </div>
    </div>
  );
}
