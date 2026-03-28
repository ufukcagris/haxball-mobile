'use client';

interface MenuCardProps {
  children: React.ReactNode;
  className?: string;
}

export function MenuCard({ children, className = '' }: MenuCardProps) {
  return (
    <div
      className={`bg-[rgba(17,24,39,0.88)] border border-[var(--border)] rounded-[18px]
        py-[clamp(10px,2vw,20px)] px-[clamp(14px,3vw,28px)]
        w-[min(440px,96vw)] z-[1] backdrop-blur-[12px]
        shadow-[0_8px_60px_rgba(0,0,0,0.5),var(--shadow)]
        flex flex-col gap-[clamp(7px,1.4vh,12px)] shrink-0 ${className}`}
    >
      {children}
    </div>
  );
}
