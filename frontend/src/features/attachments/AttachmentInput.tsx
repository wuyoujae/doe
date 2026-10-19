import { Plus } from 'lucide-react';
import type { DragEvent, RefObject } from 'react';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PROMPT_ATTACHMENT_ACCEPT } from '../../types/uploadAttachment';
import './translations';
import './composer.css';

export function AttachmentUploadButton({ inputRef, disabled = false, dashboard = false, label }: {
  inputRef: RefObject<HTMLInputElement>;
  disabled?: boolean;
  dashboard?: boolean;
  label?: string;
}) {
  const { t } = useTranslation('uploads');
  const title = label ?? t('pickerLabel');
  return <button className={`${dashboard ? 'dashboard-create-upload-button ' : ''}icon-btn prompt-upload-btn`}
    type="button" title={title} aria-label={title} disabled={disabled} onClick={() => inputRef.current?.click()}>
    <Plus className="prompt-upload-icon" aria-hidden="true" />
  </button>;
}

export function AttachmentFileInput({ inputRef, onFiles, disabled = false, dashboard = false }: {
  inputRef: RefObject<HTMLInputElement>;
  onFiles: (files: File[]) => void | Promise<unknown>;
  disabled?: boolean;
  dashboard?: boolean;
}) {
  const { t } = useTranslation('uploads');
  return <input ref={inputRef} className={dashboard ? 'dashboard-create-file-input' : 'prompt-file-input'}
    type="file" multiple accept={PROMPT_ATTACHMENT_ACCEPT} aria-label={t('pickerLabel')} disabled={disabled}
    onChange={event => {
      const files = Array.from(event.currentTarget.files ?? []);
      event.currentTarget.value = '';
      if (files.length) void onFiles(files);
    }} />;
}

export function useAttachmentDrop({ onFiles, disabled = false }: {
  onFiles: (files: File[]) => void | Promise<unknown>;
  disabled?: boolean;
}) {
  const depth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const containsFiles = (event: DragEvent<HTMLElement>) => Array.from(event.dataTransfer.types).includes('Files');
  const reset = useCallback(() => { depth.current = 0; setIsDragging(false); }, []);
  return {
    isDragging: isDragging && !disabled,
    dragHandlers: {
      onDragEnter(event: DragEvent<HTMLElement>) {
        if (!containsFiles(event)) return;
        event.preventDefault();
        if (!disabled) { depth.current += 1; setIsDragging(true); }
      },
      onDragOver(event: DragEvent<HTMLElement>) {
        if (!containsFiles(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = disabled ? 'none' : 'copy';
      },
      onDragLeave(event: DragEvent<HTMLElement>) {
        if (!containsFiles(event)) return;
        event.preventDefault();
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setIsDragging(false);
      },
      onDrop(event: DragEvent<HTMLElement>) {
        if (!containsFiles(event)) return;
        event.preventDefault();
        reset();
        const files = Array.from(event.dataTransfer.files);
        if (!disabled && files.length) void onFiles(files);
      },
    },
  };
}
