import test from 'node:test';
import assert from 'node:assert/strict';
import { audienceShow, navigate, pageMotion, timeline } from '../../../../packages/doe/packages/doe-document/src/document/presentation/live/presentation-model/index.ts';
import { applyPlaybackEvent } from '../../../../packages/doe/packages/doe-document/src/document/presentation/live/live-state/index.ts';

test('original audience projection retains visible content and removes nested speaker notes', () => {
  const show = audienceShow({ logo: { enabled: true }, pageNumber: { enabled: true }, deck: { theme: 'paper', slides: [
    { id: 'one', notes: 'private', blocks: [{ id: 'text', props: { text: 'Public', speakerNotes: 'private nested' } }] },
  ] } }, { one: { ...pageMotion(), notes: 'private motion' } });
  assert.equal(show.slides[0].blocks[0].props.text, 'Public');
  assert.equal(show.slides[0].editor, false);
  assert.equal(show.logo.enabled, true);
  assert.equal(JSON.stringify(show).includes('private'), false);
});

test('original navigation follows click groups and reconstructs previous slides without replay', () => {
  const cues = [
    { id: 'a', target: 'text', effect: 'fade', trigger: 'click', duration: 480, delay: 0 },
    { id: 'b', target: 'text', effect: 'pulse', trigger: 'after', duration: 240, delay: 20 },
  ];
  assert.deepEqual(timeline(cues).map(c => [c.group, c.start, c.end]), [[1, 0, 480], [1, 500, 740]]);
  const show = { slides: [{ id: 'one' }, { id: 'two' }], motion: [{ cues, transition: 'fade' }, { cues: [], transition: 'fade' }] };
  const initial = { index: 0, step: 0, at: 0, revision: 0, black: false };
  const animated = navigate(show, initial, 1, 100);
  assert.equal(animated.step, 1); assert.equal(animated.index, 0);
  const second = navigate(show, animated, 1, 200);
  assert.equal(second.index, 1); assert.equal(second.step, 0);
  const previous = navigate(show, second, -1, 300);
  assert.equal(previous.index, 0); assert.equal(previous.step, 1); assert.equal(previous.at, 0);
});

test('original live protocol requires exact sequences and clears one page generation atomically', () => {
  const state = { epoch: 'stage', seq: 1, index: 0, step: 0, at: 0, black: false, revision: 0, startedAt: 0,
    ink: { a: { id: 'a', index: 0 }, b: { id: 'b', index: 1 } }, generations: {} };
  assert.equal(applyPlaybackEvent(state, { kind: 'next', epoch: 'other', seq: 2 }), null);
  assert.equal(applyPlaybackEvent(state, { kind: 'next', epoch: 'stage', seq: 3 }), null);
  assert.equal(applyPlaybackEvent(state, { kind: 'next', epoch: 'stage', seq: 1 }), state);
  const cleared = applyPlaybackEvent(state, { kind: 'clear', epoch: 'stage', seq: 2, index: 0, generation: 1 });
  assert.deepEqual(Object.keys(cleared.ink), ['b']); assert.equal(cleared.generations['0'], 1);
});
