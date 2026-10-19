import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

// Pure projection tests require no browser, provider request, or runtime database.
const source = await readFile(new URL('./projector.ts', import.meta.url), 'utf8');
const compiled = ts.transpile(source, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext });
const { emptyConversation, projectConversationEvent: apply, projectConversationSnapshot: snapshot } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const event = (sequence, kind, payload = {}, runId = 'run-a') => ({ sequence, kind, payload, runId, createdAt: '2026-10-19T12:00:00Z' });

test('durable history preserves text, calls, answered questions and duplicate replay', () => {
  let state = emptyConversation();
  const events = [
    event(1, 'user_message', { content: 'Make an astronomy presentation' }, null),
    event(2, 'assistant_delta', { messageId: 'run-a', itemId: 'text-1', delta: 'First ' }),
    event(3, 'assistant_delta', { messageId: 'run-a', itemId: 'text-1', delta: 'answer' }),
    event(4, 'tool_start', { messageId: 'run-a', itemId: 'call-1', callId: 'c1', name: 'AskQuestions' }),
    event(5, 'tool_result', { messageId: 'run-a', itemId: 'call-1', callId: 'c1', name: 'AskQuestions', result: { status: 'awaiting_user', questions: [{ id: 'style', question: 'Style?', options: ['A', 'B'] }] }, status: 'completed' }),
    event(6, 'run_waiting'),
    event(7, 'answers', { requestId: 'run-a', questions: [{ id: 'style', question: 'Style?' }], answers: [{ id: 'style', answer: 'A\nMy note' }], content: '' }, null),
  ];
  for (const item of events) state = apply(state, item);
  assert.equal(state.messages.length, 3);
  assert.equal(state.messages[1].items[0].content, 'First answer');
  assert.equal(state.messages[1].items[1].tools.result.questions[0].question, 'Style?');
  assert.equal(state.messages[1].items[1].tools.result.requestId, 'run-a');
  assert.equal(state.answersByRequest['run-a'][0].answer, 'A\nMy note');
  assert.equal(state.messages[2].items[0].content, 'Style?\nA\nMy note');
  assert.equal(state.activeRunId, null);
  assert.strictEqual(apply(state, events.at(-1)), state);
  state = apply(state, event(8, 'user_message', { action: 'confirm', content: '' }, null));
  assert.equal(state.messages.at(-1).items[0].content, 'Confirm the outline and generate slides.');
});

test('late terminal receipts do not restart a stopped run or stop a newer run', () => {
  let state = apply(emptyConversation(), event(1, 'tool_start', { messageId: 'run-a', itemId: 'call-1', name: 'CreateOutline' }));
  state = apply(state, event(2, 'run_completed'));
  state = apply(state, event(3, 'tool_result', { messageId: 'run-a', itemId: 'call-1', name: 'CreateOutline', result: { success: true }, status: 'completed' }));
  assert.equal(state.activeRunId, null);
  state = snapshot(state, { run: { id: 'run-b', status: 'running' } });
  state = apply(state, event(4, 'run_failed', { message: 'Old failure' }));
  state = apply(state, event(5, 'assistant_done', { messageId: 'run-a', itemId: 'text-1' }));
  assert.equal(state.activeRunId, 'run-b');
  state = apply(state, event(6, 'run_completed', {}, 'run-b'));
  assert.equal(state.activeRunId, 'run-b', 'current snapshot owns activity until its next update');
  state = snapshot(state, { run: { id: 'run-b', status: 'completed' } });
  assert.equal(state.activeRunId, null);
});

test('completed tools retain the arguments delivered in streaming fragments', () => {
  let state = apply(emptyConversation(), event(1, 'tool_start', { messageId: 'run-a', itemId: 'call-1', name: 'ReadSlide' }));
  state = apply(state, event(2, 'tool_arguments_delta', { messageId: 'run-a', itemId: 'call-1', delta: '{"slideId":' }));
  state = apply(state, event(3, 'tool_arguments_delta', { messageId: 'run-a', itemId: 'call-1', delta: '"slide-1"}' }));
  state = apply(state, event(4, 'tool_result', { messageId: 'run-a', itemId: 'call-1', name: 'ReadSlide', result: { status: 'ok' }, status: 'completed' }));
  const tool = state.messages[0].items[0];
  assert.deepEqual(tool.tools.arguments, { slideId: 'slide-1' });
  assert.deepEqual(JSON.parse(tool.detail), { arguments: { slideId: 'slide-1' }, result: { status: 'ok' } });
});

test('snapshot before user persistence retains original user/assistant order and finalizes drafts', () => {
  let state = snapshot(emptyConversation(), { run: { id: 'run-a', status: 'queued' } });
  state = apply(state, event(1, 'user_message', { content: 'A prompt' }, null));
  assert.deepEqual(state.messages.map(group => group.role), ['user', 'ai']);
  state = apply(state, event(2, 'outline_draft', { messageId: 'run-a', itemId: 'outline-1', markdown: '# page', document: { title: 'Draft', body: [] } }));
  assert.equal(state.streamingOutline.document.title, 'Draft');
  state = snapshot(state, { run: { id: 'run-a', status: 'completed' } });
  assert.equal(state.streamingOutline, null);
  state = apply(state, event(3, 'outline_draft', { messageId: 'run-a', itemId: 'outline-1', markdown: '# page\nlate' }));
  assert.equal(state.streamingOutline, null);
});

test('failure keeps its actual safe reason and only cancellation uses the interruption label', () => {
  const reason = 'The image provider rejected the API credential.';
  let state = apply(emptyConversation(), event(1, 'run_failed', { message: reason, errorCode: 'image_provider_auth' }));
  const failed = state.messages[0].items[0];
  assert.equal(failed.status, 'failed');
  assert.equal(failed.label, reason);
  assert.equal(failed.content, reason);
  assert.equal(failed.labelKey, undefined);
  state = apply(state, event(2, 'run_cancelled', { message: 'Generation stopped.' }, 'run-b'));
  assert.equal(state.messages[1].items[0].labelKey, 'conversationInterrupted');
});

test('only exact legacy host action instructions are shown as localized user actions', () => {
  const confirm = 'The user has explicitly confirmed this exact outline. Generate all slides from it.';
  const retry = 'The user requested a retry. Continue from the committed project artifacts.';
  const labels = { confirm: '确认并生成幻灯片', retry: '重试', cancel: '停止生成' };
  let state = apply(emptyConversation(), event(1, 'user_message', { action: 'continue', content: confirm }), labels);
  state = apply(state, event(2, 'user_message', { action: 'continue', content: retry }), labels);
  state = apply(state, event(3, 'user_message', { action: 'continue', content: `${confirm} My additional instruction.` }), labels);
  state = apply(state, event(4, 'user_message', { action: 'message', content: confirm }), labels);
  assert.deepEqual(state.messages.map(group => group.items[0].content), [labels.confirm, labels.retry, `${confirm} My additional instruction.`, confirm]);
});

test('persisted user attachments stay in the same group and replay without duplicate chips', () => {
  const upload = { uploadId: 'upload-one', originalName: 'Brief.pdf', pipeline: 'document', mimeType: 'application/pdf', sizeBytes: 1024 };
  const message = event(1, 'user_message', { content: 'Use this brief', attachments: [upload, upload, { ...upload, uploadId: 'invalid', sizeBytes: -1 }] }, null);
  let state = apply(emptyConversation(), message);
  assert.deepEqual(state.messages[0].items.map(item => item.type), ['text', 'attachment']);
  assert.equal(state.messages[0].items[1].originalName, 'Brief.pdf');
  assert.strictEqual(apply(state, message), state);
  state = apply(state, event(2, 'answers', { requestId: 'questions-a', answers: [], attachments: [{ ...upload, uploadId: 'upload-two' }] }, null));
  assert.equal(state.messages[1].items[0].type, 'attachment');
});

test('image progress updates the original activity item without creating repeated rows', () => {
  let state = apply(emptyConversation(), event(1, 'progress', { messageId: 'run-a', itemId: 'outline-image-1', phase: 'image', current: 1, total: 3, status: 'running' }));
  assert.equal(state.messages[0].items[0].type, 'agent_activity');
  assert.equal(state.messages[0].items[0].activityKey, 'generatingImages');
  state = apply(state, event(2, 'progress', { messageId: 'run-a', itemId: 'outline-image-1', phase: 'image', current: 1, total: 3, status: 'completed' }));
  assert.equal(state.messages[0].items.length, 1);
  assert.equal(state.messages[0].items[0].status, 'completed');
});

test('each completed assistant round finishes its own thinking without finishing pending tools or another round', () => {
  let state = apply(emptyConversation(), event(1, 'reasoning_delta', { messageId: 'run-a', itemId: 'run-a:0:reasoning', delta: 'Inspect the brief' }));
  state = apply(state, event(2, 'assistant_delta', { messageId: 'run-a', itemId: 'run-a:0:text', delta: 'I will inspect it.' }));
  state = apply(state, event(3, 'tool_start', { messageId: 'run-a', itemId: 'call-1', name: 'ReadSlide' }));
  state = apply(state, event(4, 'assistant_done', { messageId: 'run-a', itemId: 'run-a:0:text' }));
  state = apply(state, event(5, 'reasoning_delta', { messageId: 'run-a', itemId: 'run-a:1:reasoning', delta: 'Prepare the change' }));
  const items = new Map(state.messages[0].items.map(item => [item.id, item]));
  assert.equal(items.get('run-a:0:reasoning').status, 'completed');
  assert.equal(items.get('run-a:0:reasoning').labelKey, 'thinkingCompleted');
  assert.equal(items.get('run-a:0:text').status, 'completed');
  assert.equal(items.get('call-1').status, 'running');
  assert.equal(items.get('run-a:1:reasoning').status, 'running');
  assert.equal(state.activeRunId, 'run-a');
});

test('parallel streamed tools keep separate arguments while partial provider identities are completed', () => {
  let state = emptyConversation();
  const events = [
    event(1, 'tool_start', { itemId: 'run-a:0:tool:0', callId: 'call-', name: 'Read' }),
    event(2, 'tool_start', { itemId: 'run-a:0:tool:1', callId: 'call-', name: 'Read' }),
    event(3, 'tool_arguments_delta', { itemId: 'run-a:0:tool:0', delta: '{"slideId":"' }),
    event(4, 'tool_arguments_delta', { itemId: 'run-a:0:tool:1', delta: '{"slideId":"two"}' }),
    event(5, 'tool_identity', { previousItemId: 'run-a:0:tool:0', itemId: 'run-a:0:tool:0', callId: 'call-1', name: 'ReadSlide' }),
    event(6, 'tool_arguments_delta', { itemId: 'run-a:0:tool:0', delta: 'one"}' }),
    event(7, 'tool_identity', { previousItemId: 'run-a:0:tool:0', itemId: 'call-1', callId: 'call-1', name: 'ReadSlide' }),
    event(8, 'tool_identity', { previousItemId: 'run-a:0:tool:1', itemId: 'call-2', callId: 'call-2', name: 'ReadSlide' }),
    event(9, 'tool_result', { itemId: 'call-1', callId: 'call-1', name: 'ReadSlide', result: { status: 'ok' } }),
    event(10, 'tool_result', { itemId: 'call-2', callId: 'call-2', name: 'ReadSlide', result: { status: 'ok' } }),
  ];
  for (const current of events) state = apply(state, current);
  assert.deepEqual(state.messages[0].items.map(item => item.id), ['call-1', 'call-2']);
  assert.deepEqual(state.messages[0].items.map(item => item.tools.arguments), [{ slideId: 'one' }, { slideId: 'two' }]);
  assert.ok(state.messages[0].items.every(item => item.status === 'completed' && item.toolName === 'ReadSlide'));
  assert.strictEqual(apply(state, events.at(-1)), state);
});
