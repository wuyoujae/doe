import { ChevronRight, Cpu, MonitorCog, Sparkles } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from '../ui/Dialog';
import { LanguageSelector } from '../locale/LanguageSelector';
import { ModelSettings } from './ModelSettings';
import { DoeSettings } from './DoeSettings';
import './SettingsDialog.css';

export function SettingsDialog({ id, onClose, initialTab = 'general' }: { id: string; onClose: () => void; initialTab?: 'general' | 'models' | 'doe' }) {
  const { t } = useTranslation(['settings', 'common', 'doeSettings']);
  const [activeTab, setActiveTab] = useState<'general' | 'models' | 'doe'>(initialTab);
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 45rem)').matches);
  const tabsId = useId();
  const tabButtons = useRef<Array<HTMLButtonElement | null>>([]);
  const tabs = [{ key: 'general', icon: MonitorCog }, { key: 'models', icon: Cpu }, { key: 'doe', icon: Sparkles }] as const;
  const tabLabel = (key: typeof activeTab) => key === 'doe' ? t('doeSettings:title') : t(`tabs.${key}`);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 45rem)');
    const update = () => setCompact(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return <Dialog id={id} title={t('title')} className="settings-dialog" onClose={onClose}>
    <div className="settings-layout">
      <aside className="settings-sidebar">
        <div className="settings-brand"><h2>{t('title')}</h2></div>
        <nav className="settings-tabs" role="tablist" aria-label={t('title')} aria-orientation={compact ? 'horizontal' : 'vertical'}>
        {tabs.map(({ key, icon: Icon }, index) => <button key={key} ref={element => { tabButtons.current[index] = element; }}
          type="button" role="tab" id={`${tabsId}-${key}-tab`} aria-controls={`${tabsId}-${key}-panel`}
          aria-selected={activeTab === key} tabIndex={activeTab === key ? 0 : -1}
          title={tabLabel(key)} aria-label={tabLabel(key)}
          className={`settings-tab${activeTab === key ? ' active' : ''}`} onClick={() => setActiveTab(key)}
          onKeyDown={event => {
            let next: number | undefined;
            if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % tabs.length;
            if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
            if (event.key === 'Home') next = 0;
            if (event.key === 'End') next = tabs.length - 1;
            if (next === undefined) return;
            event.preventDefault();
            setActiveTab(tabs[next].key);
            tabButtons.current[next]?.focus();
          }}><Icon aria-hidden="true" /><span>{tabLabel(key)}</span><ChevronRight className="settings-tab-arrow" aria-hidden="true" /></button>)}
        </nav>
      </aside>
      <section className="settings-body" role="tabpanel" id={`${tabsId}-general-panel`} aria-labelledby={`${tabsId}-general-tab`} hidden={activeTab !== 'general'} tabIndex={0}>
        <h3 className="settings-title">{t('tabs.general')}</h3>
        <div className="settings-dialog-row">
          <span>{t('common:language.label')}</span>
          <LanguageSelector />
        </div>
      </section>
      <section className="settings-body" role="tabpanel" id={`${tabsId}-models-panel`} aria-labelledby={`${tabsId}-models-tab`} hidden={activeTab !== 'models'} tabIndex={0}>
        <ModelSettings />
      </section>
      <section className="settings-body" role="tabpanel" id={`${tabsId}-doe-panel`} aria-labelledby={`${tabsId}-doe-tab`} hidden={activeTab !== 'doe'} tabIndex={0}>
        <DoeSettings />
      </section>
    </div>
  </Dialog>;
}
