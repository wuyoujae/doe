import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ModelProvider } from '../../lib/model-presets';
import {
  MODEL_OPTION_LIMITS, type ModelKind, type ModelOptionDraft, type ModelOptionKey, type ModelSettingsField,
} from '../../lib/model-settings';
import { Select } from '../ui/Select';
import './ModelOptions.css';

type ModelOptionsProps = {
  kind: ModelKind;
  provider: ModelProvider;
  value: ModelOptionDraft;
  disabled: boolean;
  active: boolean;
  errorField?: ModelSettingsField;
  errorId: string;
  idPrefix: string;
  onChange: (key: ModelOptionKey, value: string) => void;
};

type NumberOptionKey = keyof typeof MODEL_OPTION_LIMITS;
const optionDefaults: Partial<Record<NumberOptionKey, string>> = {
  contextWindow: '131072', thresholdPercentage: '0.8', maxIterations: '8',
  connectTimeoutSeconds: '15', readTimeoutSeconds: '300', requestTimeoutSeconds: '900',
};

export function ModelOptions({ kind, provider, value, disabled, active, errorField, errorId, idPrefix, onChange }: ModelOptionsProps) {
  const { t } = useTranslation('settings');
  const [expanded, setExpanded] = useState(false);
  const controls = useRef<Partial<Record<ModelOptionKey, HTMLDivElement | null>>>({});
  const panelId = `${idPrefix}-${kind}-options`;
  const errorKey = errorField?.startsWith(`${kind}.options.`)
    ? errorField.slice(`${kind}.options.`.length).split('.')[0] as ModelOptionKey
    : undefined;

  useEffect(() => {
    if (errorKey && controls.current[errorKey]) setExpanded(true);
  }, [errorKey]);

  useEffect(() => {
    if (!expanded || !errorKey || disabled || !active) return;
    const frame = requestAnimationFrame(() => {
      const control = controls.current[errorKey]?.querySelector<HTMLElement>('input, textarea, [role="combobox"]');
      control?.focus({ preventScroll: true });
      control?.scrollIntoView({ block: 'nearest' });
    });
    return () => cancelAnimationFrame(frame);
  }, [errorKey, expanded, disabled, active]);

  const numberField = (key: NumberOptionKey) => <div className="model-field" key={key}
    ref={element => { controls.current[key] = element; }}>
    <label htmlFor={`${panelId}-${key}`}>{t(`model.${key}`)}</label>
    <input className="model-input" id={`${panelId}-${key}`} name={`${kind}.options.${key}`} type="number"
      inputMode={MODEL_OPTION_LIMITS[key].step === 1 ? 'numeric' : 'decimal'} {...MODEL_OPTION_LIMITS[key]}
      value={value[key]} onChange={event => onChange(key, event.target.value)} disabled={disabled}
      placeholder={optionDefaults[key] ?? t('model.defaultValue')}
      aria-invalid={errorKey === key} aria-describedby={errorKey === key ? errorId : undefined} />
  </div>;

  const selectField = (key: ModelOptionKey, options: Array<{ value: string; label: string }>) => <div
    className="model-field model-options-select" key={key} role="group" aria-labelledby={`${panelId}-${key}-label`}
    aria-invalid={errorKey === key} aria-describedby={errorKey === key ? errorId : undefined}
    ref={element => { controls.current[key] = element; }}>
    <span id={`${panelId}-${key}-label`}>{t(`model.${key}`)}</span>
    <Select label={t(`model.${key}`)} value={value[key]} disabled={disabled}
      options={[{ value: '', label: t(key === 'stream' ? 'model.streamDefault' : 'model.defaultValue') }, ...options]}
      onChange={next => onChange(key, next)} />
  </div>;

  const boolOptions = [{ value: 'true', label: t('model.enabled') }, { value: 'false', label: t('model.disabled') }];
  const reasoningOptions = (provider === 'deepseek' ? ['none', 'low', 'high', 'max'] : ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'])
    .map(effort => ({ value: effort, label: effort }));

  return <div className="model-options">
    <div className="model-options-action">
      <button className="model-options-toggle" type="button" disabled={disabled}
        aria-expanded={expanded} aria-controls={panelId}
        aria-label={`${t(`model.${kind}`)}: ${t('model.options')}`}
        onClick={() => setExpanded(current => !current)}>
        <span>{t('model.options')}</span><ChevronDown aria-hidden="true" />
      </button>
    </div>
    <div className="model-options-content" id={panelId} hidden={!expanded}>
      {kind === 'text' && <>
        <section className="model-options-section" aria-labelledby={`${panelId}-request-title`}>
          <h4 id={`${panelId}-request-title`}>{t('model.requestOptions')}</h4>
          <p className="model-options-hint">{t('model.parameterHint')}</p>
          <div className="model-form-grid">
            {numberField('temperature')}
            {numberField('topP')}
            {numberField('maxOutputTokens')}
            {provider !== 'anthropic' && selectField('reasoningEffort', reasoningOptions)}
            {selectField('toolChoice', ['auto', 'none', 'required'].map(item => ({ value: item, label: t(`model.${item}`) })))}
            {selectField('stream', boolOptions)}
            {selectField('parallelToolCalls', boolOptions)}
          </div>
        </section>
        <section className="model-options-section" aria-labelledby={`${panelId}-agent-title`}>
          <h4 id={`${panelId}-agent-title`}>{t('model.agentOptions')}</h4>
          <p className="model-options-hint">{t('model.agentHint')}</p>
          <div className="model-form-grid">
            {numberField('contextWindow')}
            {numberField('thresholdPercentage')}
            {numberField('maxIterations')}
          </div>
        </section>
      </>}
      <section className="model-options-section" aria-labelledby={`${panelId}-connection-title`}>
        <h4 id={`${panelId}-connection-title`}>{t('model.connectionOptions')}</h4>
        <div className="model-form-grid">
          {numberField('connectTimeoutSeconds')}
          {numberField('readTimeoutSeconds')}
          {numberField('requestTimeoutSeconds')}
          <div className="model-field full-width" ref={element => { controls.current.extraParams = element; }}>
            <label htmlFor={`${panelId}-extraParams`}>{t('model.extraParams')}</label>
            <textarea className="model-input model-options-json" id={`${panelId}-extraParams`} name={`${kind}.options.extraParams`}
              rows={4} maxLength={16384} value={value.extraParams} onChange={event => onChange('extraParams', event.target.value)}
              disabled={disabled} placeholder="{}" spellCheck={false} autoCapitalize="none" autoComplete="off"
              aria-invalid={errorKey === 'extraParams'}
              aria-describedby={`${panelId}-extra-hint${errorKey === 'extraParams' ? ` ${errorId}` : ''}`} />
            <span className="model-options-hint" id={`${panelId}-extra-hint`}>{t('model.extraParamsHint')}</span>
          </div>
        </div>
      </section>
    </div>
  </div>;
}
