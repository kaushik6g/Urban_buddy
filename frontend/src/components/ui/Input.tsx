import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

export const Input = ({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-leaf ${className}`}
    {...props}
  />
);

export const TextArea = ({
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    className={`min-h-32 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-leaf ${className}`}
    {...props}
  />
);
