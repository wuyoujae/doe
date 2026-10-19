import '../../../../doe-component/src/shared/chart/tooltip/popup/style/index.css';
import { t } from "../../../../doe-component/src/shared/editor/i18n/index.ts";
import './index.css';
import '../source-editors/index.css';
import "../../ui/controls/style/index.css";
import "../../ui/secondary-button/style/index.css";
import type { ContentEditRequest, ContentEditorDefinition } from "../../../../doe-component/src/shared/editor/types/index.ts";
import { ContentPreview } from '../preview/index.ts';

export function createContentSheetShell(placement?: 'right'): HTMLDialogElement {
  const dialog = document.createElement('dialog'); dialog.className = 'chart-content-sheet';
  if (placement === 'right') dialog.classList.add('content-side-sheet');
  dialog.setAttribute('aria-labelledby', 'chart-content-title');
  dialog.innerHTML = '<header class="chart-content-header"><div><h2 id="chart-content-title"></h2><p></p></div><button type="button" data-close>×</button></header>';
  dialog.querySelector('[data-close]')!.setAttribute('aria-label', t('sheet.close'));
  return dialog;
}

export function openContentSheet(request: ContentEditRequest, definition: ContentEditorDefinition, onClose?: () => void): () => void {
  const dialog = createContentSheetShell(definition.placement);
  dialog.dataset.editorType = request.type;
  dialog.insertAdjacentHTML('beforeend', `<div class="chart-content-body"><div class="chart-content-form-pane"></div><section class="chart-content-preview-pane"><div class="chart-content-preview-heading"><h3></h3><span role="status"></span></div><div class="chart-content-preview"></div><p></p></section></div>
    <footer class="chart-content-footer"><p role="alert"></p><div><button type="button" data-cancel></button><button type="button" data-apply></button></div></footer>`);
  dialog.querySelector('h2')!.textContent = t('sheet.title');
  dialog.querySelector('[data-close]')!.setAttribute('aria-label', t('sheet.close'));
  dialog.querySelector('h3')!.textContent = t('sheet.preview');
  dialog.querySelector('.chart-content-preview-pane')!.setAttribute('aria-label', t('sheet.preview'));
  dialog.querySelector('[role="status"]')!.textContent = t('sheet.preparing');
  dialog.querySelector('.chart-content-preview-pane > p')!.textContent = t('sheet.previewHint');
  dialog.querySelector('[data-cancel]')!.textContent = t('sheet.cancel');
  dialog.querySelector('[data-apply]')!.textContent = t('sheet.apply');
  dialog.querySelector('header p')!.textContent = definition.label;
  if (['media', 'image-text'].includes(request.type)) {
    dialog.querySelector('h2')!.textContent = definition.label;
    (dialog.querySelector('header p') as HTMLElement).hidden = true;
  }
  if (definition.readOnly) (dialog.querySelector('header p') as HTMLElement).hidden = true;
  const theme = request.element.ownerDocument.defaultView!.getComputedStyle(request.element);
  for (let i = 0; i < 5; i++) dialog.style.setProperty(`--chart-series-${i}`, theme.getPropertyValue(`--yrkie-color-chart-${i + 1}`));
  const error = dialog.querySelector<HTMLElement>('[role="alert"]')!;
  const status = dialog.querySelector<HTMLElement>('[role="status"]')!;
  const apply = dialog.querySelector<HTMLButtonElement>('[data-apply]')!;
  if (definition.readOnly) {
    apply.hidden = true;
    dialog.querySelector('h2')!.textContent = definition.label;
    dialog.querySelector('[data-cancel]')!.textContent = t('sheet.close');
  }
  if (['code-block', 'math-formula', 'media', 'image-text'].includes(request.type)) {
    dialog.querySelector('.chart-content-preview-pane > p')!.textContent = t('source.previewHint');
  }
  const form = definition.createForm(request.props, refresh);
  if (form.element.classList.contains('doe-project-image-form')) {
    dialog.classList.add('doe-project-image-sheet');
    apply.classList.add('ui-primary-button');
    dialog.querySelector('[data-cancel]')!.classList.add('ui-secondary-button');
  }
  dialog.querySelector('.chart-content-form-pane')!.append(form.element);
  document.body.append(dialog); dialog.showModal();
  const previewContainer = dialog.querySelector<HTMLElement>('.chart-content-preview')!;
  const preview = definition.createPreview?.(previewContainer, request.element) ?? new ContentPreview(previewContainer, request.element, definition.renderer, request.type);
  let pending = false;
  let closed = false;
  let revision = 0;
  let timer = 0;
  let previewRevision = -1;
  function refresh() {
    const current = ++revision;
    const draft = form.read();
    apply.disabled = true; error.textContent = draft.error || '';
    status.textContent = draft.error ? t('sheet.completeData') : t('sheet.updating');
    clearTimeout(timer);
    if (!draft.props) return;
    timer = window.setTimeout(() => {
      void preview.render(draft.props).then(rendered => {
        if (closed || revision !== current || !rendered) return;
        previewRevision = current; status.textContent = t('sheet.updated'); apply.disabled = pending;
      }, reason => {
        if (closed || revision !== current) return;
        error.textContent = reason instanceof Error ? reason.message : t('sheet.previewFailed'); status.textContent = t('sheet.incomplete');
      });
    }, 120);
  }
  function close() {
    if (pending || closed) return;
    closed = true; clearTimeout(timer); preview.dispose(); form.dispose?.(); dialog.close(); dialog.remove();
    const shell = request.element.closest<HTMLElement>('[data-block-id]');
    const blockId = shell?.dataset.blockId;
    const selected = [...request.element.ownerDocument.querySelectorAll<HTMLElement>('[data-block-id]')].find(el => el.dataset.blockId === blockId);
    if (blockId) selected?.querySelector<HTMLButtonElement>('.block-handle')?.focus({ preventScroll: true });
    else if (request.element.isConnected) request.element.focus({ preventScroll: true });
    onClose?.();
  }
  async function save() {
    if (definition.readOnly || pending || apply.disabled || previewRevision !== revision) return;
    const draft = form.read();
    if (!draft.props) { error.textContent = draft.error; form.element.reportValidity(); return; }
    pending = true; apply.disabled = true; apply.textContent = t('sheet.applying');
    dialog.setAttribute('aria-busy', 'true');
    form.element.inert = true;
    try { await request.apply(draft.props); pending = false; close(); }
    catch (reason) { error.textContent = reason instanceof Error ? reason.message : t('sheet.saveFailed'); }
    finally {
      pending = false; form.element.inert = false; apply.disabled = false; apply.textContent = t('sheet.apply'); dialog.removeAttribute('aria-busy');
    }
  }
  apply.addEventListener('click', () => void save());
  form.element.addEventListener('submit', event => { event.preventDefault(); void save(); });
  dialog.querySelector('[data-close]')!.addEventListener('click', close);
  dialog.querySelector('[data-cancel]')!.addEventListener('click', close);
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  refresh();
  return () => { pending = false; close(); };
}
