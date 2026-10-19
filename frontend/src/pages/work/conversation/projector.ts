// Original MessagePanel item identities and immutable stream updates, adapted to persisted events.
import type { ProjectSnapshot } from '../../../lib/generation';
import type { AttachmentMessageItem, MessageGroup, MessageItem, MessageItemStatus, TextMessageItem, ThinkingMessageItem, ToolMessageItem } from './types';
import type { SubmittedAnswer } from './questions/model';

export type ConversationEvent = {
  sequence: number;
  runId: string | null;
  kind: string;
  payload: Record<string, unknown>;
  createdAt: string;
};
export type StreamingOutline = {
  runId: string;
  messageId: string;
  itemId: string;
  markdown: string;
  document?: unknown;
};
export type ConversationState = {
  cursor: number;
  messages: MessageGroup[];
  answersByRequest: Record<string, SubmittedAnswer[]>;
  streamingOutline: StreamingOutline | null;
  activeRunId: string | null;
  snapshotKnown: boolean;
  completedRuns: Record<string, true>;
};

export const emptyConversation = (): ConversationState => ({
  cursor: 0, messages: [], answersByRequest: {}, streamingOutline: null, activeRunId: null, snapshotKnown: false, completedRuns: {},
});
const text = (value: unknown) => typeof value === 'string' ? value : '';
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const legacyActionInstructions = new Map<string, 'confirm' | 'retry'>([
  ['The user has explicitly confirmed this exact outline. Generate all slides from it.', 'confirm'],
  ['The user requested a retry. Continue from the committed project artifacts.', 'retry'],
]);

export function parseConversationEvent(value: unknown): ConversationEvent {
  if (!object(value) || !Number.isSafeInteger(value.sequence) || Number(value.sequence) <= 0
    || !(value.runId === null || typeof value.runId === 'string') || typeof value.kind !== 'string'
    || !object(value.payload) || typeof value.createdAt !== 'string') {
    throw new Error('Invalid conversation event');
  }
  return value as ConversationEvent;
}

function updateItem(state: ConversationState, groupId: string, itemId: string, update: (previous?: MessageItem) => MessageItem): ConversationState {
  const index = state.messages.findIndex(group => group.id === groupId);
  const group = index >= 0 ? state.messages[index] : { id: groupId, role: 'ai' as const, items: [] };
  const itemIndex = group.items.findIndex(item => item.id === itemId);
  const item = update(group.items[itemIndex]);
  const items = itemIndex >= 0 ? group.items.map((previous, i) => i === itemIndex ? item : previous) : [...group.items, item];
  const next = { ...group, items };
  return { ...state, messages: index >= 0 ? state.messages.map((previous, i) => i === index ? next : previous) : [...state.messages, next] };
}

function finishRun(state: ConversationState, runId: string, status: MessageItemStatus): ConversationState {
  return { ...state,
    activeRunId: !state.snapshotKnown && state.activeRunId === runId ? null : state.activeRunId,
    completedRuns: { ...state.completedRuns, [runId]: true },
    streamingOutline: state.streamingOutline?.runId === runId ? null : state.streamingOutline,
    messages: state.messages.map(group => group.id === runId ? { ...group, items: group.items.map(item => item.status === 'running'
      ? { ...item, status, ...(item.type === 'thinking' ? { labelKey: status === 'completed' ? 'thinkingCompleted' as const : 'thinkingInterrupted' as const } : {}) }
      : item) } : group),
  };
}

function markRunning(state: ConversationState, runId: string): ConversationState {
  return state.snapshotKnown || state.completedRuns[runId] ? state : { ...state, activeRunId: runId };
}

/** Sequence checks make reconnects, paging boundaries and explicit refresh safe to replay. */
export function projectConversationEvent(previous: ConversationState, event: ConversationEvent,
  labels: Record<'confirm' | 'retry' | 'cancel', string> = { confirm: 'Confirm the outline and generate slides.', retry: 'Retry generation.', cancel: 'Stop generation.' },
): ConversationState {
  if (event.sequence <= previous.cursor) return previous;
  let state = { ...previous, cursor: event.sequence };
  const p = event.payload;
  const runId = event.runId || text(p.messageId);
  const groupId = text(p.messageId) || runId;
  const itemId = text(p.itemId) || text(p.callId) || `${event.kind}-${event.sequence}`;
  const common = { id: itemId, entryId: itemId, sourceRole: 'assistant', createdAt: event.createdAt };

  if (event.kind === 'user_message' || event.kind === 'answers') {
    let content = text(p.content);
    if (event.kind === 'user_message' && p.action === 'continue') {
      const action = legacyActionInstructions.get(content);
      if (action) content = labels[action];
    }
    if (event.kind === 'answers' && text(p.requestId) && Array.isArray(p.answers)) {
      const answers = p.answers.filter((answer): answer is SubmittedAnswer => object(answer) && typeof answer.id === 'string' && typeof answer.answer === 'string');
      state = { ...state, answersByRequest: { ...state.answersByRequest, [text(p.requestId)]: answers } };
      if (!content) {
        const questions = Array.isArray(p.questions) ? p.questions : [];
        content = answers.map(answer => {
          const question = questions.find(value => object(value) && value.id === answer.id);
          return `${object(question) ? text(question.question) || answer.id : answer.id}\n${answer.answer}`;
        }).join('\n\n');
      }
    }
    if (!content && (p.action === 'confirm' || p.action === 'retry' || p.action === 'cancel')) content = labels[p.action];
    const id = `user-${event.sequence}`;
    const attachments: AttachmentMessageItem[] = [];
    if (Array.isArray(p.attachments)) {
      const seen = new Set<string>();
      for (const attachment of p.attachments) {
        if (!object(attachment) || typeof attachment.uploadId !== 'string' || !attachment.uploadId
          || seen.has(attachment.uploadId) || typeof attachment.originalName !== 'string'
          || !['document', 'image', 'audio', 'video'].includes(text(attachment.pipeline))
          || !Number.isSafeInteger(attachment.sizeBytes) || Number(attachment.sizeBytes) < 0) continue;
        seen.add(attachment.uploadId);
        const attachmentId = `${id}-attachment-${attachment.uploadId}`;
        attachments.push({ ...common, id: attachmentId, entryId: attachmentId, sourceRole: 'user',
          type: 'attachment', status: 'completed', uploadId: attachment.uploadId,
          originalName: attachment.originalName, pipeline: attachment.pipeline as AttachmentMessageItem['pipeline'],
          mimeType: text(attachment.mimeType), sizeBytes: Number(attachment.sizeBytes) });
      }
    }
    if (!content && !attachments.length) return state;
    const userItems: MessageItem[] = content ? [{ ...common, id, entryId: id, sourceRole: 'user', type: 'text', content, status: 'completed' }] : [];
    const message: MessageGroup = { id, role: 'user', items: [...userItems, ...attachments] };
    const tail = state.messages.at(-1);
    // A queued-run snapshot can arrive just before its persisted user message.
    const messages = tail?.role === 'ai' && tail.items.length === 0
      ? [...state.messages.slice(0, -1), message, tail] : [...state.messages, message];
    return { ...state, messages };
  }
  if (event.kind === 'run_completed' || event.kind === 'run_waiting' || event.kind === 'run_failed' || event.kind === 'run_cancelled') {
    const status = event.kind === 'run_failed' ? 'failed' : event.kind === 'run_cancelled' ? 'cancelled' : 'completed';
    state = finishRun(state, runId, status);
    const content = text(p.message);
    if (status !== 'completed' && content) {
      return updateItem(state, runId, `terminal-${event.sequence}`, () => ({ ...common, id: `terminal-${event.sequence}`, type: 'thinking',
        label: content, ...(status === 'cancelled' ? { labelKey: 'conversationInterrupted' as const } : {}), content, status }));
    }
    return state;
  }
  if (!groupId) return state;
  if (event.kind === 'progress' && p.phase === 'image') {
    state = markRunning(state, runId);
    return updateItem(state, groupId, itemId, old => ({ ...common, ...old, type: 'agent_activity',
      activityKey: 'generatingImages', status: p.status === 'completed' || state.completedRuns[runId] ? 'completed' : 'running' }));
  }
  if (event.kind === 'assistant_delta' || event.kind === 'reasoning_delta') {
    const kind = event.kind === 'assistant_delta' ? 'text' : 'thinking';
    state = markRunning(state, runId);
    return updateItem(state, groupId, itemId, old => ({ ...common,
      ...(old?.type === kind ? old : {}), type: kind, status: 'running',
      content: `${old?.type === kind ? old.content : ''}${text(p.delta)}`,
      ...(kind === 'thinking' ? { label: 'Thinking', labelKey: 'thinking' } : {}),
    } as TextMessageItem | ThinkingMessageItem));
  }
  if (event.kind === 'tool_identity') {
    const previousId = text(p.previousItemId);
    if (!previousId) return state;
    return { ...state, messages: state.messages.map(group => {
      if (group.id !== groupId) return group;
      const before = group.items.find(item => item.id === previousId);
      if (before?.type !== 'tool') return group;
      const found = group.items.find(item => item.id === itemId);
      const target = found?.type === 'tool' ? found : undefined;
      const tool = { ...before, ...target };
      const name = text(p.name) || tool.toolName || '';
      const next: ToolMessageItem = { ...tool, id: itemId, entryId: itemId, toolName: name, label: name,
        tools: { ...(object(before.tools) ? before.tools : {}), ...(object(target?.tools) ? target.tools : {}),
          function_name: name, tool_call_id: text(p.callId) || itemId } };
      return { ...group, items: group.items.flatMap(item => item.id === previousId ? [next] : item.id === itemId ? [] : [item]) };
    }) };
  }
  if (event.kind === 'tool_start' || event.kind === 'tool_arguments_delta' || event.kind === 'tool_result') {
    state = markRunning(state, runId);
    return updateItem(state, groupId, itemId, old => {
      const previousTool = old?.type === 'tool' ? old : undefined;
      const tools = object(previousTool?.tools) ? previousTool.tools : {};
      const name = text(p.name) || previousTool?.toolName || '';
      const argumentsText = event.kind === 'tool_arguments_delta'
        ? `${text(tools.argumentsText)}${text(p.delta)}` : text(tools.argumentsText);
      const finished = event.kind === 'tool_result';
      let result = finished ? p.result : tools.result;
      // Legacy and live tools can omit the host-owned questionnaire id. The owning
      // assistant group (not a later run replaying its receipt) is its stable identity.
      if (name === 'AskQuestions' && object(result) && Array.isArray(result.questions) && !text(result.requestId)) {
        result = { ...result, requestId: groupId };
      }
      let args = p.arguments ?? tools.arguments;
      if (finished && args === undefined && argumentsText) {
        try { args = JSON.parse(argumentsText); } catch { args = argumentsText; }
      }
      const detail = finished ? JSON.stringify({ ...(args !== undefined ? { arguments: args } : {}), result }, null, 2) : argumentsText;
      return { ...common, ...previousTool, type: 'tool', toolName: name, label: name,
        status: finished ? p.status === 'failed' ? 'failed' : 'completed' : 'running',
        toolExpandable: true, detail,
        tools: { ...tools, function_name: name, tool_call_id: p.callId ?? tools.tool_call_id,
          ...(args !== undefined ? { arguments: args } : {}), ...(result !== undefined ? { result } : {}), argumentsText },
      } satisfies ToolMessageItem;
    });
  }
  if (event.kind === 'outline_draft') {
    if (state.completedRuns[runId] || (state.snapshotKnown && state.activeRunId !== runId)) return state;
    return { ...markRunning(state, runId), streamingOutline: { runId, messageId: groupId, itemId,
      markdown: text(p.markdown), ...(p.document !== undefined ? { document: p.document } : {}) } };
  }
  if (event.kind === 'assistant_done') {
    const reasoningId = itemId.endsWith(':text') ? `${itemId.slice(0, -5)}:reasoning` : null;
    return { ...state, messages: state.messages.map(group => group.id === groupId ? { ...group,
      items: group.items.map(item => (item.id === itemId || item.id === reasoningId) && item.status === 'running'
        ? { ...item, status: 'completed', ...(item.type === 'thinking' ? { labelKey: 'thinkingCompleted' as const } : {}) } : item),
    } : group) };
  }
  return state;
}

export function projectConversationSnapshot(state: ConversationState, snapshot: ProjectSnapshot): ConversationState {
  const run = snapshot.run;
  if (!run) return { ...state, snapshotKnown: true, activeRunId: null };
  if (run.status === 'queued' || run.status === 'running') {
    const messages = state.messages.some(group => group.id === run.id) ? state.messages : [...state.messages, { id: run.id, role: 'ai' as const, items: [] }];
    return { ...state, messages, snapshotKnown: true, activeRunId: run.id };
  }
  return { ...finishRun(state, run.id, run.status === 'failed' || run.status === 'interrupted' ? 'failed' : run.status === 'cancelled' ? 'cancelled' : 'completed'), snapshotKnown: true, activeRunId: null };
}
