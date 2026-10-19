import { ArrowLeft, ArrowUp, Layers, LoaderCircle, MessageSquare, RefreshCw, Settings2, Square } from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { stageColorFor } from '@yrkie/doe/packages/doe-theme/src/registry/index.js';
import { SettingsDialog } from '../../components/settings/SettingsDialog';
import { ServiceSupportLink } from '../../components/service-support/ServiceSupportLink';
import { readGeneration, type ProjectSnapshot } from '../../lib/generation';
import { WebApiRequestError } from './adapters/webApi';
import { WorkPage } from './WorkPage';
import { RegenerateOutlineDialog } from './components/generation';
import { useConversation, toStreamingOutlineRecord, type DoeQuestionsContext } from './conversation';
import { WorkConversation } from './generation/WorkConversation';
import { OutlineToolbar } from './components/generation/OutlineToolbar';
import { WorkOutlinePreview, type WorkOutlineCard, type WorkOutlinePreviewHandle, type WorkOutlineToolbarState } from './components/generation/outline/WorkOutlinePreview';
import { saveOutline, toOutlineRecord } from './generation/outlineAdapter';
import { useGeneration } from './generation/useGeneration';
import './components/generation/outline/original-layout.css';
import './generation/conversation.css';
import { AttachmentFileInput, AttachmentUploadButton, PromptAttachmentList, getOrCreatePromptAttachmentDraftId, useAttachmentDrop, usePromptAttachments } from '../../features/attachments';

const emptyToolbar: WorkOutlineToolbarState = { slideCount: 0, canUndo: false, canRedo: false, hasPendingChanges: false, saveState: 'idle', errorMessage: null };

/** The original DOE Work shell owns prompt, outline and slides on one route. */
export function GenerationWorkPage({ projectId, onBack, registerLeaveGuard }: {
  projectId: string; onBack: () => void; registerLeaveGuard?: (guard: (() => Promise<boolean>) | null) => void;
}) {
  const { t } = useTranslation(['work', 'generation']);
  const { project, error, busy, act, recover: recoverAction, accept, refresh } = useGeneration(projectId);
  const conversation = useConversation(projectId, { onSnapshot: accept });
  const [settings, setSettings] = useState(false);
  const settingsId = useId();
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 64.0625rem)').matches);
  const [mobileView, setMobileView] = useState<'chat' | 'preview'>('chat');
  const [toolbar, setToolbar] = useState(emptyToolbar);
  const [message, setMessage] = useState('');
  const [regenerate, setRegenerate] = useState(false);
  const [direction, setDirection] = useState('');
  const [operationError, setOperationError] = useState<string | null>(null);
  const [operating, setOperating] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const attachmentInput = useRef<HTMLInputElement>(null);
  const [draftId] = useState(() => getOrCreatePromptAttachmentDraftId(`work:${projectId}`));
  const attachments = usePromptAttachments({draftId});
  const recover = recoverAction ? async () => {
    const accepted = await recoverAction();
    if (accepted) await attachments.refreshDraft();
    return accepted;
  } : null;
  const editor = useRef<WorkOutlinePreviewHandle>(null);
  const projectRef = useRef(project); projectRef.current = project;
  const toolbarRef = useRef(toolbar); toolbarRef.current = toolbar;
  const actionPending = useRef(false);
  const mutationPending = useRef(busy || operating); mutationPending.current = busy || operating;
  const pendingSave = useRef<{ project: ProjectSnapshot; cards: WorkOutlineCard[]; revision: number } | null>(null);
  const remoteReady = Boolean(project?.schemaDeck);
  const ready = remoteReady && !toolbar.hasPendingChanges;
  const draftConflict = Boolean(toolbar.hasPendingChanges && project?.outline?.confirmed);
  const running = project?.status === 'running';
  const drop = useAttachmentDrop({onFiles:attachments.addFiles,disabled:running || busy || operating});
  const stopped = project?.status === 'failed' || project?.status === 'cancelled';
  const canRevise = Boolean(project?.outline && !project.outline.confirmed && !running && project.status !== 'questions');
  const streamingOutline = useMemo(() => toStreamingOutlineRecord(conversation.streamingOutline, projectId), [conversation.streamingOutline, projectId]);
  const hasOutline = Boolean(project?.outline || streamingOutline);
  const outline = useMemo(() => project ? toOutlineRecord(project) : null, [project?.outline, project?.revision]);
  const disabled = busy || operating;
  const errorText = draftConflict ? t('generation:conflict') : error instanceof WebApiRequestError ? (error.status === 409 ? t('generation:conflict') : error.message) : error ? t('generation:unavailable') : operationError;
  const needsReload = draftConflict || toolbar.saveState === 'error' || error instanceof WebApiRequestError && error.status === 409;

  useEffect(() => {
    const media = window.matchMedia('(min-width: 64.0625rem)');
    const update = () => setDesktop(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => { if (hasOutline) setMobileView('preview'); }, [hasOutline]);

  const persist = useCallback(async (cards: WorkOutlineCard[], expectedRevision: number) => {
    const current = projectRef.current;
    if (!current) throw new Error(t('generation:unavailable'));
    let revision = expectedRevision;
    // A failed response may still have committed. Recover that exact write before saving newer edits.
    if (pendingSave.current) {
      const previous = pendingSave.current;
      const recovered = await saveOutline(previous.project, previous.cards, previous.revision);
      pendingSave.current = null; accept(recovered);
      if (JSON.stringify(previous.cards) === JSON.stringify(cards)) return toOutlineRecord(recovered)!;
      revision = recovered.revision;
    }
    pendingSave.current = { project: current, cards, revision };
    try {
      const saved = await saveOutline(current, cards, revision);
      pendingSave.current = null; accept(saved);
      return toOutlineRecord(saved)!;
    } catch (reason) {
      if (reason instanceof WebApiRequestError && reason.status < 500) pendingSave.current = null;
      throw reason;
    }
  }, [accept, t]);

  const flush = useCallback(async () => {
    if (mutationPending.current) return false;
    if (toolbarRef.current.hasPendingChanges && projectRef.current?.outline?.confirmed) return false;
    if (!editor.current || !toolbarRef.current.hasPendingChanges) return true;
    try { return Boolean(await editor.current.saveNow()); }
    catch (reason) { setOperationError(reason instanceof Error ? reason.message : t('toolbar.saveFailed')); return false; }
  }, [t]);
  useEffect(() => {
    if (ready) return;
    registerLeaveGuard?.(flush);
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (toolbarRef.current.hasPendingChanges) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => { registerLeaveGuard?.(null); window.removeEventListener('beforeunload', beforeUnload); };
  }, [flush, ready, registerLeaveGuard]);

  const perform = async (kind: 'confirm' | 'revise' | 'retry' | 'cancel', instruction?: string) => {
    if (actionPending.current || busy || !projectRef.current) return false;
    if (kind!=='cancel' && attachments.hasBlockingItems) return false;
    actionPending.current = true; setOperating(true); setOperationError(null);
    try {
      let revision = projectRef.current.revision;
      if ((kind === 'confirm' || kind === 'revise' || kind === 'retry' && projectRef.current.outline && !projectRef.current.outline.confirmed) && editor.current) {
        const saved = await editor.current.saveNow();
        if (!saved) return false;
        revision = saved.revision;
      }
      const sent = kind!=='cancel' ? attachments.readyItems.map(item=>item.clientUploadId) : [];
      const accepted = await act({ action: kind, expectedRevision: revision, ...(kind!=='cancel' ? {uploadIds:attachments.readyUploadIds} : {}), ...(kind === 'revise' ? { message: instruction?.trim() } : {}) });
      if (accepted) attachments.clearItems(sent);
      if (accepted) { setMessage(''); setDirection(''); setRegenerate(false); }
      return accepted;
    } catch (reason) {
      setOperationError(reason instanceof Error ? reason.message : t('toolbar.saveFailed')); return false;
    } finally { actionPending.current = false; setOperating(false); }
  };
  const loadLatest = () => {
    pendingSave.current = null; setOperationError(null); setEditorKey(value => value + 1); refresh();
  };
  const questions: DoeQuestionsContext = {
    scopeKey: projectId, activeRequestId: project?.status === 'questions' ? project.run?.id : null,
    answersByRequest: conversation.answersByRequest, busy: disabled || attachments.hasBlockingItems,
    onUpload: () => attachmentInput.current?.click(),
    onSubmit: async (requestId, _prompt, answers) => {
      const current = projectRef.current;
      if (!current || current.status !== 'questions' || current.run?.id !== requestId) throw new Error(t('generation:conflict'));
      if (attachments.hasBlockingItems) throw new Error(t('uploads:sendBlocked'));
      const sent=attachments.readyItems.map(item=>item.clientUploadId);
      if (!await act({ action: 'answer', expectedRevision: current.revision, answers,uploadIds:attachments.readyUploadIds })) throw new Error(t('generation:unavailable'));
      attachments.clearItems(sent);
    },
  };
  const sendChat = async (message: string, sourceRevision: number, uploadIds:string[]) => {
    // Flushing the editor can advance both deck and project revisions; read its committed result.
    const current = await readGeneration(projectId);
    accept(current);
    if (current.schemaDeck?.revision !== sourceRevision) throw new Error(t('generation:conflict'));
    return act({ action: 'chat', expectedRevision: current.revision, expectedDeckRevision: sourceRevision, message,uploadIds });
  };
  const dock = hasOutline && <OutlineToolbar state={toolbar} busy={disabled || running || project?.status === 'questions' || attachments.hasBlockingItems}
    confirmed={Boolean(project?.outline?.confirmed)} generating={Boolean(running && project?.run?.stage === 'slides')}
    retry={Boolean(stopped && project?.outline?.confirmed)} onRegenerate={() => setRegenerate(true)}
    onConfirm={() => void perform(stopped && project?.outline?.confirmed ? 'retry' : 'confirm')} />;

  if (ready && project) return <WorkPage projectId={projectId} onBack={onBack} registerLeaveGuard={registerLeaveGuard}
    ai={{ project, conversation, questions, attachments, busy: disabled, error: errorText, recover, onSend: sendChat,
      onCancel: () => perform('cancel'), onRetry: () => perform('retry'), onRefresh: refresh }} />;
  return <div className="app-shell dashboard-shell work-shell work-surface-doe-next open-source-work" data-theme="light"
    data-work-surface="doe-next" data-work-layout={desktop ? 'doe-floating' : undefined} data-doe-work-stage={hasOutline ? 'outline' : 'prompt'}
    style={{ '--work-doe-target-background': stageColorFor(undefined) } as CSSProperties}>
    <div className="app-body"><main className={`main-content work-mobile-${mobileView}`}>
      <header className="work-nav-bar">
        <div className="work-nav-left work-nav-desktop-only">
          <button className="work-back-btn" type="button" aria-label={t('generation:back')} disabled={disabled} onClick={() => void flush().then(ok => { if (ok) onBack(); })}><ArrowLeft aria-hidden="true" /></button>
          <div className="work-nav-title"><span>{project?.title || 'Yrkie'}</span></div>
        </div>
        <button className="work-mobile-nav-button" type="button" aria-label={t('generation:back')} disabled={disabled} onClick={() => void flush().then(ok => { if (ok) onBack(); })}><ArrowLeft aria-hidden="true" /></button>
        <div className="work-mobile-nav-title">{project?.title || 'Yrkie'}</div>
        {desktop && <div className="work-doe-preview-controls-host work-preview-panel">{dock}</div>}
        <div className="work-nav-actions work-nav-desktop-only"><ServiceSupportLink className="work-nav-action-btn upgrade" /><button className="work-nav-icon-btn" type="button" aria-label={t('generation:settings')} title={t('generation:settings')} aria-haspopup="dialog" onClick={() => setSettings(true)}><Settings2 aria-hidden="true" /></button></div>
        <button className="work-mobile-nav-button work-mobile-view-toggle" type="button" disabled={!hasOutline}
          aria-label={t(mobileView === 'chat' ? 'outline.previewAria' : 'generation:request')} aria-pressed={mobileView === 'preview'}
          onClick={() => setMobileView(current => current === 'chat' ? 'preview' : 'chat')}>
          {mobileView === 'chat' ? <Layers aria-hidden="true" /> : <MessageSquare aria-hidden="true" />}
        </button>
      </header>
      <div className="work-chat-island">
        <section className="view-container chat-history-view active" aria-label={t('generation:request')}>
          <WorkConversation conversation={conversation} project={project} questions={questions} busy={disabled}
            onRetry={() => void perform('retry')} onSettings={() => setSettings(true)}>
            {(errorText || toolbar.saveState === 'error') && <div className="message-item-text" role="alert"><p>{errorText || toolbar.errorMessage}</p><div className="message-actions">
              {recover ? <button className="message-action-btn" type="button" disabled={disabled} onClick={() => void recover()}>{t('generation:recover')}</button>
                : <button className="message-action-btn" type="button" disabled={disabled} onClick={needsReload ? loadLatest : refresh}>{t(needsReload ? 'generation:reloadOutline' : 'generation:refresh')}</button>}
              {toolbar.saveState === 'error' && <button className="message-action-btn" type="button" disabled={disabled} onClick={() => void flush()}>{t('generation:retry')}</button>}
            </div></div>}
          </WorkConversation>
        </section>
        <div className="input-container-wrapper chat-ui-element">
          <div className={`input-box${drop.isDragging ? ' attachment-drag-active' : ''}`} {...drop.dragHandlers}><textarea rows={1} aria-label={t('generation:revise')} placeholder={t('generation:revisionPlaceholder')}
            value={message} maxLength={12500} disabled={!canRevise || disabled} onChange={event => setMessage(event.target.value)}
            onKeyDown={event => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.nativeEvent.isComposing && message.trim() && canRevise) { event.preventDefault(); void perform('revise', message); } }} />
          <PromptAttachmentList {...attachments} disabled={disabled || running} onRemove={id=>void attachments.removeItem(id)} onRetry={id=>void attachments.retryItem(id)} onRestore={()=>void attachments.refreshDraft()} />
          <div className="input-actions"><div className="action-group"><AttachmentUploadButton inputRef={attachmentInput} disabled={disabled || running || !attachments.canAddMore} /></div>
              <div className="send-group"><span className="send-hint">Ctrl+Enter</span>{running ? <button className="icon-btn stop-btn" type="button" aria-label={t('generation:cancel')} disabled={disabled} onClick={() => void perform('cancel')}>{disabled ? <LoaderCircle aria-hidden="true" /> : <Square aria-hidden="true" />}</button>
                : <button className={`icon-btn send-btn${!canRevise || !message.trim() || disabled || attachments.hasBlockingItems ? ' disabled' : ''}`} type="button" aria-label={t('generation:revise')} disabled={!canRevise || !message.trim() || disabled || attachments.hasBlockingItems} onClick={() => void perform('revise', message)}><ArrowUp style={{width:'1.125rem',height:'1.125rem'}} aria-hidden="true" /></button>}</div>
            </div>
          </div>
          <AttachmentFileInput inputRef={attachmentInput} onFiles={attachments.addFiles} disabled={disabled || running || !attachments.canAddMore} />
        </div>
      </div>
      <section className="work-preview-panel outline-active" aria-label={t('outline.previewAria')}>
        {!desktop && dock}
        <div className="work-preview-outline-shell active"><WorkOutlinePreview key={editorKey} ref={editor} outline={streamingOutline ?? outline} streamingDraft={Boolean(streamingOutline)}
          isOutlineLoading={!project && !error || Boolean(running && !outline && !streamingOutline)} outlineLoadError={null} readOnly={!canRevise || disabled} hideDoeImageReferences
          onSave={persist} onToolbarStateChange={setToolbar} /></div>
      </section>
    </main></div>
    <RegenerateOutlineDialog open={regenerate} busy={disabled} value={direction} onChange={setDirection}
      onClose={() => setRegenerate(false)} onSubmit={() => void perform('revise', direction)} error={errorText ?? undefined} />
    {settings && <SettingsDialog id={settingsId} initialTab="models" onClose={() => setSettings(false)} />}
  </div>;
}
