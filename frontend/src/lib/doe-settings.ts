export type DoeEntryKind = 'prompt' | 'schema' | 'skill';
export type DoeEntry = {
  id: string; kind: DoeEntryKind; name: string; description: string;
  content: string; defaultContent: string; enabled: boolean; defaultEnabled: boolean; isModified: boolean;
};
export type DoeSettingsSnapshot = { revision: number; entries: DoeEntry[] };
export type DoeEntryDraft = Pick<DoeEntry, 'id' | 'content' | 'enabled'>;
export type DoeSettingsErrorCode = 'read' | 'write' | 'unavailable' | 'invalid' | 'conflict';

export class DoeSettingsError extends Error {
  constructor(public code: DoeSettingsErrorCode, public field?: string) { super(code); }
}

export const toDoeDraft = (snapshot: DoeSettingsSnapshot): DoeEntryDraft[] =>
  snapshot.entries.map(({ id, content, enabled }) => ({ id, content, enabled }));

async function request(init: RequestInit, failure: 'read' | 'write'): Promise<DoeSettingsSnapshot> {
  let response: Response;
  try {
    response = await fetch('/api/v1/doe-settings', { ...init, cache: 'no-store', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new DoeSettingsError(failure === 'read' ? 'unavailable' : 'write');
  }
  let data: unknown;
  try { data = await response.json(); } catch { throw new DoeSettingsError(failure); }
  if (!response.ok) {
    const error = (data as { error?: { field?: string } })?.error;
    throw new DoeSettingsError(response.status === 409 ? 'conflict' : [400, 413, 422].includes(response.status) ? 'invalid' : failure, error?.field);
  }
  const result = data as DoeSettingsSnapshot;
  if (!Number.isSafeInteger(result?.revision) || result.revision < 0 || !Array.isArray(result.entries) || !result.entries.length
    || result.entries.some(entry => !entry || typeof entry.id !== 'string' || !['prompt', 'schema', 'skill'].includes(entry.kind)
      || typeof entry.name !== 'string' || typeof entry.description !== 'string' || typeof entry.content !== 'string'
      || typeof entry.defaultContent !== 'string' || typeof entry.enabled !== 'boolean' || typeof entry.defaultEnabled !== 'boolean')
    || new Set(result.entries.map(entry => entry.id)).size !== result.entries.length) throw new DoeSettingsError(failure);
  return result;
}

export const readDoeSettings = (signal?: AbortSignal) => request({ method: 'GET', signal }, 'read');
export const saveDoeSettings = (snapshot: DoeSettingsSnapshot, entries: DoeEntryDraft[], signal?: AbortSignal) => {
  const encoder = new TextEncoder();
  let total = 0;
  for (const entry of entries) {
    const definition = snapshot.entries.find(item => item.id === entry.id);
    const bytes = encoder.encode(entry.content).length;
    if (!definition || !entry.content.trim() || bytes > (definition.kind === 'skill' ? 64 : 512) * 1024) {
      throw new DoeSettingsError('invalid', `entries.${entry.id}.content`);
    }
    total += bytes;
  }
  if (total > 2 * 1024 * 1024) throw new DoeSettingsError('invalid');
  return request({ method: 'PUT', body: JSON.stringify({ revision: snapshot.revision, entries }), signal }, 'write');
};
