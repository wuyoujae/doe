import { FileCode2, FileText, RotateCcw, Save, Sparkles } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '../ui/Select';
import { SettingsSubTabs } from './SettingsSubTabs';
import { DoeSettingsError, readDoeSettings, saveDoeSettings, toDoeDraft,
  type DoeEntryDraft, type DoeEntryKind, type DoeSettingsSnapshot } from '../../lib/doe-settings';
import './DoeSettings.css';

export function DoeSettings() {
  const { t } = useTranslation(['doeSettings', 'settings']);
  const [snapshot, setSnapshot] = useState<DoeSettingsSnapshot | null>(null);
  const [draft, setDraft] = useState<DoeEntryDraft[]>([]);
  const [kind, setKind] = useState<DoeEntryKind>('prompt');
  const [selection, setSelection] = useState<Partial<Record<DoeEntryKind, string>>>({});
  const [error, setError] = useState<DoeSettingsError | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const request = useRef<AbortController | null>(null);
  const locatedError = useRef<DoeSettingsError | null>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  const id = useId();
  const busy = loading || saving;
  const blocked = !snapshot || error?.code === 'read' || error?.code === 'unavailable' || error?.code === 'conflict';
  const dirty = snapshot !== null && JSON.stringify(draft) !== JSON.stringify(toDoeDraft(snapshot));
  const definitions = snapshot?.entries.filter(entry => entry.kind === kind) ?? [];
  const definition = definitions.find(entry => entry.id === selection[kind]) ?? definitions[0];
  const current = draft.find(entry => entry.id === definition?.id);
  const modified = !!definition && !!current && (definition.defaultContent !== current.content || definition.defaultEnabled !== current.enabled);
  const invalidCurrent = !!current && error?.field === `entries.${current.id}.content`;
  const tabs = [{ value: 'prompt', icon: FileText, label: t('prompt') }, { value: 'schema', icon: FileCode2, label: t('schema') },
    { value: 'skill', icon: Sparkles, label: t('skill') }] as const;

  const accept = (next: DoeSettingsSnapshot) => { setSnapshot(next); setDraft(toDoeDraft(next)); setError(null); };
  const reload = async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setSaved(false);
    try { const next = await readDoeSettings(controller.signal); if (!controller.signal.aborted) accept(next); }
    catch (reason) { if (!controller.signal.aborted) setError(reason instanceof DoeSettingsError ? reason : new DoeSettingsError('read')); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  };

  useEffect(() => { void reload(); return () => request.current?.abort(); }, []);
  useEffect(() => {
    const invalid = snapshot?.entries.find(entry => error?.field?.startsWith(`entries.${entry.id}.`));
    if (!invalid || busy || locatedError.current === error) return;
    if (invalid.id !== current?.id) {
      setKind(invalid.kind);
      setSelection(previous => ({ ...previous, [invalid.kind]: invalid.id }));
      return;
    }
    locatedError.current = error;
    const frame = requestAnimationFrame(() => editor.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [error, snapshot, current?.id, busy]);

  const change = (patch: Partial<Pick<DoeEntryDraft, 'content' | 'enabled'>>) => {
    if (!current) return;
    setDraft(previous => previous.map(entry => entry.id === current.id ? { ...entry, ...patch } : entry));
    setSaved(false);
    if (!blocked) setError(null);
  };
  const save = async () => {
    if (busy || blocked || !snapshot || !dirty) return;
    const controller = new AbortController();
    request.current = controller;
    setSaving(true);
    setSaved(false);
    try {
      const next = await saveDoeSettings(snapshot, draft, controller.signal);
      if (!controller.signal.aborted) { accept(next); setSaved(true); }
    } catch (reason) { if (!controller.signal.aborted) setError(reason instanceof DoeSettingsError ? reason : new DoeSettingsError('write')); }
    finally { if (!controller.signal.aborted) setSaving(false); }
  };

  return <form className="doe-settings" noValidate aria-busy={busy} onSubmit={event => { event.preventDefault(); void save(); }}>
    <div className="settings-title-row settings-navigation-row">
      <SettingsSubTabs id={id} label={t('title')} value={kind} tabs={tabs} onChange={setKind} />
      <button type="submit" className="setting-btn model-save-btn" disabled={blocked || busy || !dirty}>
        <Save aria-hidden="true" /><span>{t(saving ? 'settings:model.saving' : 'settings:model.save')}</span>
      </button>
    </div>
    {loading && <p className="settings-storage-status" role="status">{t('settings:model.loading')}</p>}
    {error && <div className="model-settings-error" id={`${id}-error`} role="alert">
      <p>{t(error.code === 'invalid' ? 'invalid' : `settings:model.errors.${error.code}`)}</p>
      {blocked && <button type="button" className="setting-btn" disabled={busy} onClick={() => void reload()}>{t('settings:model.reload')}</button>}
    </div>}
    <p className="doe-settings-intro">{t(`intro.${kind}`)}</p>
    {tabs.map(tab => <section key={tab.value} role="tabpanel" id={`${id}-${tab.value}-panel`} aria-labelledby={`${id}-${tab.value}-tab`} hidden={kind !== tab.value}>
      {kind === tab.value && <div className="doe-config-workspace">
      <div className="doe-entry-list" aria-label={t('choose')}>
        {definitions.map(entry => {
          const item = draft.find(value => value.id === entry.id);
          const changed = item && (item.content !== entry.defaultContent || item.enabled !== entry.defaultEnabled);
          return <button key={entry.id} className={`doe-entry-button${entry.id === current?.id ? ' active' : ''}`} type="button"
            aria-current={entry.id === current?.id ? 'true' : undefined} onClick={() => setSelection(previous => ({ ...previous, [kind]: entry.id }))}>
            <span>{entry.name}</span>
            {item && !item.enabled ? <small>{t('settings:model.disabled')}</small> : changed ? <small>{t('modified')}</small> : null}
          </button>;
        })}
      </div>
      <div className="doe-entry-mobile-picker">
        <Select label={t('choose')} showLabel value={current?.id ?? ''} disabled={busy || !current}
          options={definitions.map(entry => ({ value: entry.id, label: entry.name }))}
          onChange={value => setSelection(previous => ({ ...previous, [kind]: value }))} />
      </div>
      {definition && current && <div className="doe-entry-editor" key={current.id}>
        <div className="doe-entry-heading">
          <div><h3>{definition.name}</h3><span className="doe-entry-badge">{t(modified ? 'modified' : 'default')}</span></div>
          <button type="button" className="setting-btn doe-reset-btn" disabled={busy || blocked || !modified}
            onClick={() => change({ content: definition.defaultContent, enabled: definition.defaultEnabled })}>
            <RotateCcw aria-hidden="true" /><span>{t('restore')}</span>
          </button>
        </div>
        <p className="doe-entry-description">{definition.description}</p>
        {kind === 'skill' && <label className="doe-skill-enabled">
          <input type="checkbox" role="switch" checked={current.enabled} disabled={busy || blocked} onChange={event => change({ enabled: event.target.checked })} />
          <span>{t('enabled')}</span>
        </label>}
        <label className="doe-content-label" htmlFor={`${id}-content`}>{t('content')}<span>Markdown</span></label>
        <textarea ref={editor} id={`${id}-content`} className="model-input doe-content-input" value={current.content} disabled={busy || blocked}
          onChange={event => change({ content: event.target.value })} spellCheck={false} autoCapitalize="none" autoCorrect="off"
          maxLength={(kind === 'skill' ? 64 : 512) * 1024} aria-invalid={invalidCurrent} aria-describedby={invalidCurrent ? `${id}-error` : `${id}-hint`} />
        <p className="model-field-hint" id={`${id}-hint`}>{t('editHint')}</p>
      </div>}
      </div>}
    </section>)}
    <p className="settings-storage-status" role="status">{dirty ? t('settings:model.unsaved') : saved ? t('settings:model.saved') : '\u00a0'}</p>
    <p className="settings-local-notice">{t('notice')}</p>
  </form>;
}
