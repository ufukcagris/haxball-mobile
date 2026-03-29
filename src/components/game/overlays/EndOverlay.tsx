'use client';

import { useGameStore } from '@/stores/useGameStore';
import { useLobbyStore } from '@/stores/useLobbyStore';

export function EndOverlay() {
  const { showEndOverlay, scoreRed, scoreBlue } = useGameStore();
  const myRole = useLobbyStore((s) => s.myRole);

  if (!showEndOverlay) return null;

  const winner = scoreRed > scoreBlue ? 'red' : scoreBlue > scoreRed ? 'blue' : 'draw';

  return (
    <div className="absolute inset-0 flex items-center justify-center flex-col z-100"
      style={{ 
        background: 'radial-gradient(circle at center, rgba(13, 32, 64, 0.95) 0%, rgba(6, 10, 16, 0.98) 100%)', 
        backdropFilter: 'blur(15px)',
        animation: 'endOverlayIn 0.5s ease-out forwards'
      }}
    >
      <style jsx global>{`
        @keyframes endOverlayIn {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(15px); }
        }
        @keyframes scorePop {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes winnerPulse {
          0% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.02); filter: brightness(1.2); }
          100% { transform: scale(1); filter: brightness(1); }
        }
      `}</style>

      <div className="text-[0.9rem] font-black tracking-[6px] text-white/30 uppercase mb-6 animate-pulse">
        Final Skoru
      </div>
      
      <div className="flex items-center gap-[30px] font-['Share_Tech_Mono',monospace] text-[clamp(4rem,18vw,7rem)] font-bold"
        style={{ animation: 'scorePop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
      >
        <div className="flex flex-col items-center">
          <span className="text-(--red-team)" style={{ textShadow: '0 0 30px rgba(255,61,113,0.6)' }}>{scoreRed}</span>
          <span className="text-[0.7rem] tracking-[3px] text-(--red-team)/40 -mt-4 uppercase">KIRMIZI</span>
        </div>
        
        <span className="text-white/10 self-start mt-4">:</span>
        
        <div className="flex flex-col items-center">
          <span className="text-(--blue-team)" style={{ textShadow: '0 0 30px rgba(0,229,255,0.6)' }}>{scoreBlue}</span>
          <span className="text-[0.7rem] tracking-[3px] text-(--blue-team)/40 -mt-4 uppercase">MAVİ</span>
        </div>
      </div>

      <div className={`mt-12 py-3 px-10 rounded-full border border-white/10 bg-white/5 text-[clamp(1.2rem,4vw,1.8rem)] font-black tracking-[4px] uppercase
        ${winner === 'red' ? 'text-(--red-team) shadow-[0_0_40px_rgba(255,61,113,0.2)]' : 
          winner === 'blue' ? 'text-(--blue-team) shadow-[0_0_40px_rgba(0,229,255,0.2)]' : 
          'text-white/60'}`}
        style={{ animation: 'winnerPulse 2s infinite ease-in-out' }}
      >
        {winner === 'red' ? '🏆 KIRMIZI KAZANDI' : winner === 'blue' ? '🏆 MAVİ KAZANDI' : '🤝 BERABERE'}
      </div>

      <div className="mt-16 flex items-center gap-3 text-[0.75rem] text-white/40 tracking-[3px] uppercase">
        <div className="w-12 h-px bg-linear-to-r from-transparent to-white/20"></div>
        {myRole === 'solo' ? 'Menuye donuluyor' : 'Lobiye donuluyor'}
        <div className="w-12 h-px bg-linear-to-l from-transparent to-white/20"></div>
      </div>
    </div>
  );
}
