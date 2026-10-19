import { bindContentsModel, candidates, CONTENTS_TYPE, currentChoice, extract, findNode, replace, replaceInSchema, type Choice, type RecordValue } from '../model/index.ts';
import { ReplacementLayoutCheck } from '../preview/index.ts';
import stylesUrl from '../styles/index.css?no-inline&url';
import { t } from "../../../../../shared/editor/i18n/index.ts";
import { replacementFitIssue } from '../../model/replacement-fit/index.js';

type Request = { anchor: HTMLElement; nodeId: string; result?: RecordValue; options: RecordValue; resolvedColumns?(): number | undefined; snapshot(): Promise<RecordValue>; prepare?(next: RecordValue, expected: RecordValue): RecordValue; apply(next: RecordValue, expected: RecordValue): Promise<void>; subscribe(callback: () => void): () => void };

export function installContentsReplacement(frame: HTMLIFrameElement): () => void {
  const runtime = frame.contentWindow as unknown as RecordValue;
  if (!runtime?.DOEContentsModel) return () => {};
  bindContentsModel(runtime.DOEContentsModel);
  const doc = frame.contentDocument!;
  const style = doc.createElement('link'); style.dataset.studioContents = 'true'; style.rel = 'stylesheet'; style.href = stylesUrl; doc.head.append(style);
  const hostStyle = frame.ownerDocument.createElement('link'); hostStyle.rel = 'stylesheet'; hostStyle.href = stylesUrl; frame.ownerDocument.head.append(hostStyle);
  let close: (() => void) | undefined; let activeAnchor: HTMLElement | undefined;
  let history: RecordValue | undefined;
  let historyFocused = false;
  const undo = frame.ownerDocument.createElement('button'), redo = frame.ownerDocument.createElement('button');
  undo.type = redo.type = 'button'; undo.textContent = t('replacement.undo'); redo.textContent = t('replacement.redo'); undo.disabled = redo.disabled = true;
  undo.className = redo.className = 'studio-icon-button';
  frame.ownerDocument.querySelector('.studio-workspace__status')?.append(undo, redo);
  if (!undo.isConnected) frame.ownerDocument.getElementById('toolbar-preview-button')?.before(undo, redo);
  const inlineHistory = undo.isConnected;
  const refreshHistory = () => { undo.disabled = !history?.contentsHistory?.undo; redo.disabled = !history?.contentsHistory?.redo; };
  const replay = async (forward: boolean) => {
    if (!history || (forward ? redo.disabled : undo.disabled)) return;
    const target = history;
    undo.disabled = redo.disabled = true;
    try { await (forward ? target.redoContentsReplacement() : target.undoContentsReplacement()); }
    finally { refreshHistory(); }
  };
  undo.addEventListener('click', () => void replay(false)); redo.addEventListener('click', () => void replay(true));
  const keyboard = (event: KeyboardEvent) => {
    if (!(event.ctrlKey || event.metaKey) || !['z', 'y'].includes(event.key.toLowerCase()) || doc.querySelector('dialog[open]') || frame.ownerDocument.querySelector('dialog[open], .contents-replacement-menu')) return;
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, select, [contenteditable]')) return;
    const forward = event.key.toLowerCase() === 'y' || event.shiftKey;
    if (forward ? redo.disabled : undo.disabled) return;
    event.preventDefault(); void replay(forward);
  };
  doc.addEventListener('keydown', keyboard); frame.ownerDocument.addEventListener('keydown', keyboard);
  const bridge = {
    focusHistory(result: RecordValue | null) { historyFocused = true; history = result ?? undefined; refreshHistory(); },
    updateHistory(result: RecordValue) { if (historyFocused && result !== history) return; history = result; refreshHistory(); },
    supports: (node: RecordValue) => node.type === CONTENTS_TYPE || (node.type === 'layout-group'
      ? node.layout?.variant === 'columns' || extract(node) !== null : currentChoice(node) !== undefined),
    canApply(node: RecordValue, next: RecordValue, resolvedColumns?: number) {
      try { return JSON.stringify(replace(node, next.props?.presentation, resolvedColumns)) === JSON.stringify(next); } catch { return false; }
    },
    open(request: Request) { const same = Boolean(close && activeAnchor === request.anchor); close?.(); if (same) return; if (request.result) { history = request.result; refreshHistory(); } activeAnchor = request.anchor; close = openMenu(frame, request, () => { close = undefined; activeAnchor = undefined; }, inlineHistory ? [] : [undo, redo]); },
  };
  runtime.DOEContentsReplacement = bridge;
  return () => { close?.(); style.remove(); hostStyle.remove(); undo.remove(); redo.remove(); doc.removeEventListener('keydown', keyboard); frame.ownerDocument.removeEventListener('keydown', keyboard); if (runtime.DOEContentsReplacement === bridge) delete runtime.DOEContentsReplacement; };
}

function openMenu(frame: HTMLIFrameElement, request: Request, onClose: () => void, historyButtons: HTMLButtonElement[]): () => void {
  const doc = frame.ownerDocument, sourceDocument = frame.contentDocument!;
  const menu = doc.createElement('div'); menu.className = 'contents-replacement-menu'; menu.popover = 'manual';
  menu.setAttribute('aria-label', t('replacement.title'));
  menu.innerHTML = '<div class="contents-replacement-options" role="menu"></div><p role="status" aria-live="polite"></p>';
  const options = menu.querySelector<HTMLElement>('[role="menu"]')!;
  const status = menu.querySelector<HTMLElement>('[role="status"]')!;
  options.setAttribute('aria-label', t('replacement.title')); status.textContent = t('replacement.loading');
  if (historyButtons.length) {
    const actions = doc.createElement('div'); actions.className = 'contents-replacement-history';
    actions.append(...historyButtons); menu.append(actions);
  }
  const measure = new ReplacementLayoutCheck(sourceDocument);
  let closed = false, pending = false, revision = 0;
  const message = (reason: unknown) => {
    const value = reason instanceof Error ? reason.message : '';
    if (value.includes('空间不足')) return t('errors.layoutOverflow');
    if (value.includes('变化')) return t('errors.componentChanged');
    return t('replacement.failed');
  };
  const focusItems = () => [...options.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
  function position() {
    if (closed) return;
    if (!request.anchor.isConnected) { dispose(false); return; }
    const f = frame.getBoundingClientRect(), a = request.anchor.getBoundingClientRect();
    const sx = f.width / (frame.offsetWidth || f.width), sy = f.height / (frame.offsetHeight || f.height);
    const x = f.left + (frame.clientLeft + a.left) * sx;
    const top = f.top + (frame.clientTop + a.top) * sy, bottom = f.top + (frame.clientTop + a.bottom) * sy;
    const width = doc.documentElement.clientWidth, height = doc.documentElement.clientHeight;
    const box = menu.getBoundingClientRect(), gap = 6, edge = 8;
    const y = bottom + gap + box.height <= height - edge ? bottom + gap : top - gap - box.height;
    menu.style.left = `${Math.max(edge, Math.min(x, width - box.width - edge))}px`;
    menu.style.top = `${Math.max(edge, Math.min(y, height - box.height - edge))}px`;
  }
  function dispose(restoreFocus = true) {
    if (closed) return;
    closed = true; revision++; unsubscribe(); measure.dispose(); observer.disconnect();
    doc.removeEventListener('pointerdown', outside, true); sourceDocument.removeEventListener('pointerdown', outside, true);
    doc.removeEventListener('keydown', escape); sourceDocument.removeEventListener('keydown', escape);
    doc.defaultView?.removeEventListener('resize', position); sourceDocument.defaultView?.removeEventListener('resize', position);
    doc.removeEventListener('scroll', position, true); sourceDocument.removeEventListener('scroll', position, true);
    request.anchor.setAttribute('aria-expanded', 'false'); menu.hidePopover(); menu.remove(); onClose();
    if (restoreFocus && request.anchor.isConnected) request.anchor.focus({ preventScroll: true });
  }
  function outside(event: Event) { const target = event.target as Node; if (!menu.contains(target) && !request.anchor.contains(target)) dispose(false); }
  function escape(event: KeyboardEvent) { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); dispose(); } }
  async function choose(choice: Choice) {
    if (pending || closed) return;
    pending = true; options.setAttribute('aria-busy', 'true'); focusItems().forEach(button => { button.disabled = true; });
    status.textContent = t('replacement.checking'); status.setAttribute('role', 'status');
    try {
      const snapshot = await request.snapshot();
      if (closed) return;
      const source = findNode(snapshot.slide.blocks, request.nodeId);
      if (!source) throw new Error('组件已变化，请重新打开菜单。');
      const next = replace(source, choice.id, request.resolvedColumns?.());
      const draft = request.prepare ? request.prepare(next, snapshot) : replaceInSchema(snapshot, request.nodeId, next);
      draft.slide.layout.autoRepair = false;
      const result = await measure.mount(draft, { ...request.options, mode: "static", editable: false });
      if (closed) return;
      const issue = replacementFitIssue(result.report, request.nodeId, snapshot.slide.layout.compression);
      if (issue) { status.textContent = t(issue.key, issue.values); status.setAttribute('role', 'alert'); return; }
      await request.apply(next, snapshot);
      if (!closed) dispose();
    } catch (reason) {
      if (!closed) { status.textContent = message(reason); status.setAttribute('role', 'alert'); }
    } finally {
      pending = false; options.removeAttribute('aria-busy');
      if (!closed) { options.querySelectorAll<HTMLButtonElement>('button').forEach(button => { button.disabled = false; }); position(); }
    }
  }
  async function refresh() {
    const version = ++revision;
    try {
      const snapshot = await request.snapshot();
      if (closed || version !== revision) return;
      const source = findNode(snapshot.slide.blocks, request.nodeId);
      if (!source) { dispose(false); return; }
      const available = candidates(extract(source)), current = currentChoice(source);
      options.replaceChildren();
      status.textContent = available.some(choice => choice.id !== current) ? '' : t('replacement.empty');
      for (const group of [...new Set(available.map(choice => choice.group))]) {
        const title = doc.createElement('div'); title.className = 'contents-replacement-group'; title.textContent = t(`replacement.groups.${{ '卡片': 'cards', '列表': 'lists', '图形': 'shapes' }[group]}`); title.setAttribute('role', 'presentation'); options.append(title);
        for (const choice of available.filter(entry => entry.group === group)) {
          const button = doc.createElement('button'); button.type = 'button'; button.setAttribute('role', 'menuitemradio'); button.setAttribute('aria-checked', String(choice.id === current));
          button.textContent = t(`replacement.names.${choice.id.replace(/[:-]/g, '_')}`); button.tabIndex = -1; button.dataset.choice = choice.id;
          button.addEventListener('click', () => { if (choice.id === current && !(choice.id === 'metrics' && source.type !== CONTENTS_TYPE)) dispose(); else void choose(choice); }); options.append(button);
        }
      }
      position(); (options.querySelector<HTMLButtonElement>('[aria-checked="true"]') || focusItems()[0])?.focus();
    } catch (reason) { if (!closed && version === revision) { status.textContent = message(reason); status.setAttribute('role', 'alert'); } }
  }
  menu.addEventListener('keydown', event => {
    if (event.key === 'Tab') { dispose(false); return; }
    const items = focusItems(), index = items.indexOf(doc.activeElement as HTMLButtonElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : event.key === 'ArrowDown' ? (index + 1) % items.length : event.key === 'ArrowUp' ? (index - 1 + items.length) % items.length : -1;
    if (next >= 0) { event.preventDefault(); items[next]?.focus(); }
  });
  const unsubscribe = request.subscribe(() => { if (!pending) void refresh(); });
  const observer = new ResizeObserver(position); observer.observe(menu);
  request.anchor.setAttribute('aria-haspopup', 'menu'); request.anchor.setAttribute('aria-expanded', 'true');
  doc.body.append(menu); menu.showPopover(); position();
  doc.addEventListener('pointerdown', outside, true); sourceDocument.addEventListener('pointerdown', outside, true);
  doc.addEventListener('keydown', escape); sourceDocument.addEventListener('keydown', escape);
  doc.defaultView?.addEventListener('resize', position); sourceDocument.defaultView?.addEventListener('resize', position);
  doc.addEventListener('scroll', position, true); sourceDocument.addEventListener('scroll', position, true);
  void refresh(); return dispose;
}
