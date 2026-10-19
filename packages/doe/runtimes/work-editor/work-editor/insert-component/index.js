import { scope } from '../../../../integrations/work/editor/runtime/context/index.js';
import { post } from '../post/index.js';

// Cache promises, not just results: duplicate messages during layout cannot insert twice.
const requests = new Map();
let pending = null;

export function cancelComponentInsertion(requestId) {
  if (pending && (!requestId || pending.requestId === requestId)) pending.cancelled = true;
}

export async function handleComponentInsertion(message) {
  const { requestId } = message;
  if (typeof requestId !== 'string' || !requestId || requestId.length > 200) return;
  if (!requests.has(requestId)) {
    const promise = insert(message).catch(() => ({ accepted: false, errorCode: 'insert-invalid' }));
    requests.set(requestId, promise);
    while (requests.size > 32) requests.delete([...requests.keys()].find(key => key !== pending?.requestId));
  }
  post('insert-component-result', { requestId, ...await requests.get(requestId) });
}

async function insert(message) {
  if (pending) return { accepted: false, errorCode: 'insert-busy' };
  const state = scope.state;
  const result = state.activeResult;
  const token = { requestId: message.requestId, cancelled: false };
  const index = state.activeIndex;
  const version = state.changeVersion;
  const revision = state.formalDeckRevision;
  const current = () => !token.cancelled && state.hostVisible !== false && !state.hostReadOnly && !state.generation && !state.activeRendering
    && state.activeResult === result && state.activeIndex === index
    && result?.slide?.id === message.slideId && state.slides[index]?.id === message.slideId
    && state.changeVersion === version && state.formalDeckRevision === revision;
  if (!state.formalDeckLoaded || !result?.insertComponent || !current()) return { accepted: false, errorCode: 'insert-not-ready' };
  if (message.revision !== revision || message.changeVersion !== version) return { accepted: false, errorCode: 'insert-stale' };
  pending = token;
  try {
    // The host already flushed inline editing. If another edit arrived since,
    // the guard rejects rather than overwriting the user's new work.
    return await result.insertComponent({ name: message.name, locale: message.locale, media: message.media }, current);
  } finally {
    if (pending === token) pending = null;
  }
}
