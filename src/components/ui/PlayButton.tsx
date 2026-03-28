'use client';

interface PlayButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'red' | 'purple' | 'secondary';
  disabled?: boolean;
  className?: string;
}

const variants = {
  primary: 'bg-gradient-to-br from-[#00e5ff] to-[#0099cc] text-black shadow-[0_4px_24px_rgba(0,229,255,0.35)]',
  red: 'bg-gradient-to-br from-[#ff3d71] to-[#cc0033] text-white shadow-[0_4px_20px_rgba(255,61,113,0.3)]',
  purple: 'bg-gradient-to-br from-[#7c3aed] to-[#4f1fac] text-white',
  secondary: 'bg-(--surface2) text-(--text-dim) border-[1.5px] border-(--border)',
};

export function PlayButton({ onClick, children, variant = 'primary', disabled, className = 'w-full' }: PlayButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`border-none rounded-[12px] cursor-pointer font-['Exo_2',sans-serif]
        text-[0.95rem] font-black tracking-[2px] py-[clamp(10px,1.5vh,14px)] uppercase
        transition-all duration-150 active:scale-[0.97] active:opacity-90
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${className}`}
      style={{ touchAction: 'manipulation' }}
    >
      {children}
    </button>
  );
}
