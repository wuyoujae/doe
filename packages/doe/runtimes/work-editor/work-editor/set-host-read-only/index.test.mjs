// Run: node --experimental-vm-modules --test packages/doe/runtimes/work-editor/work-editor/set-host-read-only/index.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SourceTextModule, SyntheticModule } from 'node:vm';

test('host exclusion is immediate, flushes pending edits, and never waits for image rendering', async () => {
  let finishFlush;
  const pendingFlush = new Promise(resolve => { finishFlush = resolve; });
  const calls = [];
  const canvas = { inert: false };
  const scope = {
    state: { hostReadOnly: false, hostReadOnlyTransition: null, formalDeckLoaded: true, generation: null },
    elements: { add: { disabled: false }, settingsTrigger: { disabled: false } },
    global: { document: { documentElement: { dataset: {} }, querySelectorAll: () => [canvas] } },
  };
  const exports = {
    scope,
    flushSlideEditors: async () => { calls.push('flush'); await pendingFlush; calls.push('flushed'); },
    invalidateAllSlideEditors: () => calls.push('invalidate'),
    hasIndependentCanvases: () => false,
    releaseActiveResult: () => calls.push('release'),
    renderDeck: () => { calls.push('render'); return new Promise(() => {}); },
    setSettingsOpen: () => calls.push('close-settings'),
    cancelComponentInsertion: () => calls.push('cancel-insertion'),
    updateNavigation: () => {},
  };
  const source = new SourceTextModule(await readFile(new URL('./index.js', import.meta.url), 'utf8'));
  await source.link(() => new SyntheticModule(Object.keys(exports), function () {
    for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
  }));
  await source.evaluate();
  source.namespace.setHostReadOnly(true);
  assert.equal(scope.state.hostReadOnly, true);
  assert.equal(scope.state.generation, null);
  assert.equal(canvas.inert, true);
  assert.equal(scope.elements.add.disabled, true);
  assert.deepEqual(calls, ['close-settings', 'cancel-insertion']);
  await Promise.resolve();
  assert.equal(calls.at(-1), 'flush');
  finishFlush();
  await scope.state.hostReadOnlyTransition;
  assert.deepEqual(calls.slice(-4), ['flushed', 'invalidate', 'release', 'render']);
  source.namespace.setHostReadOnly(false);
  await scope.state.hostReadOnlyTransition;
  assert.equal(scope.elements.add.disabled, false);
  assert.equal(scope.state.hostReadOnly, false);
});
