import { Settings } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wordmark } from '../brand/Wordmark';
import { LanguageSelector } from '../locale/LanguageSelector';
import { SettingsDialog } from '../settings/SettingsDialog';
import { ServiceSupportLink } from '../service-support/ServiceSupportLink';
import './AppHeader.css';

export function AppHeader() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsId = useId();
  const { t } = useTranslation('settings');
  return <>
    <header className="app-header">
      <div className="app-header-brand"><Wordmark /></div>
      <div className="app-header-actions">
        <LanguageSelector />
        <ServiceSupportLink />
        <button type="button" className="app-header-icon-button" aria-label={t('title')} title={t('title')}
          aria-haspopup="dialog" aria-expanded={settingsOpen} aria-controls={settingsOpen ? settingsId : undefined}
          onClick={() => setSettingsOpen(true)}><Settings aria-hidden="true" /></button>
      </div>
    </header>
    {settingsOpen && <SettingsDialog id={settingsId} onClose={() => setSettingsOpen(false)} />}
  </>;
}
