import { BarChart3, Image, Layers, ListOrdered, Palette, PanelTop, Rows3, Search, Shapes, Type, X } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { COMPONENT_NAMES } from '@yrkie/doe/packages/doe-component/src/catalog/names.ts';
import { localizedComponentLabel } from '@yrkie/doe/integrations/localization/catalog/index.ts';
import { translateToolbarLabel } from '@yrkie/doe/integrations/localization/toolbar/index.ts';
import { ComponentIcon } from './ComponentIcon';
import type { DoeSettingsSection } from './settings';
import './component-toolbar.css';

const categories = [
  { id: 'base', icon: Type },
  { id: 'contents', icon: Layers },
  { id: 'diagrams', icon: Shapes },
  { id: 'charts', icon: BarChart3 },
] as const;

export function DoeComponentToolbar({ disabled = false, onInsert, onSettings, activeSettings = null, viewMode = 'continuous', onViewMode }: {
  disabled?: boolean;
  onInsert?: (name: string, locale: string) => Promise<void>;
  onSettings?: (section: DoeSettingsSection | null) => void;
  activeSettings?: DoeSettingsSection | null;
  viewMode?: 'single' | 'continuous';
  onViewMode?: (mode: 'single' | 'continuous') => void;
}) {
  const { i18n, t } = useTranslation('work');
  const locale = i18n.resolvedLanguage || i18n.language || 'en';
  const [active, setActive] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inserting = useRef(false);
  const mounted = useRef(true);
  const returnFocus = useRef<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const id = useId();
  const previousSettings = useRef(activeSettings);
  useEffect(() => {
    if (previousSettings.current && !activeSettings && !active && !disabled) {
      root.current?.querySelector<HTMLButtonElement>(`[data-settings="${previousSettings.current}"]`)?.focus({ preventScroll: true });
    }
    previousSettings.current = activeSettings;
  }, [activeSettings, active, disabled]);
  const settingsButton = (section: DoeSettingsSection, label: string, Icon: typeof Palette) => <button
    type="button" data-settings={section} disabled={disabled || busy} aria-label={label} title={label}
    aria-expanded={activeSettings === section} aria-haspopup="dialog"
    onClick={() => { close(); onSettings?.(activeSettings === section ? null : section); }}>
    <Icon aria-hidden="true" /><span>{label}</span>
  </button>;
  const category = categories.find(entry => entry.id === active);
  const entries = COMPONENT_NAMES.filter(entry => entry.category === active &&
    `${localizedComponentLabel(entry, locale)} ${entry.zh} ${entry.en} ${entry.name} ${entry.description}`.toLowerCase().includes(query.trim().toLowerCase()));
  const close = (focus = false) => {
    if (focus) root.current?.querySelector<HTMLButtonElement>(`[data-category="${active}"]`)?.focus();
    setActive(null);
  };
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useLayoutEffect(() => {
    if (!busy && returnFocus.current) {
      root.current?.querySelector<HTMLButtonElement>(`[data-category="${returnFocus.current}"]`)?.focus();
      returnFocus.current = null;
    }
  }, [busy, active]);
  const insert = async (name: string) => {
    if (!onInsert || disabled || inserting.current) return;
    inserting.current = true; setBusy(true); setError(null);
    try { await onInsert(name, locale); if (mounted.current) { returnFocus.current = active; close(); } }
    catch (reason) { if (mounted.current) setError(reason instanceof Error ? reason.message : i18n.t('insert.failed', { ns: 'doeInteraction' })); }
    finally { inserting.current = false; if (mounted.current) setBusy(false); }
  };

  useEffect(() => { if (disabled) setActive(null); }, [disabled]);
  useLayoutEffect(() => {
    if (!active || !panel.current) return;
    const element = panel.current;
    element.setAttribute('popover', 'auto');
    element.showPopover();
    const position = () => {
      const anchor = root.current?.getBoundingClientRect();
      if (!anchor) return;
      const width = element.getBoundingClientRect().width;
      element.style.left = `${Math.max(8, Math.min(anchor.left + anchor.width / 2 - width / 2, document.documentElement.clientWidth - width - 8))}px`;
      element.style.top = `${anchor.bottom + 8}px`;
      element.style.setProperty('--doe-catalog-available-height', `${Math.max(0, window.innerHeight - anchor.bottom - 24)}px`);
    };
    const toggle = (event: Event) => {
      if ((event as ToggleEvent).newState === 'closed') setActive(null);
    };
    element.addEventListener('toggle', toggle);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    position(); search.current?.focus();
    return () => {
      element.removeEventListener('toggle', toggle);
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
      element.hidePopover();
    };
  }, [active]);

  return <div className="work-ppt-insert-root doe-component-toolbar" data-view-switch={Boolean(onViewMode) || undefined} ref={root}>
    <div className="work-ppt-insert-toolbar" role="toolbar" aria-label={t('doeInteraction:toolbar')}>
      {onSettings && <>{settingsButton('theme', t('settings.theme'), Palette)}<span className="doe-toolbar-divider" role="separator" aria-orientation="vertical" /></>}
      {categories.map(({ id: key, icon: Icon }) => <button key={key} type="button" data-category={key}
        disabled={disabled || busy} aria-label={t(`doeInteraction:categories.${key}`)} title={t(`doeInteraction:categories.${key}`)}
        aria-expanded={active === key} aria-controls={active === key ? id : undefined} aria-haspopup="dialog"
        onClick={() => { onSettings?.(null); setQuery(''); setError(null); setActive(active === key ? null : key); }}>
        <Icon aria-hidden="true" /><span>{t(`doeInteraction:categories.${key}`)}</span>
      </button>)}
      {onSettings && <><span className="doe-toolbar-divider" role="separator" aria-orientation="vertical" />
        {settingsButton('page-number', t('settings.pageNumber'), ListOrdered)}
        {settingsButton('logo', t('settings.logo'), Image)}
      </>}
      {onViewMode && <button type="button" className="doe-view-mode-toggle" disabled={disabled || busy}
        aria-label={t(viewMode === 'single' ? 'canvasView.continuous' : 'canvasView.single')}
        title={t(viewMode === 'single' ? 'canvasView.continuous' : 'canvasView.single')}
        aria-pressed={viewMode === 'continuous'} onClick={() => { close(); onSettings?.(null); onViewMode(viewMode === 'single' ? 'continuous' : 'single'); }}>
        {viewMode === 'single' ? <Rows3 aria-hidden="true" /> : <PanelTop aria-hidden="true" />}
      </button>}
    </div>
    {category && <div id={id} ref={panel} className="doe-component-catalog" role="dialog" aria-label={t(`doeInteraction:categories.${category.id}`)}
      onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); close(true); } }}>
      <header><strong>{t(`doeInteraction:categories.${category.id}`)}</strong>
        <button type="button" aria-label={t('settings.close')} onClick={() => close(true)}><X aria-hidden="true" /></button>
      </header>
      <label className="doe-component-search"><Search aria-hidden="true" /><input ref={search} value={query}
        onChange={event => setQuery(event.target.value)} placeholder={t('doeInteraction:search')}
        aria-label={t('doeInteraction:search')} /></label>
      <ul className="doe-component-grid" aria-busy={busy}>{entries.map(entry => <li key={entry.name}>
        <button type="button" disabled={disabled || busy || !onInsert} onClick={() => void insert(entry.name)}>
          <ComponentIcon name={entry.name} /><span>{localizedComponentLabel(entry, locale)}</span>
        </button>
      </li>)}</ul>
      {busy && <p role="status">{t('components.adding')}</p>}
      {error && <p role="alert">{translateToolbarLabel(error)}</p>}
      {!entries.length && <p role="status">{t('components.noMatches')}</p>}
    </div>}
    {!category && (busy || error) && <div className="doe-component-feedback" role={error ? 'alert' : 'status'}>{error ? translateToolbarLabel(error) : t('components.adding')}</div>}
  </div>;
}
