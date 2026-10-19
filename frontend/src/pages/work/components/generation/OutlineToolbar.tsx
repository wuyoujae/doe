import { Check, LoaderCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { WorkOutlineToolbarState } from './outline/WorkOutlinePreview';

/** Original WorkPreviewPanel DOE dock, with the local generation adapter as its actions. */
export function OutlineToolbar({ state, busy, confirmed, generating, retry, onRegenerate, onConfirm }: {
  state: WorkOutlineToolbarState; busy: boolean; confirmed: boolean; generating: boolean; retry: boolean;
  onRegenerate: () => void; onConfirm: () => void;
}) {
  const { t } = useTranslation('work');
  const label = retry ? t('generation:retry') : generating ? t('generation:runningSlides') : confirmed ? t('outline.confirmed') : t('outline.confirm');
  return <div className="work-preview-toolbar is-doe-single-flow is-doe-outline-dock">
    <div className="work-outline-toolbar-actions" aria-label={t('outline.actionsAria')}>
      <span className="work-outline-slide-count">{t('outline.slideCount', { count: state.slideCount })}</span>
      {state.saveState !== 'idle' && <span className={`work-outline-save-status is-${state.saveState}`}
        title={state.errorMessage ?? undefined} aria-live="polite">
        {t(state.saveState === 'saving' ? 'toolbar.saving' : state.saveState === 'saved' ? 'toolbar.saved' : 'toolbar.saveFailed')}
      </span>}
      <button className="work-outline-toolbar-button with-label" type="button" aria-label={t('outline.regenerate')}
        disabled={busy || confirmed || state.slideCount === 0} onClick={onRegenerate}>
        <RefreshCw aria-hidden="true" /><span>{t('outline.regenerate')}</span>
      </button>
      <button className="work-outline-toolbar-button confirm" type="button" aria-label={label}
        disabled={busy || (confirmed && !retry) || state.slideCount === 0} onClick={onConfirm}>
        {generating ? <LoaderCircle className="is-spinning" aria-hidden="true" /> : retry ? <RefreshCw aria-hidden="true" /> : <Check aria-hidden="true" />}<span>{label}</span>
      </button>
    </div>
  </div>;
}
