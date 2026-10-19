import type { ButtonHTMLAttributes } from 'react';
import '@yrkie/doe/packages/doe-canvas/src/ui/controls/style/index.css';

export function PrimaryButton({ className = '', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} type={type} className={`ui-primary-button ${className}`} />;
}
