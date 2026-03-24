import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const styleByVariant: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-lg shadow-sky-500/30 hover:translate-y-[-1px] hover:shadow-xl',
  secondary: 'bg-slate-700 text-white hover:bg-slate-600',
  danger: 'bg-rose-600 text-white hover:bg-rose-500',
  ghost: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

const Button = ({ children, variant = 'primary', className = '', ...props }: Props) => (
  <button
    className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70 ${styleByVariant[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
