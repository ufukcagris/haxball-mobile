'use client';

import { useGameStore } from '@/stores/useGameStore';
import { useAppStore } from '@/stores/useAppStore';

export function GoalOverlay() {
  const { showGoalOverlay, goalTeam } = useGameStore();

  if (!showGoalOverlay || !goalTeam) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[90]">
      <div className="flex flex-col items-center animate-in zoom-in fade-in duration-300">
        <div
          className="text-[clamp(4rem,15vw,8rem)] font-black italic tracking-[-4px]"
          style={{ 
            color: goalTeam === 'red' ? 'var(--red-team)' : 'var(--blue-team)',
            textShadow: `0 0 40px ${goalTeam === 'red' ? 'rgba(255,61,113,0.8)' : 'rgba(0,229,255,0.8)'}, 0 0 100px rgba(255,255,255,0.3)`,
            filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))'
          }}
        >
          GOOOOL!
        </div>
        <div className="text-[1.2rem] font-black tracking-[6px] uppercase opacity-90 -mt-4 bg-black/40 px-6 py-1 rounded-full border border-white/10"
          style={{ color: goalTeam === 'red' ? 'var(--red-team)' : 'var(--blue-team)' }}
        >
          {goalTeam === 'red' ? 'KIRMIZI TAKIM' : 'MAVİ TAKIM'}
        </div>
      </div>
    </div>
  );
}
