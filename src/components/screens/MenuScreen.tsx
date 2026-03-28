'use client';

import { useAppStore } from '@/stores/useAppStore';
import { MenuCard } from '@/components/ui/MenuCard';
import { FieldInput } from '@/components/ui/FieldInput';
import { SelectorButton } from '@/components/ui/SelectorButton';
import { PlayButton } from '@/components/ui/PlayButton';
import { tryAutoFullscreen } from '@/utils/fullscreen';
import type { PitchSize } from '@/config/pitchConfigs';
import type { BotDifficulty } from '@/config/botDifficulty';

export function MenuScreen() {
  const { config, setConfig, setScreen } = useAppStore();

  const pitchOptions: { value: PitchSize; icon: string; label: string }[] = [
    { value: 'small', icon: '🏟️', label: 'Kucuk' },
    { value: 'medium', icon: '⚽', label: 'Orta' },
    { value: 'large', icon: '🏆', label: 'Buyuk' },
  ];

  const timeOptions = [
    { value: 120, label: '2 dk' },
    { value: 180, label: '3 dk' },
    { value: 300, label: '5 dk' },
    { value: 0, label: '∞' },
  ];

  const diffOptions: { value: BotDifficulty; label: string }[] = [
    { value: 'none', label: '🧘 Antrenman' },
    { value: 'easy', label: 'Kolay' },
    { value: 'medium', label: 'Orta' },
    { value: 'hard', label: 'Zor' },
  ];

  const startSoloGame = () => {
    tryAutoFullscreen();
    setScreen('game');
  };

  const startMultiplayer = () => {
    setScreen('create');
  };

  return (
    <div
      id="menu-screen"
      className="flex flex-col items-center justify-center overflow-y-auto px-3 pt-4 pb-5 gap-2.5 w-full h-full"
      style={{
        background: 'radial-gradient(ellipse at 60% 20%, #0d2040 0%, #0a0e1a 70%)',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
      }}
    >
      <div className="menu-bg" />

      {/* Logo */}
      <div className="relative text-center z-[1] shrink-0">
        <div
          className="text-[clamp(1.4rem,4vw,2.8rem)] font-black tracking-tight leading-none"
          style={{
            background: 'linear-gradient(135deg, #00e5ff 0%, #ffffff 50%, #ff3d71 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 20px rgba(0,229,255,0.5))',
          }}
        >
          HaxMobile
        </div>
        <div className="font-['Share_Tech_Mono',monospace] text-[clamp(0.55rem,1.8vw,0.8rem)] text-[var(--accent)] tracking-[5px] uppercase opacity-70 mt-0.5">
          ⚽ Street Football
        </div>
      </div>

      <MenuCard>
        {/* Nick */}
        <FieldInput
          label="Kullanici Adi"
          value={config.nick}
          onChange={(v) => setConfig({ nick: v })}
          placeholder="Adini gir..."
          maxLength={16}
        />

        {/* Pitch Size */}
        <div className="flex flex-col gap-1">
          <div className="text-[0.65rem] font-bold tracking-[2px] uppercase text-[var(--accent)] opacity-80">
            Saha Boyutu
          </div>
          <div className="grid grid-cols-3 gap-[7px]">
            {pitchOptions.map((p) => (
              <button
                key={p.value}
                onClick={() => setConfig({ pitch: p.value })}
                className={`bg-[var(--surface2)] border-2 rounded-[10px] cursor-pointer
                  py-[clamp(5px,1vh,9px)] px-1 flex flex-col items-center gap-0.5
                  transition-all duration-200
                  ${config.pitch === p.value
                    ? 'border-[var(--accent)] bg-[rgba(0,229,255,0.1)] shadow-[0_0_14px_rgba(0,229,255,0.2)]'
                    : 'border-[var(--border)]'
                  }`}
                style={{ touchAction: 'manipulation' }}
              >
                <span className="text-[1.1rem]">{p.icon}</span>
                <span className={`text-[0.6rem] font-bold tracking-[1px] uppercase
                  ${config.pitch === p.value ? 'text-[var(--accent)]' : 'text-[var(--text-dim)]'}`}
                >
                  {p.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Match Time */}
        <div className="flex flex-col gap-1">
          <div className="text-[0.65rem] font-bold tracking-[2px] uppercase text-[var(--accent)] opacity-80">
            Mac Suresi
          </div>
          <div className="flex gap-1.5">
            {timeOptions.map((t) => (
              <SelectorButton
                key={t.value}
                active={config.time === t.value}
                onClick={() => setConfig({ time: t.value })}
                color="yellow"
              >
                {t.label}
              </SelectorButton>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="flex flex-col gap-1">
          <div className="text-[0.65rem] font-bold tracking-[2px] uppercase text-[var(--accent)] opacity-80">
            Rakip
          </div>
          <div className="flex gap-[5px] flex-nowrap">
            {diffOptions.map((d) => (
              <SelectorButton
                key={d.value}
                active={config.diff === d.value}
                onClick={() => setConfig({ diff: d.value })}
                color="green"
                className="text-[0.68rem] whitespace-nowrap"
              >
                {d.label}
              </SelectorButton>
            ))}
          </div>
        </div>

        <PlayButton onClick={startSoloGame} className="mb-1.5">
          ⚽ BOTA KARSI OYNA
        </PlayButton>
        <PlayButton onClick={startMultiplayer} variant="red">
          👥 ARKADASLA OYNA
        </PlayButton>
      </MenuCard>
    </div>
  );
}
