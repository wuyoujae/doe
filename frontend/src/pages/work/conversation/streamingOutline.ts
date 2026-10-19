// Origin: App.tsx streamingOutlineDraftFromEvent and WorkPreviewPanel streamedSessionOutline.
import type { SessionOutlineRecord } from '../components/generation/outline/types';
import type { StreamingOutline } from './projector';

export function toStreamingOutlineRecord(draft: StreamingOutline | null, projectId: string): SessionOutlineRecord | null {
  const value = draft?.document;
  if (!draft || !value || typeof value !== 'object' || Array.isArray(value)) return null;
  const document = value as Record<string, unknown>;
  if (!Array.isArray(document.body)) return null;
  const body = document.body.map((value, index) => {
    const page = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    const position = typeof page.index === 'number' ? page.index : index + 1;
    return { id: typeof page.id === 'string' ? page.id : undefined,
      index: position, page: typeof page.page === 'number' ? page.page : position,
      contents: Array.isArray(page.contents) ? page.contents.filter((item): item is string => typeof item === 'string') : [] };
  });
  return { outlineId: `streaming-${draft.runId}`, sessionId: projectId, title: typeof document.title === 'string' ? document.title : '',
    page_count: typeof document.page_count === 'number' ? document.page_count : body.length, body, revision: 0 };
}
