import { useId, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Input } from './Input';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> & { label: string };

export default function PasswordField({ label, ...props }: Props) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="field-label" htmlFor={id}>{label}</label>
      <div className="relative">
        <Input {...props} id={id} className="pr-16" type={visible ? 'text' : 'password'} />
        <button type="button" aria-controls={id} aria-label={visible ? 'Hide ' + label : 'Show ' + label}
          onClick={() => setVisible(value => !value)}
          className="absolute inset-y-0 right-0 px-3 text-sm font-semibold text-leaf">
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}
