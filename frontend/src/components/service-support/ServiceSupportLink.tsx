import { Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './ServiceSupportLink.css';

export function ServiceSupportLink({ className = '' }: { className?: string }) {
  const { t } = useTranslation('common');
  const label = t('serviceSupport');
  return <a className={`service-support-link ${className}`} href="https://yrkie.com/pricing"
    target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
    <Gift aria-hidden="true" /><span>{label}</span>
  </a>;
}
