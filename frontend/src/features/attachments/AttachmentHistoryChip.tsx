// Origin: commercial features/attachments/PromptAttachmentList.tsx, history chip only.
import { FileAudio, FileImage, FileText, FileVideo, Paperclip } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { UploadPipeline } from '../../types/uploadAttachment';
import './translations';
import './AttachmentHistoryChip.css';

export function AttachmentHistoryChip({ originalName, pipeline, sizeBytes }: { originalName: string; pipeline?: UploadPipeline; sizeBytes: number }) {
  const { t, i18n } = useTranslation('uploads');
  const Icon = pipeline ? { document: FileText, image: FileImage, audio: FileAudio, video: FileVideo }[pipeline] : Paperclip;
  const megabytes = sizeBytes >= 1024 * 1024;
  const size = new Intl.NumberFormat(i18n.resolvedLanguage, { maximumFractionDigits: 1 })
    .format(megabytes ? sizeBytes / (1024 * 1024) : Math.max(0.1, sizeBytes / 1024));
  return <div className="message-attachment-chip" aria-label={t('historyLabel', { name: originalName })}>
    <Icon className="prompt-attachment-kind-icon" aria-hidden="true" />
    <span className="message-attachment-chip-name" title={originalName}>{originalName}</span>
    <span className="message-attachment-chip-size">{t(megabytes ? 'size.megabytes' : 'size.kilobytes', { size })}</span>
  </div>;
}
