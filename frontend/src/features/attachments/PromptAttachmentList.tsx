import {
  AlertCircle,
  CheckCircle2,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  LoaderCircle,
  Paperclip,
  RotateCcw,
  X,
} from 'lucide-react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { getPromptAttachmentPreflightError } from '../../lib/attachments';
import type {
  PromptAttachmentItem,
  UploadPipeline,
} from '../../types/uploadAttachment';
import './PromptAttachmentList.css';
import './translations';

type PromptAttachmentListProps = {
  items: PromptAttachmentItem[];
  isRestoring?: boolean;
  restoreFailed?: boolean;
  selectionError?: string | null;
  removingIds?: ReadonlySet<string>;
  disabled?: boolean;
  tone?: 'default' | 'dashboard';
  onRemove: (clientUploadId: string) => void;
  onRetry: (clientUploadId: string) => void;
  onRestore?: () => void;
};

export function PromptAttachmentList({
  items,
  isRestoring = false,
  restoreFailed = false,
  selectionError = null,
  removingIds,
  disabled = false,
  tone = 'default',
  onRemove,
  onRetry,
  onRestore,
}: PromptAttachmentListProps) {
  const { t } = useTranslation('uploads');
  const locale = useAttachmentLocale();

  if (items.length === 0 && !isRestoring && !restoreFailed && !selectionError) return null;

  return (
    <div className={`prompt-attachment-region tone-${tone}`} aria-live="polite">
      {isRestoring && items.length === 0 ? (
        <div className="prompt-attachment-restore-status" role="status">
          <LoaderCircle className="prompt-attachment-spinner" aria-hidden="true" />
          <span>{t('restore.loading')}</span>
        </div>
      ) : null}
      {restoreFailed ? (
        <div className="prompt-attachment-restore-status is-error" role="alert">
          <AlertCircle aria-hidden="true" />
          <span>{t('restore.failed')}</span>
          {onRestore ? (
            <button type="button" disabled={disabled} onClick={onRestore}>{t('retry')}</button>
          ) : null}
        </div>
      ) : null}
      {selectionError ? (
        <div className="prompt-attachment-restore-status is-error" role="alert">
          <AlertCircle aria-hidden="true" />
          <span>{uploadErrorLabel(selectionError, t)}</span>
        </div>
      ) : null}
      {items.length > 0 ? (
        <ul className="prompt-attachment-list" aria-label={t('listLabel')}>
          {items.map((item) => {
            const isRemoving = removingIds?.has(item.clientUploadId) ?? false;
            return (
              <li className={`prompt-attachment-item state-${item.status}`} key={item.clientUploadId}>
                <AttachmentIcon pipeline={item.pipeline} />
                <div className="prompt-attachment-copy">
                  <span className="prompt-attachment-name" title={item.originalName}>{item.originalName}</span>
                  <span className="prompt-attachment-meta">
                    {formatAttachmentSize(item.sizeBytes, t, locale)}
                    <span aria-hidden="true">·</span>
                    <AttachmentStatus item={item} isRemoving={isRemoving} />
                  </span>
                </div>
                <div className="prompt-attachment-actions">
                  {item.status === 'failed' && (item.uploadId ? item.retryable : item.file && !getPromptAttachmentPreflightError(item.file)) ? (
                    <button
                      type="button"
                      disabled={disabled || isRemoving}
                      aria-label={t('retryLabel', { name: item.originalName })}
                      title={t('retry')}
                      onClick={() => onRetry(item.clientUploadId)}
                    >
                      <RotateCcw aria-hidden="true" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={disabled || isRemoving}
                    aria-label={t('removeLabel', { name: item.originalName })}
                    title={t('remove')}
                    onClick={() => onRemove(item.clientUploadId)}
                  >
                    {isRemoving
                      ? <LoaderCircle className="prompt-attachment-spinner" aria-hidden="true" />
                      : <X aria-hidden="true" />}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function AttachmentStatus({ item, isRemoving }: { item: PromptAttachmentItem; isRemoving: boolean }) {
  const { t } = useTranslation('uploads');
  if (isRemoving) {
    return <span className="prompt-attachment-status"><LoaderCircle className="prompt-attachment-spinner" aria-hidden="true" />{t('status.removing')}</span>;
  }
  if (item.status === 'uploading') {
    return <span className="prompt-attachment-status"><LoaderCircle className="prompt-attachment-spinner" aria-hidden="true" />{t('status.uploading')}</span>;
  }
  if (item.status === 'processing') {
    return <span className="prompt-attachment-status"><LoaderCircle className="prompt-attachment-spinner" aria-hidden="true" />{t('status.processing')}</span>;
  }
  if (item.status === 'ready') {
    return <span className="prompt-attachment-status"><CheckCircle2 aria-hidden="true" />{t('status.ready')}</span>;
  }
  return <span className="prompt-attachment-status is-error"><AlertCircle aria-hidden="true" />{uploadErrorLabel(item.errorCode, t)}</span>;
}

function AttachmentIcon({ pipeline }: { pipeline?: UploadPipeline }) {
  const props = { className: 'prompt-attachment-kind-icon', 'aria-hidden': true } as const;
  if (pipeline === 'document') return <FileText {...props} />;
  if (pipeline === 'image') return <FileImage {...props} />;
  if (pipeline === 'audio') return <FileAudio {...props} />;
  if (pipeline === 'video') return <FileVideo {...props} />;
  return <Paperclip {...props} />;
}

function useAttachmentLocale() {
  return useTranslation().i18n.resolvedLanguage ?? 'en';
}

function formatAttachmentSize(
  sizeBytes: number,
  t: TFunction,
  locale: string,
) {
  if (sizeBytes < 1024 * 1024) {
    return t('size.kilobytes', {
      size: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(Math.max(0.1, sizeBytes / 1024)),
    });
  }
  return t('size.megabytes', {
    size: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(sizeBytes / (1024 * 1024)),
  });
}

function uploadErrorLabel(
  code: string | null | undefined,
  t: TFunction,
) {
  const keyByCode: Record<string, string> = {
    too_many_files: 'errors.tooManyFiles',
    attachments_total_too_large: 'errors.totalTooLarge',
    unsupported_file_type: 'errors.unsupportedType',
    unsupported_extension: 'errors.unsupportedType',
    legacy_office_unsupported: 'errors.unsupportedType',
    mime_mismatch: 'errors.invalidType',
    file_type_mismatch: 'errors.invalidType',
    invalid_file_type: 'errors.invalidType',
    invalid_file_signature: 'errors.invalidType',
    document_file_too_large: 'errors.documentTooLarge',
    image_file_too_large: 'errors.imageTooLarge',
    audio_file_too_large: 'errors.audioTooLarge',
    video_file_too_large: 'errors.videoTooLarge',
    file_too_large: 'errors.fileTooLarge',
    upload_too_large: 'errors.fileTooLarge',
    upload_aborted: 'errors.cancelled',
    delete_failed: 'errors.removeFailed',
    parser_unavailable: 'errors.processingFailed',
    parser_not_ready: 'errors.processingFailed',
    parser_busy: 'errors.processingFailed',
    upload_rate_limited: 'errors.rateLimited',
    upload_busy: 'errors.processingFailed',
    parser_timeout: 'errors.processingFailed',
    parser_failed: 'errors.processingFailed',
    parse_failed: 'errors.processingFailed',
    docling_failed: 'errors.processingFailed',
    corrupt_document: 'errors.processingFailed',
    password_protected: 'errors.processingFailed',
    empty_content: 'errors.processingFailed',
    too_many_pages: 'errors.processingFailed',
    content_too_large: 'errors.processingFailed',
    storage_unavailable: 'errors.uploadFailed',
    storage_failed: 'errors.uploadFailed',
    upload_failed: 'errors.uploadFailed',
  };
  return t(keyByCode[code ?? ''] ?? 'errors.uploadFailed');
}
