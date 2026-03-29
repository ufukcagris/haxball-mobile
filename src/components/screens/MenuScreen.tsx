'use client';

import { useAppStore } from '@/stores/useAppStore';
import { useLobbyStore } from '@/stores/useLobbyStore';
import { MenuCard } from '@/components/ui/MenuCard';
import { FieldInput } from '@/components/ui/FieldInput';
import { SelectorButton } from '@/components/ui/SelectorButton';
import { PlayButton } from '@/components/ui/PlayButton';
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
    useLobbyStore.getState().resetLobby();
    setScreen('game');
  };

  const startMultiplayer = () => {
    setScreen('create');
  };

  return (
    <div
      id="menu-screen"
      className="flex flex-col items-center overflow-y-auto w-full h-full"
      style={{
        background: 'radial-gradient(ellipse at 60% 20%, #0d2040 0%, #0a0e1a 70%)',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
      }}
    >
      <div className="menu-bg fixed inset-0" />

      {/* Logo */}
      <div className="my-auto flex flex-col mobile-landscape:flex-row items-center justify-center gap-[clamp(10px,4vw,30px)] w-full shrink-0 px-3 py-5 z-1">
        <div className="relative text-center shrink-0 mobile-landscape:scale-90">
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
        <div className="font-['Share_Tech_Mono',monospace] text-[clamp(0.55rem,1.8vw,0.8rem)] text-(--accent) tracking-[5px] uppercase opacity-70 mt-0.5">
          ⚽ Street Football
        </div>
      </div>

      <MenuCard className="mobile-landscape:w-[500px]">
        <div className="flex flex-col gap-[clamp(7px,1.4vh,12px)] mobile-landscape:grid mobile-landscape:grid-rows-[auto_auto] mobile-landscape:grid-flow-col mobile-landscape:grid-cols-2 mobile-landscape:gap-x-4 mobile-landscape:gap-y-[clamp(8px,1.5vh,16px)]">
            {/* Nick */}
            <FieldInput
              label="Kullanici Adi"
              value={config.nick}
              onChange={(v) => setConfig({ nick: v })}
              placeholder="Adini gir..."
              maxLength={16}
              wrapperClassName="mobile-landscape:h-full"
              className="mobile-landscape:h-full"
            />

        {/* Pitch Size */}
        <div className="flex flex-col gap-1 mobile-landscape:h-full">
          <div className="text-[0.65rem] font-bold tracking-[2px] uppercase text-(--accent) opacity-80">
            Saha Boyutu
          </div>
          <div className="grid grid-cols-3 gap-[7px] mobile-landscape:flex-1">
            {pitchOptions.map((p) => (
              <button
                key={p.value}
                onClick={() => setConfig({ pitch: p.value })}
                className={`bg-(--surface2) border-2 rounded-[10px] cursor-pointer
                  py-[clamp(5px,1vh,9px)] px-1 flex flex-col items-center gap-0.5
                  transition-all duration-200
                  ${config.pitch === p.value
                    ? 'border-(--accent) bg-[rgba(0,229,255,0.1)] shadow-[0_0_14px_rgba(0,229,255,0.2)]'
                    : 'border-(--border)'
                  }`}
                style={{ touchAction: 'manipulation' }}
              >
                <span className="text-[1.1rem]">{p.icon}</span>
                <span className={`text-[0.6rem] font-bold tracking-[1px] uppercase
                  ${config.pitch === p.value ? 'text-(--accent)' : 'text-(--text-dim)'}`}
                >
                  {p.label}
                </span>
              </button>
            ))}
          </div>
        </div>

          {/* Match Time */}
          <div className="flex flex-col gap-1 mobile-landscape:h-full">
            <div className="text-[0.65rem] font-bold tracking-[2px] uppercase text-(--accent) opacity-80">
              Mac Suresi
          </div>
          <div className="flex gap-1.5 w-full mobile-landscape:flex-1">
            {timeOptions.map((t) => (
              <SelectorButton
                key={t.value}
                active={config.time === t.value}
                onClick={() => setConfig({ time: t.value })}
                color="yellow"
                className="flex-1 mobile-landscape:h-full"
              >
                {t.label}
              </SelectorButton>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="flex flex-col gap-1 mobile-landscape:h-full">
          <div className="text-[0.65rem] font-bold tracking-[2px] uppercase text-(--accent) opacity-80">
            Rakip
          </div>
          <div className="flex gap-[5px] flex-nowrap w-full mobile-landscape:flex-1">
            {diffOptions.map((d) => (
              <SelectorButton
                key={d.value}
                active={config.diff === d.value}
                onClick={() => setConfig({ diff: d.value })}
                color="green"
                className="flex-1 text-[clamp(0.55rem,1.2vw,0.68rem)] whitespace-nowrap mobile-landscape:py-2.5 shrink"
              >
                {d.label}
              </SelectorButton>
            ))}
          </div>
        </div>
        </div>
        <div className="flex flex-col mobile-landscape:flex-row gap-[clamp(7px,1.4vh,12px)] mobile-landscape:gap-3 mobile-landscape:mt-1">
          <PlayButton onClick={startSoloGame} className="w-full">
            ⚽ BOTA KARSI OYNA
          </PlayButton>
          <PlayButton onClick={startMultiplayer} variant="red" className="w-full">
            👥 ARKADASLA OYNA
          </PlayButton>
        </div>
      </MenuCard>
      </div>
    </div>
  );
}
