import { WebApiRequestError } from '../pages/work/adapters/webApi';
import type { SessionSchemaDeck } from '../pages/work/adapters/schema-deck';

export type ProjectStatus = 'draft' | 'running' | 'questions' | 'outline_ready' | 'ready' | 'failed' | 'cancelled';
export type ProjectSummary = { id: string; title: string; prompt: string; status: ProjectStatus; createdAt: string; updatedAt: string };
export type GenerationQuestion = { id: string; question: string; options: string[] };
export type ProjectSnapshot = ProjectSummary & {
  revision: number;
  outline: null | { markdown: string; document: unknown; revision: number; confirmed: boolean };
  schemaDeck: SessionSchemaDeck | null;
  run: null | { id: string; stage: 'outline' | 'slides' | 'edit'; status: string; message: string; errorCode: string | null;
    questions: GenerationQuestion[] | null; events: Array<{ id?: string | number; message?: string; kind?: string; createdAt?: string }> };
};
export type ProjectAction = { action: 'answer' | 'revise' | 'confirm' | 'retry' | 'cancel' | 'chat'; expectedRevision: number;
  requestId: string; message?: string; answers?: Array<{ id: string; answer: string }>; outlineMarkdown?: string; expectedDeckRevision?: number; uploadIds?: string[] };

export const isServerProject = (id: string) => id.startsWith('srv-');
export const projectPath = (id: string) => `/api/v1/projects/${encodeURIComponent(id)}`;

/** Mutations are never retried implicitly: request IDs let an explicit retry recover its receipt. */
export async function projectRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { ...init, credentials: 'same-origin', cache: 'no-store',
    headers: { ...(typeof init.body === 'string' ? { 'Content-Type': 'application/json' } : {}), ...init.headers } });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = body?.error;
    throw new WebApiRequestError(response.status, typeof error?.code === 'string' ? error.code : typeof body?.code === 'string' ? body.code : 'request_failed',
      typeof error?.message === 'string' ? error.message : typeof body?.message === 'string' ? body.message : `HTTP ${response.status}`);
  }
  if (!body) throw new WebApiRequestError(502, 'invalid_response', 'Invalid server response');
  return body as T;
}

export const readGeneration = (id: string, signal?: AbortSignal) => projectRequest<ProjectSnapshot>(projectPath(id), { signal });
export const startGeneration = (prompt: string, requestId: string, uploadIds: string[] = []) => projectRequest<ProjectSnapshot>('/api/v1/projects', {
  method: 'POST', body: JSON.stringify({ prompt, requestId, ...(uploadIds.length ? {uploadIds} : {}) }),
});
export const actOnGeneration = (id: string, action: ProjectAction) => projectRequest<ProjectSnapshot>(`${projectPath(id)}/actions`, {
  method: 'POST', body: JSON.stringify(action),
});
