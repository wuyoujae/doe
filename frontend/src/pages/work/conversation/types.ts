// Origin: commercial types/session.ts message contracts.
type UploadPipeline = 'document' | 'image' | 'audio' | 'video';
export type MessageRole = 'user' | 'ai';
export type MessageItemStatus = 'running' | 'completed' | 'failed' | 'cancelled';
export type SubAgentActivityKey =
  | 'outlineWorking'
  | 'slideWorking'
  | 'dataWorking'
  | 'documentWorking'
  | 'researchWorking'
  | 'working'
  | 'thinking'
  | 'searching'
  | 'usingTools'
  | 'generatingImages'
  | 'repairing'
  | 'regenerating'
  | 'validating'
  | 'saving'
  | 'completed'
  | 'failed'
  | 'cancelled';
export type PlatformMessageLabelKey =
  | 'thinking'
  | 'thinkingCompleted'
  | 'thinkingInterrupted'
  | 'conversationInterrupted'
  | 'toolCall';

export type TextMessageItem = {
  id: string;
  type: 'text';
  content: string;
  status: MessageItemStatus;
  entryId: string;
  sourceRole: string;
  createdAt: string;
  tools?: unknown;
  tokenConsumption?: number;
};

export type ToolMessageItem = {
  id: string;
  type: 'tool';
  toolName?: string;
  toolExpandable?: boolean;
  toolSubject?: string;
  label: string;
  labelKey?: PlatformMessageLabelKey;
  status: MessageItemStatus;
  detail?: string;
  entryId: string;
  sourceRole: string;
  createdAt: string;
  tools?: unknown;
  tokenConsumption?: number;
};

export type ThinkingMessageItem = {
  id: string;
  type: 'thinking';
  label: string;
  labelKey?: PlatformMessageLabelKey;
  content: string;
  status: MessageItemStatus;
  entryId: string;
  sourceRole: string;
  createdAt: string;
};

export type AgentMessageItem = {
  id: string;
  type: 'agent';
  callId?: string;
  agentId?: string;
  label: string;
  activityKey?: SubAgentActivityKey;
  status: MessageItemStatus;
  defaultOpen?: boolean;
  messages: MessageGroup[];
  entryId: string;
  sourceRole: string;
  createdAt: string;
};

export type AgentActivityMessageItem = {
  id: string;
  type: 'agent_activity';
  activityKey: SubAgentActivityKey;
  status: MessageItemStatus;
  entryId: string;
  sourceRole: string;
  createdAt: string;
};

export type ImageMessageItem = {
  id: string;
  type: 'image';
  generationId: string;
  status: MessageItemStatus;
  aspectRatio: string;
  resolution?: string;
  assetUrl?: string;
  mediaType?: string;
  error?: string;
  entryId: string;
  sourceRole: string;
  createdAt: string;
};

export type AttachmentMessageItem = {
  id: string;
  type: 'attachment';
  status: MessageItemStatus;
  entryId: string;
  sourceRole: string;
  createdAt: string;
  uploadId: string;
  pipeline: UploadPipeline;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

export type VisualCommandMessageItem = {
  id: string;
  type: 'visual_command';
  content: string;
  status: MessageItemStatus;
  entryId: string;
  sourceRole: string;
  createdAt: string;
  assetUrl: string;
  mediaType?: string;
  aspectRatio?: string;
  resolution?: string;
  visualSubmissionId: string;
  visualCommandId: string;
  visualCommandIndex: number;
  widthPx: number;
  heightPx: number;
};

export type MessageItem = TextMessageItem | ToolMessageItem | ThinkingMessageItem | AgentMessageItem | AgentActivityMessageItem | ImageMessageItem | AttachmentMessageItem | VisualCommandMessageItem;

export type MessageGroup = {
  id: string;
  role: MessageRole;
  items: MessageItem[];
};
