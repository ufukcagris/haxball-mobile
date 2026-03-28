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
  border: 'border-(--accent)',
  bg: 'bg-(--accent)/10',
  text: 'text-(--accent)',
  },
  yellow: {
  border: 'border-(--yellow)',
  bg: 'bg-(--yellow)/10',
  text: 'text-(--yellow)',
  },
  green: {
  border: 'border-(--green)',
  bg: 'bg-(--green)/10',
  text: 'text-(--green)',
  },
  };

  export function SelectorButton({ active, onClick, children, color = 'accent', className = '' }: SelectorButtonProps) {
  const c = colorMap[color];
  return (
  <button
    onClick={onClick}
    className={`flex-1 bg-(--surface2) border-2 rounded-[9px]
      text-(--text-dim) cursor-pointer font-['Exo_2',sans-serif] text-[0.8rem] font-bold
      py-[clamp(5px,1vh,8px)] px-0.5 text-center transition-all duration-200
      ${active ? `${c.border} ${c.bg} ${c.text}` : 'border-(--border)'}
      ${className}`}
      style={{ touchAction: 'manipulation' }}
    >
      {children}
    </button>
  );
}
