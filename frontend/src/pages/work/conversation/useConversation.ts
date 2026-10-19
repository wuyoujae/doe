import { useCallback, useEffect, useRef, useState } from 'react';
import { projectPath, projectRequest, type ProjectSnapshot } from '../../../lib/generation';
import { appI18n } from '../../../i18n/i18n';
import { emptyConversation, parseConversationEvent, projectConversationEvent, projectConversationSnapshot, type ConversationEvent, type ConversationState } from './projector';

type Options = { onSnapshot?: (snapshot: ProjectSnapshot) => void };
type Page = { events: unknown[]; cursor: number; hasMore: boolean };
const labels = () => ({ confirm: appI18n.t('generation:confirm'), retry: appI18n.t('generation:retry'), cancel: appI18n.t('generation:cancel') });
const PUBLISH_INTERVAL_MS = 50;

// Adjacent fragments have identical ownership and no intervening semantic event.
// Join once per frame instead of copying a growing arguments string for every token.
function projectBatch(state: ConversationState, events: ConversationEvent[]) {
  const localized = labels();
  let pending: ConversationEvent | null = null;
  let deltas: string[] = [];
  let cursor = state.cursor;
  const flush = () => {
    if (!pending) return;
    state = projectConversationEvent(state, deltas.length ? { ...pending, payload: { ...pending.payload, delta: deltas.join('') } } : pending, localized);
    pending = null;
    deltas = [];
  };
  for (const event of events) {
    if (event.sequence <= cursor) continue;
    cursor = event.sequence;
    const isDelta = event.kind === 'assistant_delta' || event.kind === 'reasoning_delta' || event.kind === 'tool_arguments_delta';
    const previous = pending as ConversationEvent | null;
    if (isDelta && previous?.kind === event.kind && previous.runId === event.runId
      && previous.payload.messageId === event.payload.messageId && previous.payload.itemId === event.payload.itemId) {
      pending = { ...previous, sequence: event.sequence };
      deltas.push(typeof event.payload.delta === 'string' ? event.payload.delta : '');
    } else {
      flush();
      pending = event;
      if (isDelta) deltas.push(typeof event.payload.delta === 'string' ? event.payload.delta : '');
    }
  }
  flush();
  return state;
}

/** Read all durable history before attaching the resumable same-origin event stream. */
export function useConversation(projectId: string, { onSnapshot }: Options = {}) {
  const [state, setState] = useState<ConversationState>(emptyConversation);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const snapshotCallback = useRef(onSnapshot);
  snapshotCallback.current = onSnapshot;
  const previousProject = useRef(projectId);
  const refresh = useCallback(() => setRefreshVersion(version => version + 1), []);

  useEffect(() => {
    let active = true;
    const abort = new AbortController();
    let stream: EventSource | null = null;
    let projected = emptyConversation();
    let receivedCursor = 0;
    let pendingEvents: ConversationEvent[] = [];
    let publishTimer: number | null = null;
    let snapshotRevision = -1;
    if (previousProject.current !== projectId) {
      previousProject.current = projectId;
      setState(emptyConversation());
    }
    setHistoryLoading(true);
    setError(null);
    const flushPending = () => {
      if (publishTimer !== null) { window.clearTimeout(publishTimer); publishTimer = null; }
      if (pendingEvents.length) {
        projected = projectBatch(projected, pendingEvents);
        pendingEvents = [];
      }
    };
    const publish = () => {
      if (!active) return;
      flushPending();
      setState(projected);
    };
    const report = (reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Conversation history could not be loaded.');
    };

    async function connect() {
      if (!projectId) { setHistoryLoading(false); return; }
      let cursor = 0;
      for (;;) {
        const page = await projectRequest<Page>(`${projectPath(projectId)}/conversation?after=${cursor}`, { signal: abort.signal });
        if (!active) return;
        if (!Array.isArray(page.events) || !Number.isSafeInteger(page.cursor) || page.cursor < cursor || typeof page.hasMore !== 'boolean') {
          throw new Error('Invalid conversation history response');
        }
        projected = projectBatch(projected, page.events.map(parseConversationEvent));
        if (page.cursor < projected.cursor || (page.hasMore && page.cursor <= cursor)) {
          throw new Error('Conversation history cursor did not advance');
        }
        cursor = page.cursor;
        if (!page.hasMore) break;
      }
      projected = { ...projected, cursor };
      receivedCursor = cursor;
      publish();
      setHistoryLoading(false);
      stream = new EventSource(`${projectPath(projectId)}/events?after=${cursor}`);
      stream.addEventListener('conversation', event => {
        if (!active) return;
        try {
          const parsed = parseConversationEvent(JSON.parse((event as MessageEvent<string>).data));
          if (parsed.sequence <= receivedCursor) return;
          receivedCursor = parsed.sequence;
          pendingEvents.push(parsed);
          if (publishTimer === null) publishTimer = window.setTimeout(() => {
            try { publish(); } catch (reason) { stream?.close(); report(reason); }
          }, PUBLISH_INTERVAL_MS);
        } catch (reason) {
          stream?.close();
          report(reason);
        }
      });
      stream.addEventListener('snapshot', event => {
        if (!active) return;
        try {
          const snapshot = JSON.parse((event as MessageEvent<string>).data) as ProjectSnapshot;
          if (snapshot.id !== projectId || !Number.isSafeInteger(snapshot.revision)) throw new Error('Invalid project snapshot');
          if (snapshot.revision < snapshotRevision) return;
          snapshotRevision = snapshot.revision;
          flushPending();
          projected = projectConversationSnapshot(projected, snapshot);
          publish();
          snapshotCallback.current?.(snapshot);
        } catch (reason) { report(reason); }
      });
      stream.onopen = () => { if (active) setError(null); };
      // EventSource reconnects with Last-Event-ID; never resubmit a paid generation here.
      stream.onerror = () => { if (active) setError('The live connection was interrupted. Reconnecting…'); };
    }
    void connect().catch(reason => {
      if (!active || abort.signal.aborted) return;
      setHistoryLoading(false);
      report(reason);
    });
    return () => {
      active = false;
      abort.abort();
      stream?.close();
      if (publishTimer !== null) window.clearTimeout(publishTimer);
      pendingEvents = [];
    };
  }, [projectId, refreshVersion]);

  return { messages: state.messages, answersByRequest: state.answersByRequest, streamingOutline: state.streamingOutline,
    isStreaming: state.activeRunId !== null, historyLoading, error, refresh };
}
