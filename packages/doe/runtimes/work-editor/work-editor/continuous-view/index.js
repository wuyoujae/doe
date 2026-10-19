import { scope } from '../../../../integrations/work/editor/runtime/context/index.js';
import { slideMountOptions } from '../slide-mount-options/index.js';
import { sameContent } from '../same-content/index.js';
import { trackMediaSettlement } from '../track-media-settlement/index.js';
import { publishLayoutDiagnostic } from '../publish-layout-diagnostic/index.js';
import { reconcileFilmstrip } from '../reconcile-filmstrip/index.js';
import { updateNavigation } from '../update-navigation/index.js';
import { cancelComponentInsertion } from '../insert-component/index.js';
import { post } from '../post/index.js';

let view = null;
let modeVersion = 0;
const activeId = () => scope.state.slides[scope.state.activeIndex]?.id;
const mountKey = index => JSON.stringify([scope.state.theme, slideMountOptions(index), Boolean(scope.state.generation), Boolean(scope.state.hostReadOnly)]);
export const hasIndependentCanvases = () => Boolean(view);

function bindActive() {
  const record = view?.records.get(activeId());
  if (!record) return;
  Object.assign(scope.elements, { frame: record.frame, scale: record.scale, canvas: record.canvas, loading: record.loading });
  scope.state.activeResult = record.result;
  scope.state.activeResultRevision = record.result ? scope.state.formalDeckRevision : 0;
  scope.state.activeRendering = Boolean(record.pending);
  // A toolbar focus change never cancels another page's render or mutation queue.
  scope.state.activeMountAbortController = null;
  scope.global.DOEContentsReplacement?.focusHistory(record.result);
}

function syncVisibility() {
  if (!view) return;
  for (const record of view.records.values()) {
    const index = scope.state.slides.findIndex(slide => slide.id === record.slideId);
    record.frame.style.order = String(index);
    record.frame.hidden = scope.state.viewMode !== 'continuous' && record.slideId !== activeId();
    record.frame.inert = Boolean(scope.state.generation || scope.state.hostReadOnly || record.pending || !record.result);
    record.frame.setAttribute('aria-current', record.slideId === activeId() ? 'page' : 'false');
    record.frame.setAttribute('aria-label', `${scope.state.viewLabels?.page || 'Slide'} ${index + 1}`);
    record.frame.resize();
  }
}

function revealActive() {
  if (!view || scope.state.viewMode !== 'continuous') return;
  const frame = view.records.get(activeId())?.frame;
  if (!frame) return;
  const rect = frame.getBoundingClientRect(), stage = view.stage.getBoundingClientRect();
  const rem = parseFloat(scope.global.getComputedStyle(view.stage).fontSize);
  view.stage.scrollTo({ top: view.stage.scrollTop + rect.top - stage.top - 5 * rem, behavior: 'instant' });
}

export function focusContinuousSlide(index, { reveal = false } = {}) {
  if (!view || !scope.state.slides[index]) return false;
  const changed = view.focusedId !== scope.state.slides[index].id;
  if (changed) cancelComponentInsertion();
  scope.state.activeIndex = index;
  view.focusedId = activeId();
  if (scope.state.generation && changed) scope.state.generation.followNewest = false;
  bindActive(); syncVisibility();
  reconcileContinuousView();
  if (changed) {
    reconcileFilmstrip({ revealContinuous: false });
    post('active-slide-change', { index, total: scope.state.slides.length });
  }
  if (reveal) revealActive();
  return true;
}

function makeRecord(slideId, elements) {
  const frame = elements?.frame || document.createElement('doe-canvas');
  if (!elements) {
    frame.className = 'work-editor__canvas-frame';
    const scale = document.createElement('div');
    scale.className = 'work-editor__canvas-scale'; scale.setAttribute('data-canvas-scale', '');
    const canvas = document.createElement('div');
    canvas.className = 'work-editor__canvas'; canvas.setAttribute('data-canvas-mount', '');
    scale.append(canvas);
    const loading = scope.elements.loading.cloneNode(true);
    loading.removeAttribute('id'); loading.hidden = false;
    frame.append(scale, loading);
    view.stage.append(frame);
    elements = { frame, scale, canvas, loading };
  }
  frame.classList.add('work-editor__continuous-page');
  frame.dataset.slideId = slideId;
  return { frame: elements.frame, scale: elements.scale, canvas: elements.canvas, loading: elements.loading,
    slideId, result: null, source: null, key: null, epoch: 0, pending: null, controller: null };
}

function ensureView() {
  if (view) return;
  const stage = scope.elements.frame.parentElement;
  view = { stage, records: new Map(), focusedId: activeId(), paused: false };
  const record = makeRecord(activeId(), scope.elements);
  record.result = scope.state.activeResult;
  record.source = record.result?.slide || scope.state.slides[scope.state.activeIndex];
  record.key = mountKey(scope.state.activeIndex);
  view.records.set(record.slideId, record);
  view.focus = event => {
    if (scope.state.generation) return;
    const frame = event.target.closest?.('.work-editor__continuous-page');
    if (!frame || frame.parentElement !== stage) return;
    const index = scope.state.slides.findIndex(slide => slide.id === frame.dataset.slideId);
    if (index >= 0 && frame.dataset.slideId !== view?.focusedId) focusContinuousSlide(index);
  };
  stage.addEventListener('pointerdown', view.focus, true);
  stage.addEventListener('focusin', view.focus, true);
  stage.addEventListener('doe:canvas-focus', view.focus);
  // The original frame can be hidden in single-page view; observe the stable stage.
  scope.resizeObserver?.unobserve(scope.elements.frame);
  scope.resizeObserver?.observe(stage);
  bindActive();
}

function releaseRecord(record) {
  record.epoch += 1;
  record.controller?.abort();
  record.controller = null; record.pending = null; record.result = null; record.key = null;
  record.frame.dispose();
}

export function releaseContinuousResult(result = scope.state.activeResult) {
  if (!view) return false;
  const record = view.records.get(result?.slide?.id || activeId());
  if (record && (!result || record.result === result)) releaseRecord(record);
  bindActive();
  return true;
}

export function invalidateAllSlideEditors() {
  if (!view) return;
  for (const record of view.records.values()) releaseRecord(record);
  bindActive();
}

export function isCurrentSlideResult(result) {
  if (!result || !scope.state.slides.some(slide => slide.id === result.slide?.id)) return false;
  return view ? view.records.get(result.slide.id)?.result === result : result === scope.state.activeResult;
}

export function acceptSlideResult(result) {
  if (!isCurrentSlideResult(result)) return -1;
  if (view) view.records.get(result.slide.id).source = result.slide;
  return scope.state.slides.findIndex(slide => slide.id === result.slide.id);
}

export async function flushSlideEditors() {
  const results = view ? [...view.records.values()].map(record => record.result).filter(Boolean) : [scope.state.activeResult].filter(Boolean);
  await Promise.all(results.map(async result => {
    await result.flushPendingEdits?.();
    const index = acceptSlideResult(result);
    if (index >= 0) scope.state.slides[index] = result.slide;
  }));
}

function mountRecord(record, index, source, key) {
  releaseRecord(record);
  const owner = view, epoch = record.epoch;
  const controller = new AbortController();
  record.controller = controller; record.source = source; record.key = key;
  record.loading.hidden = false;
  const current = () => view === owner && owner.records.get(record.slideId) === record && record.epoch === epoch && !controller.signal.aborted;
  const settlement = trackMediaSettlement(record.canvas, controller.signal);
  const pending = (async () => {
    try {
      const result = await record.frame.mount({ version: 4, slide: source }, {
        ...slideMountOptions(index), theme: scope.state.theme, mode: scope.state.hostReadOnly ? 'present' : 'editable', signal: controller.signal,
      });
      if (!current()) { result.dispose(); return false; }
      record.result = result; record.source = result.slide;
      const position = scope.state.slides.findIndex(slide => slide.id === record.slideId);
      if (position < 0) return false;
      scope.state.slides[position] = result.slide;
      bindActive();
      const settled = scope.state.generation ? false : await settlement.wait(result);
      if (!current()) return false;
      if (settled) publishLayoutDiagnostic(result, position);
      record.loading.hidden = true;
      return true;
    } catch (error) {
      if (!current() || error?.name === 'AbortError') return false;
      record.result = null; record.frame.dispose();
      record.key = null;
      record.loading.hidden = false;
      record.loading.textContent = error?.message || '幻灯片渲染失败';
      post('error', { message: record.loading.textContent });
      return false;
    } finally {
      settlement.dispose();
      if (current()) {
        record.pending = null; record.controller = null;
        bindActive(); syncVisibility(); updateNavigation();
        scope.state.thumbnailCoordinator?.resume();
      }
    }
  })();
  record.pending = pending;
  return pending;
}

export function reconcileContinuousView({ reveal = false } = {}) {
  if (!view) return;
  const ids = new Set(scope.state.slides.map(slide => slide.id));
  for (const [id, record] of view.records) {
    if (ids.has(id)) continue;
    releaseRecord(record); record.frame.remove(); view.records.delete(id);
  }
  scope.state.slides.forEach(source => {
    let record = view.records.get(source.id);
    if (!record) { record = makeRecord(source.id); view.records.set(source.id, record); }
  });
  syncVisibility();
  scope.state.slides.forEach((source, index) => {
    const record = view.records.get(source.id);
    const key = mountKey(index);
    const changed = record.key !== key || !sameContent(record.source, source);
    // Hidden single-page frames cannot be measured. Keep their live state until
    // visible, then reconcile changed content/settings against real geometry.
    if (record.frame.hidden) {
      if (record.pending || (record.result && changed)) releaseRecord(record);
      return;
    }
    if (!view.paused && scope.state.hostVisible !== false
      && changed) mountRecord(record, index, source, key);
  });
  const changed = view.focusedId !== activeId();
  view.focusedId = activeId();
  bindActive(); syncVisibility();
  if (changed && reveal) revealActive();
}

export async function renderContinuousSlides() {
  reconcileContinuousView();
  if (!view || view.paused || scope.state.hostVisible === false) return false;
  const owner = view;
  const results = await Promise.all([...owner.records.values()].filter(record => !record.frame.hidden)
    .map(record => record.pending || Boolean(record.result)));
  if (view !== owner) return false;
  scope.state.pendingDeckRender = false;
  updateNavigation();
  post('active-slide-change', { index: scope.state.activeIndex, total: scope.state.slides.length });
  return results.every(Boolean);
}

export function resizeContinuousCanvases() {
  if (!view) return false;
  syncVisibility();
  return view.stage.clientWidth > 1 && view.stage.clientHeight > 1;
}

export function pauseContinuousView() {
  if (!view) return;
  syncVisibility();
  if (scope.state.hostVisible !== false && document.visibilityState !== 'hidden') return;
  view.paused = true;
  for (const record of view.records.values()) if (record.pending) releaseRecord(record);
  bindActive();
}

export function resumeContinuousView() {
  if (!view || scope.state.hostVisible === false || document.visibilityState === 'hidden') return;
  view.paused = false;
  reconcileContinuousView();
}

export function disposeContinuousView() {
  if (!view) return;
  const owner = view; view = null;
  owner.stage.removeEventListener('pointerdown', owner.focus, true);
  owner.stage.removeEventListener('focusin', owner.focus, true);
  owner.stage.removeEventListener('doe:canvas-focus', owner.focus);
  for (const record of owner.records.values()) releaseRecord(record);
  scope.global.DOEContentsReplacement?.focusHistory(null);
  scope.state.activeResult = null;
}

export async function setViewMode(mode, labels) {
  if (scope.runtimeSurface !== 'work' || !['single', 'continuous'].includes(mode)
    || !scope.state.formalDeckLoaded || !scope.state.activeResult || scope.state.generation
    || (!view && scope.state.activeRendering)) return;
  if (labels && typeof labels === 'object') scope.state.viewLabels = Object.fromEntries(Object.entries(labels).filter(([, value]) => typeof value === 'string' && value.length < 1000));
  const version = ++modeVersion, slides = scope.state.slides;
  if (mode === 'single' && view) {
    try { await flushSlideEditors(); }
    catch (error) { post('error', { message: error?.message || String(error) }); return; }
    if (version !== modeVersion || slides !== scope.state.slides || scope.state.generation || !view) return;
  }
  if (mode === 'continuous') ensureView();
  scope.state.viewMode = mode;
  document.documentElement.dataset.canvasView = mode;
  reconcileContinuousView(); revealActive();
  scope.elements.frame.resize();
  post('view-mode-change', { mode });
}
