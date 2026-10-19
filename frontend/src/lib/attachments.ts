import type {
  PromptAttachmentItem,
  UploadAttachment,
  UploadPipeline,
} from '../types/uploadAttachment';
import { WebApiRequestError } from '../pages/work/adapters/webApi';

const DOCUMENT_EXTENSIONS = new Set([
  'pdf', 'docx', 'pptx', 'xlsx', 'html', 'htm', 'md', 'csv', 'txt', 'json',
]);
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp']);
const PIPELINE_SIZE_LIMITS: Record<UploadPipeline, number> = {
  document: 30 * 1024 * 1024,
  image: 20 * 1024 * 1024,
  audio: 25 * 1024 * 1024,
  video: 200 * 1024 * 1024,
};
const DEFAULT_UPLOAD_CONCURRENCY = 3;

export type UploadFileOptions = {
  draftId: string;
  signal?: AbortSignal;
  clientUploadIds?: string[];
  itemSignals?: ReadonlyMap<string, AbortSignal>;
  concurrency?: number;
  onItemChange?: (item: PromptAttachmentItem) => void;
};

export function createClientUploadId(): string {
  return crypto.randomUUID();
}

export function inferUploadPipeline(fileName: string): UploadPipeline | undefined {
  const extension = fileName.trim().toLowerCase().split('.').pop() ?? '';
  if (DOCUMENT_EXTENSIONS.has(extension)) return 'document';
  if (IMAGE_EXTENSIONS.has(extension)) return 'image';
  return undefined;
}

export function getPromptAttachmentPreflightError(file: File) {
  const pipeline = inferUploadPipeline(file.name);
  if (!pipeline) return 'unsupported_file_type';
  if (file.size === 0) return 'empty_content';
  if (file.size > PIPELINE_SIZE_LIMITS[pipeline]) return `${pipeline}_file_too_large`;
  return null;
}

export function createPromptAttachmentItem(
  file: File,
  draftId: string,
  clientUploadId = createClientUploadId(),
): PromptAttachmentItem {
  return {
    clientUploadId,
    draftId,
    pipeline: inferUploadPipeline(file.name),
    status: 'uploading',
    originalName: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    errorCode: null,
    errorMessage: null,
    file,
  };
}

export function promptAttachmentFromUpload(
  attachment: UploadAttachment,
  file?: File,
): PromptAttachmentItem {
  return {
    uploadId: attachment.uploadId,
    clientUploadId: attachment.clientUploadId,
    draftId: attachment.draftId,
    pipeline: attachment.pipeline,
    status: attachment.status === 'ready'
      ? 'ready'
      : attachment.status === 'processing'
        ? 'processing'
        : 'failed',
    originalName: attachment.originalName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    createdAt: attachment.createdAt,
    updatedAt: attachment.updatedAt,
    errorCode: attachment.errorCode,
    errorMessage: attachment.errorMessage,
    retryable: attachment.retryable,
    warnings: attachment.warnings,
    file,
  };
}

export async function uploadFile(files: File[], options: UploadFileOptions) {
  const draftId = options.draftId.trim();
  if (!draftId) {
    throw new Error('draftId is required');
  }

  const items = files.map((file, index) => createPromptAttachmentItem(
    file,
    draftId,
    options.clientUploadIds?.[index],
  ));
  items.forEach((item) => options.onItemChange?.(item));

  let nextIndex = 0;
  const workerCount = Math.min(
    items.length,
    Math.max(1, Math.floor(options.concurrency ?? DEFAULT_UPLOAD_CONCURRENCY)),
  );

  const workers = Array.from({ length: workerCount }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      const initialItem = items[index];
      const file = files[index];
      const result = await uploadOneFile(file, initialItem, options);
      items[index] = result;
      options.onItemChange?.(result);
    }
  });

  await Promise.all(workers);
  return items;
}

export async function loadUploadDraft(draftId: string, signal?: AbortSignal) {
  const payload = await attachmentRequest<{ uploads: UploadAttachment[] }>(
    `/api/v1/uploads?draftId=${encodeURIComponent(draftId)}`,
    { signal, cache: 'no-store' },
  );
  if (!Array.isArray(payload.uploads)) throw new WebApiRequestError(502,'invalid_response','Invalid attachment draft response');
  return payload.uploads;
}

export async function deleteUpload(uploadId: string, signal?: AbortSignal) {
  await attachmentRequest<void>(`/api/v1/uploads/${encodeURIComponent(uploadId)}`, {
    method: 'DELETE',
    signal,
  });
}

export async function cancelUpload(draftId: string, clientUploadId: string, signal?: AbortSignal) {
  await attachmentRequest<void>(`/api/v1/uploads?draftId=${encodeURIComponent(draftId)}&clientUploadId=${encodeURIComponent(clientUploadId)}`, {
    method: 'DELETE', signal,
  });
}

export const retryUpload = (uploadId: string, signal?: AbortSignal) => (
  attachmentRequest<UploadAttachment>(`/api/v1/uploads/${encodeURIComponent(uploadId)}/retry`, {
    method: 'POST', signal,
  })
);

async function attachmentRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { ...init, credentials: 'same-origin', cache: 'no-store' });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = body?.error;
    throw new WebApiRequestError(response.status, error?.code ?? body?.code ?? 'upload_failed',
      error?.message ?? body?.message ?? `HTTP ${response.status}`);
  }
  if (body === null && response.status !== 204) throw new WebApiRequestError(502, 'invalid_response', 'Invalid upload response');
  return body as T;
}

async function uploadOneFile(
  file: File,
  initialItem: PromptAttachmentItem,
  options: UploadFileOptions,
): Promise<PromptAttachmentItem> {
  const pipeline = initialItem.pipeline;
  const preflightError = getPromptAttachmentPreflightError(file);
  if (preflightError || !pipeline) {
    return failedItem(initialItem, preflightError ?? 'unsupported_file_type');
  }

  const signal = mergeAbortSignals(
    options.signal,
    options.itemSignals?.get(initialItem.clientUploadId),
  );
  if (signal?.aborted) {
    return failedItem(initialItem, 'upload_aborted');
  }

  const body = new FormData();
  body.append('file', file, file.name);
  body.append('draftId', initialItem.draftId);
  body.append('clientUploadId', initialItem.clientUploadId);

  try {
    const attachment = await attachmentRequest<UploadAttachment>('/api/v1/uploads', {
      method: 'POST',
      body,
      signal,
    });
    return promptAttachmentFromUpload(attachment, file);
  } catch (error) {
    if (isAbortError(error)) {
      return failedItem(initialItem, 'upload_aborted');
    }
    if (error instanceof WebApiRequestError) {
      return failedItem(
        initialItem,
        error.code || 'upload_failed',
        error.message,
      );
    }
    return failedItem(initialItem, 'upload_failed');
  }
}

function failedItem(
  item: PromptAttachmentItem,
  errorCode: string,
  errorMessage: string | null = null,
): PromptAttachmentItem {
  return {
    ...item,
    status: 'failed',
    errorCode,
    errorMessage,
  };
}

function mergeAbortSignals(...signals: Array<AbortSignal | undefined>) {
  const activeSignals = signals.filter((signal): signal is AbortSignal => Boolean(signal));
  if (activeSignals.length === 0) return undefined;
  if (activeSignals.length === 1) return activeSignals[0];

  if (typeof AbortSignal.any === 'function') return AbortSignal.any(activeSignals);
  const controller = new AbortController();
  const abort = () => controller.abort();
  activeSignals.forEach((signal) => {
    if (signal.aborted) {
      abort();
    } else {
      signal.addEventListener('abort', abort, { once: true });
    }
  });
  return controller.signal;
}

function isAbortError(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'name' in error && error.name === 'AbortError');
}
