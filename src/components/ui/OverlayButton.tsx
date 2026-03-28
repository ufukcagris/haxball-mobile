'use client';

interface OverlayButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
}

export function OverlayButton({ onClick, children, variant = 'primary', className = '' }: OverlayButtonProps) {
  const base = `border-none rounded-[11px] cursor-pointer font-['Exo_2',sans-serif]
    text-[0.9rem] font-black tracking-[2px] py-[11px] px-7 uppercase
    shadow-[0_4px_20px_rgba(0,229,255,0.35)] transition-transform duration-150
    active:scale-[0.96]`;

  const variants = {
    primary: 'bg-gradient-to-br from-[#00e5ff] to-[#0099cc] text-black',
    secondary: 'bg-[var(--surface2)] text-[var(--text)] border-[1.5px] border-[var(--border)] shadow-none',
    danger: 'bg-[var(--surface2)] text-[var(--red-team)] border-[1.5px] border-[var(--red-team)] shadow-none',
  };

  return (
    <button
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
      style={{ touchAction: 'manipulation' }}
    >
      {children}
    </button>
  );
}
