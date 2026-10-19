import { ArrowLeft, ArrowUp, Layers, LoaderCircle, Menu, MessageSquare, RefreshCw, Settings2, Square } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { stageColorFor } from '@yrkie/doe/packages/doe-theme/src/registry/index.js';
import { readProject, type LocalProject } from '../../lib/projects';
import { readSessionSchemaDeck, type SessionSchemaDeck } from './adapters/schema-deck';
import { WorkSlideStudio, type WorkSlideStudioHandle, type WorkSlideStudioSaveState } from './components/WorkSlideStudio';
import { DoeComponentToolbar } from './toolbar/ComponentToolbar';
import type { DoeSettingsLabels, DoeSettingsSection } from './toolbar/settings';
import './styles/shell.css';
import './styles/layout.css';
import './styles/chat-shell.css';
import './styles/messages.css';
import './styles/composer.css';
import './styles/metrics.css';
import './styles/typography.css';
import './styles/studio.css';
import './styles/confirm-dialog.css';
import './work.css';
import type { ProjectSnapshot } from '../../lib/generation';
import type { DoeQuestionsContext } from './conversation';
import { WorkConversation, type WorkConversationState } from './generation/WorkConversation';
import { SettingsDialog } from '../../components/settings/SettingsDialog';
import './generation/conversation.css';
import { AttachmentFileInput, AttachmentUploadButton, PromptAttachmentList, useAttachmentDrop, type usePromptAttachments } from '../../features/attachments';
import { ExportActions } from '../../features/exports';
import { WorkPresentationActions } from '../../features/presentation';
import { prepareOperationalDocument } from './adapters/operational-document';
import { WorkMobileMenu } from './components/WorkMobileMenu';
import { ServiceSupportLink } from '../../components/service-support/ServiceSupportLink';

type WorkAi = {
  project: ProjectSnapshot; conversation: WorkConversationState; questions: DoeQuestionsContext;
  busy: boolean; error: string | null; recover: (() => Promise<boolean>) | null;
  attachments: ReturnType<typeof usePromptAttachments>;
  onSend: (message: string, sourceRevision: number, uploadIds:string[]) => Promise<boolean>;
  onCancel: () => Promise<boolean>; onRetry: () => Promise<boolean>; onRefresh: () => void;
};

export function WorkPage({ projectId, onBack, registerLeaveGuard, ai }: {
  projectId: string;
  onBack: () => void;
  registerLeaveGuard?: (guard: (() => Promise<boolean>) | null) => void;
  ai?: WorkAi;
}) {
  const { t, i18n } = useTranslation('work');
  const [project, setProject] = useState<LocalProject | null>(null);
  const [record, setRecord] = useState<SessionSchemaDeck | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>();
  const [settings, setSettings] = useState<DoeSettingsSection | null>(null);
  const [viewMode, setViewMode] = useState<'single' | 'continuous'>('continuous');
  const [mobileView, setMobileView] = useState<'chat' | 'preview'>('preview');
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 64.0625rem)').matches);
  const [saveState, setSaveState] = useState<WorkSlideStudioSaveState>({ state: 'idle', dirty: false, errorMessage: null });
  const [leaving, setLeaving] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [modelSettings, setModelSettings] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [desktopActions, setDesktopActions] = useState<HTMLDivElement | null>(null);
  const [mobileActions, setMobileActions] = useState<HTMLElement | null>(null);
  const settingsId = useId();
  const sendPending = useRef(false);
  const attachmentInput = useRef<HTMLInputElement>(null);
  const attachments = ai?.attachments;
  const running = ai?.project.status === 'running';
  const awaitingAnswers = ai?.project.status === 'questions';
  const editorLocked = running || awaitingAnswers || Boolean(ai?.busy);
  const drop = useAttachmentDrop({onFiles:files=>attachments?.addFiles(files),disabled:!ai || running || sending || Boolean(ai?.busy)});
  const editor = useRef<WorkSlideStudioHandle>(null);
  const displayReady = useRef(false);
  const currentSaveState = useRef(saveState);
  currentSaveState.current = saveState;
  const activeProject = useRef(projectId);
  activeProject.current = projectId;
  const actionsHost = desktop ? desktopActions : mobileActions;
  useEffect(() => { if (desktop) setMobileMenu(false); }, [desktop]);

  const flushBeforeLeave = useCallback(async () => {
    if (!editor.current || (!displayReady.current && !currentSaveState.current.dirty)) return true;
    return Boolean(await editor.current.flushAndSaveForExport());
  }, []);

  useEffect(() => {
    registerLeaveGuard?.(flushBeforeLeave);
    return () => registerLeaveGuard?.(null);
  }, [flushBeforeLeave, registerLeaveGuard]);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 64.0625rem)');
    const update = () => setDesktop(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    displayReady.current = false;
    setLoading(true); setLoadError(null); setRecord(null); setProject(null); setTheme(undefined);
    setSettings(null); setViewMode('continuous');
    setSaveState({ state: 'idle', dirty: false, errorMessage: null });
    void Promise.all([readProject(projectId), readSessionSchemaDeck(projectId, { signal: controller.signal })]).then(([nextProject, nextRecord]) => {
      if (controller.signal.aborted) return;
      if (!nextProject || !nextRecord) throw new Error('未找到可编辑的文稿，请返回新建页查看生成进度。');
      setProject(nextProject); setRecord(nextRecord); setTheme(String(nextRecord.deck.deck.theme || ''));
    }).catch(reason => {
      if (!controller.signal.aborted) setLoadError(reason instanceof Error ? reason.message : '无法读取本地项目。');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [projectId, loadAttempt]);

  const acceptRecord = useCallback((next: SessionSchemaDeck) => {
    if (next.sessionId !== activeProject.current) return;
    setRecord(current => !current || next.revision >= current.revision ? next : current);
    setProject(current => current?.id === next.sessionId ? { ...current, title: next.deck.deck.title, schemaDeck: next } : current);
  }, []);

  useEffect(() => {
    if (!ai?.project.schemaDeck || loading) return;
    acceptRecord(ai.project.schemaDeck);
  }, [ai?.project.schemaDeck, loading, acceptRecord]);

  const send = async () => {
    if (!ai || sendPending.current || editorLocked || !message.trim() || !editor.current || attachments?.hasBlockingItems) return;
    sendPending.current = true; setSending(true); setChatError(null);
    try {
      const prepared = await editor.current.flushAndSaveForExport();
      if (!prepared) return;
      const sent=ai.attachments.readyItems.map(item=>item.clientUploadId);
      if (await ai.onSend(message.trim(), prepared.sourceRevision, ai.attachments.readyUploadIds)) {setMessage('');ai.attachments.clearItems(sent);}
    } catch (reason) { setChatError(reason instanceof Error ? reason.message : t('studio.revisionConflict')); }
    finally { sendPending.current = false; setSending(false); }
  };

  const back = async () => {
    if (leaving) return;
    setLeaving(true);
    try {
      if (!await flushBeforeLeave()) return;
      onBack();
    } finally { setLeaving(false); }
  };

  const prepareOutput = async () => {
    if (editorLocked || sending || loading || !displayReady.current) return null;
    const saved = await editor.current?.flushAndSaveForExport();
    return saved ? prepareOperationalDocument(projectId, saved.sourceRevision) : null;
  };

  return <div className="app-shell dashboard-shell work-shell work-surface-doe-next open-source-work" data-theme="light"
    data-work-surface="doe-next" data-work-layout={desktop ? 'doe-floating' : undefined} data-doe-work-stage="slides"
    style={{ '--work-doe-target-background': stageColorFor(theme) } as CSSProperties}>
    <div className="app-body">
      <main className={`main-content work-mobile-${mobileView}`}>
        <header className="work-nav-bar">
          <div className="work-nav-left work-nav-desktop-only">
            <button className="work-back-btn" type="button" aria-label="返回新建" disabled={leaving} onClick={() => void back()}><ArrowLeft aria-hidden="true" /></button>
            <div className="work-nav-title"><span>{project?.title || 'Yrkie'}</span></div>
          </div>
          <button className="work-mobile-nav-button work-mobile-menu-trigger" type="button" aria-label={t('menu')} aria-expanded={mobileMenu} disabled={leaving} onClick={() => setMobileMenu(true)}><Menu aria-hidden="true" /></button>
          <div className="work-mobile-nav-title">{project?.title || 'Yrkie'}</div>
          {desktop && <div className="work-doe-preview-controls-host work-preview-panel" aria-label="幻灯片编辑器" />}
          <div className="work-nav-actions work-nav-desktop-only" ref={setDesktopActions}>
            {saveState.state === 'error' && <button className="work-nav-action-btn" type="button" onClick={() => void editor.current?.saveNow()}><RefreshCw aria-hidden="true" /><span>重试保存</span></button>}
          </div>
          <button className="work-mobile-nav-button work-mobile-view-toggle" type="button" aria-label={mobileView === 'chat' ? '显示幻灯片' : '显示需求'} aria-pressed={mobileView === 'preview'} onClick={() => setMobileView(current => current === 'chat' ? 'preview' : 'chat')}>
            {mobileView === 'chat' ? <Layers aria-hidden="true" /> : <MessageSquare aria-hidden="true" />}
          </button>
        </header>
        <section className="work-chat-island" aria-label="制作需求">
          <div className={`view-container chat-history-view active${ai ? '' : ' local-project-conversation'}`}>
            {ai ? <WorkConversation conversation={ai.conversation} project={ai.project} questions={{...ai.questions,onUpload:()=>attachmentInput.current?.click()}}
              busy={ai.busy || sending} onRetry={() => void ai.onRetry()} onSettings={() => setModelSettings(true)}>
              {(chatError || ai.error) && <div className="message-item-text" role="alert"><p>{chatError || ai.error}</p>
                {ai.recover ? <button className="message-action-btn" type="button" disabled={ai.busy} onClick={() => void ai.recover?.()}>{t('generation:recover')}</button>
                  : <button className="message-action-btn" type="button" onClick={ai.onRefresh}>{t('generation:refresh')}</button>}</div>}
            </WorkConversation> : <>
              {project?.prompt && <div className="message-group user-message"><div className="message-items-wrapper"><div className="message-item-text"><p>{project.prompt}</p></div></div></div>}
              <p className="local-ai-notice">这是保存在浏览器中的旧版草稿。你可以编辑幻灯片，也可以返回新建页面创建 AI 文稿。</p>
            </>}
          </div>
          <div className="input-container-wrapper chat-ui-element">
            <div className={`input-box${drop.isDragging ? ' attachment-drag-active' : ''}`} {...drop.dragHandlers}><textarea rows={1} value={message} maxLength={12500} disabled={!ai || editorLocked || sending}
              aria-label={t('generation:request')} placeholder={ai ? t('generation:revisionPlaceholder') : '请新建 AI 文稿以使用聊天编辑'}
              onChange={event => setMessage(event.target.value)}
              onKeyDown={event => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }} />
              {attachments && <PromptAttachmentList {...attachments} disabled={running || sending || ai?.busy} onRemove={id=>void attachments.removeItem(id)} onRetry={id=>void attachments.retryItem(id)} onRestore={()=>void attachments.refreshDraft()} />}
              <div className="input-actions"><div className="action-group"><AttachmentUploadButton inputRef={attachmentInput} disabled={!attachments || running || sending || ai?.busy || !attachments.canAddMore} /></div>
                <div className="send-group"><span className="send-hint">Ctrl+Enter</span>{running ? <button className="icon-btn stop-btn" type="button" aria-label={t('generation:cancel')} disabled={ai?.busy} onClick={() => void ai?.onCancel()}><Square aria-hidden="true" /></button>
                  : <button className={`icon-btn send-btn${!ai || !message.trim() || editorLocked || sending || attachments?.hasBlockingItems ? ' disabled' : ''}`} type="button" disabled={!ai || !message.trim() || editorLocked || sending || attachments?.hasBlockingItems} aria-label={t('generation:continue')} onClick={() => void send()}>{sending ? <LoaderCircle aria-hidden="true" /> : <ArrowUp aria-hidden="true" />}</button>}</div>
              </div>
            </div>
            {attachments && <AttachmentFileInput inputRef={attachmentInput} onFiles={attachments.addFiles} disabled={running || sending || ai?.busy || !attachments.canAddMore} />}
          </div>
        </section>
        <section className="work-preview-panel" aria-label="幻灯片">
          {saveState.state === 'error' && <div className="local-save-error" role="alert"><span>{saveState.errorMessage}</span><button type="button" onClick={() => void editor.current?.saveNow()}>重试保存</button></div>}
          {loading || loadError ? <div className="local-work-load" role={loadError ? 'alert' : 'status'}>
            <p>{loadError || '正在读取本地项目…'}</p>
            {loadError && <button type="button" onClick={() => setLoadAttempt(value => value + 1)}>重新读取</button>}
          </div> : record && <div className="work-slide-studio-shell active">
            <div className="doe-component-toolbar-dock"><DoeComponentToolbar disabled={editorLocked || sending} activeSettings={settings}
              onSettings={section => editor.current?.openSettings(section, i18n.resolvedLanguage || i18n.language, t('settings', { returnObjects: true }) as DoeSettingsLabels)}
              viewMode={viewMode} onViewMode={mode => editor.current?.setViewMode(mode, t('canvasView', { returnObjects: true }) as Record<string, string>)}
              onInsert={async (name, locale) => { if (!editor.current) throw new Error(t('doeInteraction:insert.not-ready')); await editor.current.insertComponent(name, locale); }} /></div>
            <WorkSlideStudio key={projectId} ref={editor} readOnly={editorLocked || sending} active={desktop || mobileView === 'preview'} editorLayout="doe-work" sessionId={projectId} record={record}
              onDisplayReadyChange={ready => { displayReady.current = ready; }}
              onRecordChange={acceptRecord} onThemeChange={(id, next) => { if (id === activeProject.current) setTheme(next); }}
              onSettingsChange={setSettings} onViewModeChange={setViewMode} onSaveStateChange={setSaveState} />
          </div>}
        </section>
      </main>
    </div>
    {!desktop && mobileMenu && <WorkMobileMenu title={project?.title || 'Yrkie'} onClose={() => setMobileMenu(false)} onBack={() => { setMobileMenu(false); void back(); }} actionsRef={setMobileActions} />}
    <ExportActions projectId={projectId} title={project?.title || 'Yrkie'} disabled={editorLocked || sending || loading || Boolean(loadError)} prepare={prepareOutput} buttonHost={actionsHost} />
    <WorkPresentationActions projectId={projectId} title={project?.title || 'Yrkie'} disabled={editorLocked || sending || loading || Boolean(loadError)} prepare={async () => { const saved = await prepareOutput(); return saved ? { projectId: saved.projectId, sourceRevision: saved.revision } : null; }} buttonHost={actionsHost} />
    {actionsHost && createPortal(<><ServiceSupportLink className="work-nav-action-btn upgrade" />
      <button className="work-nav-icon-btn" type="button" aria-label={t('generation:settings')} title={t('generation:settings')} aria-haspopup="dialog" onClick={() => setModelSettings(true)}><Settings2 aria-hidden="true" /><span>{t('generation:settings')}</span></button></>, actionsHost)}
    {modelSettings && <SettingsDialog id={settingsId} initialTab="models" onClose={() => setModelSettings(false)} />}
  </div>;
}
