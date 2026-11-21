import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const styleByVariant: Record<Variant, string> = {
  primary: 'bg-leaf text-white hover:bg-[#204530]',
  secondary: 'bg-ink text-white hover:bg-[#383f36]',
  danger: 'bg-red-800 text-white hover:bg-red-900',
  ghost: 'border border-line bg-white text-ink hover:bg-paper',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

const Button = ({ children, variant = 'primary', className = '', ...props }: Props) => (
  <button
    className={`inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${styleByVariant[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
