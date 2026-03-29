'use client';

interface FieldInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  mono?: boolean;
  className?: string;
  wrapperClassName?: string;
}

export function FieldInput({ label, value, onChange, placeholder, maxLength, mono, className = '', wrapperClassName = '' }: FieldInputProps) {
  return (
    <div className={`flex flex-col gap-1 ${wrapperClassName}`}>
      <div className="text-[0.65rem] font-bold tracking-[2px] uppercase text-(--accent) opacity-80">
        {label}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`bg-(--surface2) border-[1.5px] border-(--border) rounded-[9px]
          text-(--text) font-['Exo_2',sans-serif] text-[0.9rem] font-semibold
          py-2 px-3 outline-none transition-all duration-200 w-full
          focus:border-(--accent) focus:shadow-[0_0_0_3px_rgba(0,229,255,0.12)]
          ${mono ? "font-['Share_Tech_Mono',monospace] tracking-[2px] uppercase" : ''}
          ${className}`}
        style={{ touchAction: 'manipulation' }}
      />
    </div>
  );
}
