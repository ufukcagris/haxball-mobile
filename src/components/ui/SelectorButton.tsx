'use client';

interface SelectorButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: 'accent' | 'yellow' | 'green';
  className?: string;
}

const colorMap = {
  accent: {
    border: 'border-[var(--accent)]',
    bg: 'bg-[rgba(0,229,255,0.1)]',
    text: 'text-[var(--accent)]',
  },
  yellow: {
    border: 'border-[var(--yellow)]',
    bg: 'bg-[rgba(255,214,0,0.1)]',
    text: 'text-[var(--yellow)]',
  },
  green: {
    border: 'border-[var(--green)]',
    bg: 'bg-[rgba(0,255,136,0.1)]',
    text: 'text-[var(--green)]',
  },
};

export function SelectorButton({ active, onClick, children, color = 'accent', className = '' }: SelectorButtonProps) {
  const c = colorMap[color];
  return (
    <button
      onClick={onClick}
      className={`flex-1 bg-[var(--surface2)] border-2 rounded-[9px]
        text-[var(--text-dim)] cursor-pointer font-['Exo_2',sans-serif] text-[0.8rem] font-bold
        py-[clamp(5px,1vh,8px)] px-0.5 text-center transition-all duration-200
        ${active ? `${c.border} ${c.bg} ${c.text}` : 'border-[var(--border)]'}
        ${className}`}
      style={{ touchAction: 'manipulation' }}
    >
      {children}
    </button>
  );
}
