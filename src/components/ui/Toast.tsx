'use client';

interface ToastProps {
  message: string;
  color?: string;
  visible: boolean;
}

export function Toast({ message, color = 'var(--green)', visible }: ToastProps) {
  return (
    <div
      className="fixed top-3 left-1/2 z-9999 rounded-[10px] py-2 px-[18px]
        text-[0.8rem] font-bold pointer-events-none whitespace-nowrap
        transition-transform duration-300 ease-out"
      style={{
        transform: visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-80px)',
        color,
        borderColor: color,
        border: `1.5px solid ${color}`,
        background: color === 'var(--green)'
          ? 'rgba(0,255,136,0.15)'
          : 'rgba(0,229,255,0.15)',
      }}
    >
      {message}
    </div>
  );
}
