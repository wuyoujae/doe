import { ArrowUp, LoaderCircle, Presentation } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreateHeading } from './CreateHeading';
import { CreateStage } from './CreateStage';
import { PromptExamples } from './PromptExamples';
import { RecentProjects, type RecentProjectsProps } from './RecentProjects';
import './create.css';
import { WebApiRequestError } from '../work/adapters/webApi';
import { AttachmentFileInput, AttachmentUploadButton, PromptAttachmentList, getOrCreatePromptAttachmentDraftId, useAttachmentDrop, usePromptAttachments } from '../../features/attachments';

export interface CreateRequest {
  prompt: string;
  title?: string;
  uploadIds?: string[];
}

interface CreatePageProps extends Partial<RecentProjectsProps> {
  onCreate: (request: CreateRequest) => Promise<void>;
  userName?: string;
}

export function CreatePage({ onCreate, userName = 'Yrkie', loadRecentProjects, onOpenProject }: CreatePageProps) {
  const { t } = useTranslation(['dashboard', 'openSourceCreate', 'generation']);
  const [prompt, setPrompt] = useState('');
  const [examplePreview, setExamplePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submittingRef = useRef(false);
  const attachmentInput = useRef<HTMLInputElement>(null);
  const [draftId] = useState(() => getOrCreatePromptAttachmentDraftId('create'));
  const attachments = usePromptAttachments({draftId});
  const drop = useAttachmentDrop({onFiles:attachments.addFiles,disabled:isSubmitting});
  const displayedPrompt = examplePreview ?? prompt;
  const canSubmit = Boolean(prompt.trim()) && !isSubmitting && !attachments.hasBlockingItems;

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const resize = () => {
      const lineHeight = Number.parseFloat(getComputedStyle(textarea).lineHeight);
      const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, lineHeight * 4), lineHeight * 8) / rem}rem`;
      textarea.style.overflowY = textarea.scrollHeight > lineHeight * 8 ? 'auto' : 'hidden';
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [displayedPrompt]);

  const submit = async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || submittingRef.current || attachments.hasBlockingItems) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError('');
    setExamplePreview(null);
    try {
      const sent = attachments.readyItems.map(item => item.clientUploadId);
      await onCreate({ prompt: trimmedPrompt, uploadIds: attachments.readyUploadIds });
      attachments.clearItems(sent);
    } catch (reason) {
      setSubmitError(reason instanceof WebApiRequestError ? reason.message : t('generation:unavailable'));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <section className="dashboard-main-workspace dashboard-create-page" aria-label={t('newMasterpiece')}>
      <header className="dashboard-create-topbar" />
      <CreateStage>
        <CreateHeading userName={userName} />
        <form className={`dashboard-create-prompt${drop.isDragging ? ' attachment-drag-active' : ''}`} {...drop.dragHandlers} onSubmit={(event) => { event.preventDefault(); void submit(); }}>
          <div className="dashboard-create-prompt-input-area">
            <div className="dashboard-create-prompt-text-section">
              <textarea
                ref={textareaRef}
                aria-label={t('create.promptLabel')}
                placeholder={t('create.inventorPlaceholder')}
                data-example-preview={examplePreview !== null || undefined}
                value={displayedPrompt}
                maxLength={12500}
                readOnly={isSubmitting}
                onFocus={() => setExamplePreview(null)}
                onChange={(event) => { setExamplePreview(null); setPrompt(event.target.value); setSubmitError(''); }}
                onKeyDown={(event) => {
                  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    void submit();
                  }
                }}
              />
            </div>
          </div>
          {(attachments.items.length>0 || attachments.restoreFailed || attachments.selectionError) && <div className="dashboard-create-attachment-list"><PromptAttachmentList {...attachments} disabled={isSubmitting} tone="dashboard"
            onRemove={id => void attachments.removeItem(id)} onRetry={id => void attachments.retryItem(id)} onRestore={() => void attachments.refreshDraft()} /></div>}
          {submitError ? <p className="dashboard-create-submit-error" role="alert">{submitError}</p> : null}
          <div className="dashboard-create-prompt-actions">
            <div className="dashboard-create-left-actions">
              <AttachmentUploadButton inputRef={attachmentInput} dashboard disabled={isSubmitting || !attachments.canAddMore} />
              <span className="dashboard-create-format"><Presentation aria-hidden="true" /><span>{t('deckFormat.presentationS')}</span></span>
            </div>
            <div className="dashboard-create-right-actions">
              <div className="send-group dashboard-create-send-group">
                <span className="send-hint dashboard-create-send-hint">{t('create.shortcut')}</span>
                <button
                  className={`dashboard-create-send-button icon-btn send-btn${canSubmit ? '' : ' disabled'}`}
                  type="submit"
                  aria-label={t('generation:create')}
                  title={t('generation:create')}
                  disabled={!canSubmit}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? <LoaderCircle className="create-spinner" aria-hidden="true" /> : <ArrowUp aria-hidden="true" />}
                </button>
              </div>
            </div>
          </div>
          <AttachmentFileInput inputRef={attachmentInput} dashboard onFiles={attachments.addFiles} disabled={isSubmitting || !attachments.canAddMore} />
        </form>
        <PromptExamples
          disabled={isSubmitting}
          onPreview={setExamplePreview}
          onSelect={(value) => { setPrompt(value); setSubmitError(''); textareaRef.current?.focus(); }}
        />
        {loadRecentProjects && onOpenProject ? <RecentProjects loadRecentProjects={loadRecentProjects} onOpenProject={onOpenProject} /> : null}
      </CreateStage>
    </section>
  );
}
