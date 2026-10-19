export type UploadPipeline = 'document' | 'image' | 'audio' | 'video';

export type UploadAttachmentStatus = 'processing' | 'ready' | 'failed' | 'expired' | 'deleted';

export type UploadAttachment = {
  uploadId: string;
  clientUploadId: string;
  draftId: string;
  pipeline: UploadPipeline;
  status: UploadAttachmentStatus;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  errorCode: string | null;
  errorMessage: string | null;
  retryable?: boolean;
  contentChars?: number;
  estimatedTokens?: number;
  warnings?: string[];
};

export type PromptAttachmentStatus = 'uploading' | 'processing' | 'ready' | 'failed';

export type PromptAttachmentItem = {
  uploadId?: string;
  clientUploadId: string;
  draftId: string;
  pipeline?: UploadPipeline;
  status: PromptAttachmentStatus;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt?: string;
  updatedAt?: string;
  errorCode?: string | null;
  errorMessage?: string | null;
  retryable?: boolean;
  warnings?: string[];
  file?: File;
};

export const MAX_PROMPT_ATTACHMENTS = 8;
export const MAX_PROMPT_ATTACHMENT_BYTES = 250 * 1024 * 1024;

export const PROMPT_ATTACHMENT_ACCEPT = [
  '.pdf',
  '.docx',
  '.pptx',
  '.xlsx',
  '.html',
  '.htm',
  '.md',
  '.csv',
  '.txt',
  '.json',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
].join(',');
