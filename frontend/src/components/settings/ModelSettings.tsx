import { Cpu, Eye, EyeOff, Image, Save, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '../ui/Select';
import { ModelOptions } from './ModelOptions';
import { SettingsSubTabs } from './SettingsSubTabs';
import { IMAGE_MODEL_PROVIDERS, MODEL_PRESETS, TEXT_MODEL_PROVIDERS, type ModelProvider } from '../../lib/model-presets';
import {
  createEmptyModelSettings, ModelSettingsError, readModelSettings, readLegacyModelSettings,
  removeImportedLegacySettings, saveModelSettings, toModelDraft,
  type LegacyModelSettings, type ModelKind, type ModelSettingsDraft, type ModelSettingsSnapshot,
} from '../../lib/model-settings';

export function ModelSettings() {
  const { t } = useTranslation('settings');
  const [snapshot, setSnapshot] = useState<ModelSettingsSnapshot | null>(null);
  const [draft, setDraft] = useState<ModelSettingsDraft>(() => toModelDraft(createEmptyModelSettings()));
  const [error, setError] = useState<ModelSettingsError | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeKind, setActiveKind] = useState<ModelKind>('text');
  const [visibleKeys, setVisibleKeys] = useState({ text: false, image: false });
  const [endpointChanged, setEndpointChanged] = useState({ text: false, image: false });
  const [legacy, setLegacy] = useState<LegacyModelSettings | null>(null);
  const [legacyInvalid, setLegacyInvalid] = useState(false);
  const [legacyPending, setLegacyPending] = useState(false);
  const [legacyImported, setLegacyImported] = useState(false);
  const request = useRef<AbortController | null>(null);
  const locatedError = useRef<ModelSettingsError | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const fieldsId = useId();
  const errorId = `${fieldsId}-error`;
  const noticeId = `${fieldsId}-notice`;
  const blocked = !snapshot || error?.code === 'read' || error?.code === 'unavailable' || error?.code === 'conflict';
  const busy = loading || saving;
  const dirty = snapshot !== null && JSON.stringify(draft) !== JSON.stringify(toModelDraft(snapshot.settings));
  const groups = [{ kind: 'text', icon: Cpu }, { kind: 'image', icon: Image }] as const;

  useEffect(() => {
    if (!error?.field || busy || locatedError.current === error) return;
    const kind = error.field.startsWith('image.') ? 'image' : 'text';
    if (kind !== activeKind) { setActiveKind(kind); return; }
    locatedError.current = error;
    if (error.field.includes('.options.')) return;
    const frame = requestAnimationFrame(() => {
      const control = form.current?.elements.namedItem(error.field!);
      if (control instanceof HTMLElement) control.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [error, activeKind, busy]);

  const accept = (next: ModelSettingsSnapshot) => {
    setSnapshot(next);
    setDraft(toModelDraft(next.settings));
    setError(null);
    setVisibleKeys({ text: false, image: false });
    setEndpointChanged({ text: false, image: false });
  };

  const reload = async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setSaved(false);
    try {
      const next = await readModelSettings(controller.signal);
      if (controller.signal.aborted) return;
      accept(next);
      setLegacyPending(false);
    } catch (reason) {
      if (!controller.signal.aborted) setError(reason instanceof ModelSettingsError ? reason : new ModelSettingsError('read'));
    } finally { if (!controller.signal.aborted) setLoading(false); }
  };

  useEffect(() => {
    void reload();
    try { setLegacy(readLegacyModelSettings()); } catch { setLegacyInvalid(true); }
    return () => request.current?.abort();
  }, []);

  const change = (kind: ModelKind, patch: Partial<ModelSettingsDraft[ModelKind]>) => {
    setDraft(current => ({ ...current, [kind]: { ...current[kind], ...patch } }));
    setSaved(false);
    setLegacyImported(false);
    if (!blocked) setError(null);
  };

  const changeProvider = (kind: ModelKind, provider: ModelProvider) => {
    if (provider === draft[kind].provider) return;
    const options = { ...draft[kind].options };
    if (provider === 'anthropic' || provider === 'deepseek' && !['', 'none', 'low', 'high', 'max'].includes(options.reasoningEffort)) options.reasoningEffort = '';
    change(kind, { provider, baseUrl: MODEL_PRESETS[provider].baseUrl, model: '', apiKey: '', clearApiKey: true, options });
    setVisibleKeys(current => ({ ...current, [kind]: false }));
    setEndpointChanged(current => ({ ...current, [kind]: true }));
  };

  const save = async () => {
    if (blocked || busy || !dirty || !snapshot) return;
    const controller = new AbortController();
    request.current = controller;
    setSaving(true);
    setSaved(false);
    try {
      const next = await saveModelSettings(draft, snapshot.revision, controller.signal);
      if (controller.signal.aborted) return;
      accept(next);
      setSaved(true);
      if (legacyPending && legacy && removeImportedLegacySettings(legacy)) {
        setLegacy(null);
        setLegacyImported(true);
      }
      setLegacyPending(false);
    } catch (reason) {
      if (controller.signal.aborted) return;
      const nextError = reason instanceof ModelSettingsError ? reason : new ModelSettingsError('write');
      setError(nextError);
    } finally { if (!controller.signal.aborted) setSaving(false); }
  };

  const importLegacy = () => {
    if (!legacy || busy || blocked) return;
    // Stage the old configuration for review; only Save writes it to the backend.
    setDraft({ text: { ...legacy.draft.text, clearApiKey: true }, image: { ...legacy.draft.image, clearApiKey: true } });
    setLegacyPending(true);
    setSaved(false);
    setError(null);
    setVisibleKeys({ text: false, image: false });
  };

  return <form ref={form} className="model-settings" noValidate aria-busy={busy} onSubmit={event => { event.preventDefault(); void save(); }} aria-describedby={noticeId}>
    <div className="settings-title-row settings-navigation-row">
      <SettingsSubTabs id={`${fieldsId}-kind`} label={t('model.title')} value={activeKind} onChange={setActiveKind}
        tabs={groups.map(({ kind, icon }) => ({ value: kind, icon, label: t(`model.${kind}`) }))} />
      <button className="setting-btn model-save-btn" type="submit" disabled={blocked || busy || !dirty}><Save aria-hidden="true" /><span>{t(saving ? 'model.saving' : 'model.save')}</span></button>
    </div>
    {loading && <p className="settings-storage-status" role="status">{t('model.loading')}</p>}
    {error && <div className="model-settings-error" id={errorId} role="alert">
      <p>{t(`model.errors.${error.code}`)}</p>
      {blocked && <button className="setting-btn" type="button" disabled={busy} onClick={() => void reload()}>{t('model.reload')}</button>}
    </div>}
    {(legacy || legacyInvalid) && <div className="model-legacy-notice">
      <p>{t(legacyInvalid ? 'model.legacyInvalid' : 'model.legacyFound')}</p>
      {legacy && <button className="setting-btn" type="button" disabled={busy || blocked || legacyPending || dirty} onClick={importLegacy}>{t('model.importLegacy')}</button>}
    </div>}
    <div className="model-config-list">
      {groups.map(({ kind }) => {
        const endpoint = draft[kind];
        const disabled = busy || !snapshot;
        const hasStoredKey = endpoint.hasApiKey && !endpoint.clearApiKey;
        const providers = kind === 'text' ? TEXT_MODEL_PROVIDERS : IMAGE_MODEL_PROVIDERS;
        return <section key={kind} role="tabpanel" id={`${fieldsId}-kind-${kind}-panel`} aria-labelledby={`${fieldsId}-kind-${kind}-tab`}
          hidden={activeKind !== kind} tabIndex={0}>
          <fieldset className="model-config-block" disabled={disabled} aria-label={t(`model.${kind}`)}>
          <div className="model-form-grid">
            <div className="model-field full-width model-provider-field">
              <span>{t('model.provider')}</span>
              <Select label={`${t(`model.${kind}`)} · ${t('model.provider')}`} value={endpoint.provider} disabled={disabled}
                searchable searchPlaceholder={t('model.searchProviders')} noResults={t('model.noProviders')}
                options={providers.map(value => ({ value, label: value === 'custom' ? t('model.customProvider') : MODEL_PRESETS[value].label }))}
                onChange={provider => changeProvider(kind, provider)} />
              {endpoint.provider !== 'custom' && <span className="model-field-hint">{MODEL_PRESETS[endpoint.provider].baseUrl}</span>}
              {endpoint.provider === 'anthropic' && <span className="model-field-hint">{t('model.claudeHint')}</span>}
            </div>
            {endpoint.provider === 'custom' && <label className="model-field full-width" htmlFor={`${fieldsId}-${kind}-baseUrl`}>
              <span>{t('model.baseUrl')}</span>
              <input className="model-input" id={`${fieldsId}-${kind}-baseUrl`} name={`${kind}.baseUrl`} type="url" inputMode="url"
                value={endpoint.baseUrl} onChange={event => {
                  change(kind, { baseUrl: event.target.value, apiKey: '', clearApiKey: true });
                  setEndpointChanged(current => ({ ...current, [kind]: true }));
                }} placeholder="https://api.example.com/v1" autoComplete="off" spellCheck={false} autoCapitalize="none" maxLength={2048}
                aria-invalid={error?.field === `${kind}.baseUrl`} aria-describedby={error?.field === `${kind}.baseUrl` ? errorId : undefined} />
            </label>}
            <div className="model-field">
              <div className="model-key-label"><label htmlFor={`${fieldsId}-${kind}-apiKey`}>{t('model.apiKey')}</label>
                {hasStoredKey && <button type="button" className="model-clear-key" title={t('model.clearKey')} aria-label={`${t(`model.${kind}`)} · ${t('model.clearKey')}`}
                  onClick={() => change(kind, { clearApiKey: true, apiKey: '' })}><X aria-hidden="true" /></button>}
              </div>
              <div className="api-key-input-wrap">
                <input className="model-input" id={`${fieldsId}-${kind}-apiKey`} name={`${kind}.apiKey`} type={visibleKeys[kind] ? 'text' : 'password'}
                  value={endpoint.apiKey} onChange={event => change(kind, { apiKey: event.target.value })}
                  placeholder={t(hasStoredKey ? 'model.storedKeyPlaceholder' : 'model.keyPlaceholder')}
                  autoComplete="off" spellCheck={false} autoCapitalize="none" maxLength={8192}
                  aria-invalid={error?.field === `${kind}.apiKey`} aria-describedby={error?.field === `${kind}.apiKey` ? errorId : undefined} />
                <button type="button" className="model-key-toggle" aria-label={t(visibleKeys[kind] ? 'model.hideKey' : 'model.showKey')}
                  aria-pressed={visibleKeys[kind]} aria-controls={`${fieldsId}-${kind}-apiKey`}
                  onClick={() => setVisibleKeys(current => ({ ...current, [kind]: !current[kind] }))}>
                  {visibleKeys[kind] ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </div>
            </div>
            <label className="model-field" htmlFor={`${fieldsId}-${kind}-model`}>
              <span>{t('model.name')}</span>
              <input className="model-input" id={`${fieldsId}-${kind}-model`} name={`${kind}.model`} value={endpoint.model}
                onChange={event => change(kind, { model: event.target.value })} placeholder={t('model.namePlaceholder')}
                autoComplete="off" spellCheck={false} autoCapitalize="none" maxLength={256}
                aria-invalid={error?.field === `${kind}.model`} aria-describedby={error?.field === `${kind}.model` ? errorId : undefined} />
            </label>
          </div>
          {endpointChanged[kind] && <p className="model-field-hint">{t('model.endpointChanged')}</p>}
          {!endpointChanged[kind] && endpoint.clearApiKey && !endpoint.apiKey && endpoint.hasApiKey && <p className="model-field-hint">{t('model.keyCleared')}</p>}
          <ModelOptions kind={kind} provider={endpoint.provider} value={endpoint.options} disabled={disabled} active={activeKind === kind} errorField={error?.field}
            errorId={errorId} idPrefix={`${fieldsId}-${kind}`} onChange={(key, value) => change(kind, { options: { ...endpoint.options, [key]: value } })} />
          </fieldset>
        </section>;
      })}
    </div>
    <p className="settings-storage-status" role="status">{legacyImported ? t('model.legacyImported') : dirty ? t('model.unsaved') : saved ? t('model.saved') : '\u00a0'}</p>
    <p className="settings-local-notice" id={noticeId}>{t('model.localNotice')}</p>
  </form>;
}
