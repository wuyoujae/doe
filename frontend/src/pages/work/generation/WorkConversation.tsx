import { RefreshCw, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { MessagePanel, type DoeQuestionsContext, type useConversation } from '../conversation';
import type { ProjectSnapshot } from '../../../lib/generation';

export type WorkConversationState = ReturnType<typeof useConversation>;

/** Keep the original MessagePanel independent from HTTP and project mutations. */
export function WorkConversation({ conversation, project, questions, busy, onRetry, onSettings, children }: {
  conversation: WorkConversationState; project: ProjectSnapshot | null; questions: DoeQuestionsContext;
  busy: boolean; onRetry: () => void; onSettings: () => void; children?: ReactNode;
}) {
  const { t } = useTranslation('generation');
  const stopped = project?.status === 'failed' || project?.status === 'cancelled';
  return <>
    <MessagePanel messages={conversation.messages} isStreaming={project?.status === 'running'} questions={questions}
      emptyText={conversation.historyLoading ? t('loading') : undefined} />
    {(stopped || conversation.error || children) && <div className="work-conversation-actions">
      {conversation.error && <div className="message-item-text" role="status"><p>{conversation.error}</p>
        <button className="message-action-btn" type="button" onClick={conversation.refresh}><RefreshCw aria-hidden="true" />{t('refresh')}</button></div>}
      {stopped && <div className="message-actions">
        <button className="message-action-btn" type="button" disabled={busy} onClick={onRetry}><RefreshCw aria-hidden="true" />{t('retry')}</button>
        <button className="message-action-btn" type="button" onClick={onSettings}><Settings aria-hidden="true" />{t('settings')}</button>
      </div>}
      {children}
    </div>}
  </>;
}
