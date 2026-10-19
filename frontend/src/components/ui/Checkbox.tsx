import type { InputHTMLAttributes } from 'react';
import './Checkbox.css';

/** Native checkbox behavior with the shared theme and an animated checkmark. */
export function Checkbox({ className = '', ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return <span className={`ui-checkbox ${className}`}>
    <input {...props} type="checkbox" className="ui-checkbox-input" />
    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8 3 3 6-6" /></svg>
  </span>;
}
