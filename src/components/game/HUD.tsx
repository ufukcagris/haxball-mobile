'use client';

import { useGameStore } from '@/stores/useGameStore';
import { toggleFullscreen } from '@/utils/fullscreen';

export function HUD() {
  const { scoreRed, scoreBlue, timeLeft, overtime, time } =
    useGameStore();

  const formatTime = () => {
    if (time === 0) return '∞';
    if (overtime) return '∞';
    const t = Math.max(0, Math.ceil(timeLeft));
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="absolute top-0 left-0 right-0 flex items-center justify-between px-2.5 z-50
        border-b border-white/7"
      style={{
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)',
        height: '40px',
        flexShrink: 0,
      }}
    >
      {/* Red team */}
      <div className="flex items-center gap-[7px] min-w-[70px]">
        <div>
          <div className="text-[0.65rem] font-bold opacity-70 uppercase tracking-[1px] text-(--red-team)">
            KIRMIZI
          </div>
        </div>
        <div className="font-['Share_Tech_Mono',monospace] text-[1.4rem] font-bold text-(--red-team)"
          style={{ textShadow: '0 0 12px rgba(255,61,113,0.6)' }}
        >
          {scoreRed}
        </div>
      </div>

      {/* Center */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1.5">
          <div className="font-['Share_Tech_Mono',monospace] text-[1.1rem] text-(--text) tracking-[2px]">
            {formatTime()}
          </div>
          {overtime && (
            <div className="bg-[rgba(255,214,0,0.2)] border-[1.5px] border-(--yellow) rounded-md
              px-2 py-px text-[0.65rem] font-black tracking-[2px] text-(--yellow) uppercase">
              OT
            </div>
          )}
        </div>
        <div className="flex gap-1 mt-0.5">
          <button
            className="bg-transparent border-[1.5px] border-(--border) rounded-[7px] text-(--text-dim)
              cursor-pointer text-[0.8rem] py-[3px] px-2 font-['Exo_2',sans-serif] font-bold"
            style={{ touchAction: 'manipulation' }}
          >
            ⏸
          </button>
          <button
            onClick={toggleFullscreen}
            className="bg-transparent border-[1.5px] border-(--border) rounded-[7px] text-(--text-dim)
              cursor-pointer text-[0.8rem] py-[3px] px-2 font-['Exo_2',sans-serif] font-bold"
            style={{ touchAction: 'manipulation' }}
            title="Tam Ekran"
          >
            ⛶
          </button>
        </div>
      </div>

      {/* Blue team */}
      <div className="flex items-center gap-[7px] min-w-[70px] flex-row-reverse">
        <div className="text-right">
          <div className="text-[0.65rem] font-bold opacity-70 uppercase tracking-[1px] text-(--blue-team)">
            MAVİ
          </div>
        </div>
        <div className="font-['Share_Tech_Mono',monospace] text-[1.4rem] font-bold text-(--blue-team)"
          style={{ textShadow: '0 0 12px rgba(0,229,255,0.6)' }}
        >
          {scoreBlue}
        </div>
      </div>
    </div>
  );
}
