import { Download, LoaderCircle, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ExportDialog, useExportMessages } from './ExportDialog';
import { createExport, pendingExport, readExport, rememberExport, waitForExport, type ExportFormat, type ExportJob, type ExportProgress } from './service';

export type ExportPreparation = { revision: number; projectId?: string };
export function ExportActions({ projectId, title, disabled = false, prepare, buttonHost }: {
  projectId: string; title: string; disabled?: boolean; prepare: () => Promise<ExportPreparation | null>; buttonHost?: HTMLElement | null;
}) {
  const text = useExportMessages();
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState<(() => void) | null>(null);
  const controller = useRef<AbortController | null>(null);
  const working = useRef(false);
  const activeProject = useRef(projectId); activeProject.current = projectId;
  const close = useCallback(() => setOpen(false), []);
  const chinese = i18n.language.startsWith('zh');
  const failMessage = (code: string) => code.includes('layout_overflow')
    ? chinese ? '页面内容超出布局容量，请调整后重试。' : 'A slide exceeds its layout capacity. Adjust it and retry.'
    : code.includes('assets_unavailable')
      ? chinese ? '文稿图片不可用，请检查素材后重试。' : 'A presentation image is unavailable. Check the assets and retry.'
      : code === 'export_still_running'
        ? chinese ? '导出仍在后台运行，可以继续查看进度。' : 'The export is still running. Retry to resume waiting.'
        : chinese ? '导出失败，请重试。' : 'Export failed. Please retry.';

  const monitor = async (job: ExportJob, signal: AbortSignal) => {
    rememberExport(projectId, job.jobId);
    await waitForExport(job, signal, next => { if (!signal.aborted) setProgress(next); });
    rememberExport(projectId, null);
  };
  const execute = async (format: ExportFormat, fonts: boolean) => {
    if (working.current || disabled) return;
    working.current = true; setError(null); setRetry(null); setProgress({ phase: 'preparing', percent: 5 });
    const captured = projectId;
    const abort = new AbortController(); controller.current = abort;
    try {
      const frozen = await prepare();
      if (!frozen) throw new Error('export_save_failed');
      if (abort.signal.aborted || activeProject.current !== captured) return;
      setProgress({ phase: 'creating', percent: 20 });
      const job = await createExport(frozen.projectId || projectId, format, frozen.revision, fonts, abort.signal);
      await monitor(job, abort.signal);
    } catch (failure) {
      if (!abort.signal.aborted && activeProject.current === captured) {
        setError(failMessage(failure instanceof Error ? failure.message : ''));
        setRetry(() => () => { void execute(format, fonts); });
      }
    } finally { if (activeProject.current === captured && !abort.signal.aborted) { working.current = false; setProgress(null); } }
  };
  useEffect(() => {
    working.current = false; setProgress(null); setError(null); setRetry(null); setOpen(false);
    const saved = pendingExport(projectId);
    const abort = new AbortController(); controller.current = abort;
    if (saved) {
      working.current = true; setProgress({ phase: 'queued', percent: 30 });
      void readExport(saved, abort.signal).then(job => monitor(job, abort.signal)).catch(failure => {
        if (!abort.signal.aborted) { setError(failMessage(failure instanceof Error ? failure.message : '')); setRetry(() => () => setOpen(true)); }
      }).finally(() => { if (!abort.signal.aborted) { working.current = false; setProgress(null); } });
    }
    return () => { abort.abort(); controller.current?.abort(); };
    // Project identity owns the background browser subscription; language changes preserve it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);
  const controls = <div className="work-export-actions">
    <button className="work-nav-share-btn" type="button" disabled={disabled || Boolean(progress)} aria-busy={Boolean(progress)} onClick={() => setOpen(true)}>
      {progress ? <LoaderCircle className="work-export-loader" /> : <Download />}<span>{progress ? text.exportProgress.replace('{{progress}}', String(progress.percent)) : text.export}</span>
    </button>
    {error && <span className="work-export-error" role="alert">{error} {retry && <button type="button" className="work-nav-icon-btn" aria-label={t('common:actions.retry', { defaultValue: chinese ? '重试' : 'Retry' })} onClick={retry}><RefreshCw /></button>}</span>}
  </div>;
  return <>{buttonHost === undefined ? controls : buttonHost ? createPortal(controls, buttonHost) : null}
    <ExportDialog open={open} title={title} busy={disabled || Boolean(progress)} onClose={close} onExport={(format, fonts) => { void execute(format, fonts); }} />
  </>;
}
