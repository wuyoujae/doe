import { createContentSheetShell } from '../../../packages/doe-canvas/src/panel/sheet/index.ts';
import './index.css';

type SettingsRequest = {
  element: HTMLElement; title: string; closeLabel: string;
  onClose(): void; onReady(): void; onEscape(): void;
};
type SettingsBridge = { open(request: SettingsRequest): void; close(): void };

/** Keep the live controls/transactions, with isolated Canvas styles inside the shared host sheet. */
export function installWorkSettingsSheet(sourceFrame: HTMLIFrameElement): () => void {
  const runtime = sourceFrame.contentWindow as (Window & { DOEWorkSettings?: SettingsBridge }) | null;
  if (!runtime || runtime.location.origin !== location.origin) return () => {};
  let current: { request: SettingsRequest; dialog: HTMLDialogElement; frame: HTMLIFrameElement; restore(): void } | null = null;
  const bridge: SettingsBridge = {
    open(request) {
      if (current) {
        current.dialog.querySelector('h2')!.textContent = request.title;
        current.dialog.querySelector('[data-close]')!.setAttribute('aria-label', request.closeLabel);
        current.frame.title = request.title;
        current.request = request;
        return;
      }
      const sourceDocument = request.element.ownerDocument;
      const home = request.element.parentNode!;
      const next = request.element.nextSibling;
      const dialog = createContentSheetShell('right');
      dialog.classList.add('doe-work-settings-sheet');
      dialog.querySelector('h2')!.id = 'doe-work-settings-title';
      dialog.setAttribute('aria-labelledby', 'doe-work-settings-title');
      dialog.querySelector('h2')!.textContent = request.title;
      dialog.querySelector('header p')!.setAttribute('hidden', '');
      dialog.querySelector('[data-close]')!.setAttribute('aria-label', request.closeLabel);
      const frame = document.createElement('iframe');
      frame.className = 'doe-work-settings-frame';
      frame.title = request.title;
      frame.setAttribute('sandbox', 'allow-same-origin');
      const head = document.createElement('head');
      for (const source of sourceDocument.querySelectorAll<HTMLLinkElement>('head link[rel="stylesheet"]')) {
        const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = source.href; head.append(link);
      }
      const html = document.createElement('html');
      html.lang = sourceDocument.documentElement.lang;
      html.dataset.runtimeSurface = 'work'; html.dataset.settingsHost = 'true';
      html.append(head);
      const body = document.createElement('body');
      const wrapper = document.createElement('main'); wrapper.className = 'work-editor'; body.append(wrapper); html.append(body);
      frame.srcdoc = '<!doctype html>' + html.outerHTML;
      const close = () => { const callback = current?.request.onClose; bridge.close(); callback?.(); };
      current = { request, dialog, frame, restore: () => home.insertBefore(request.element, next?.parentNode === home ? next : null) };
      frame.onload = () => {
        if (current?.frame !== frame) return;
        const doc = frame.contentDocument!;
        doc.querySelector('main')!.append(request.element);
        doc.addEventListener('keydown', event => {
          if (event.key === 'Escape') { event.preventDefault(); current?.request.onEscape(); }
        });
        current.request.onReady();
      };
      dialog.append(frame);
      dialog.querySelector('[data-close]')!.addEventListener('click', close);
      dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
      dialog.addEventListener('click', event => {
        const bounds = dialog.getBoundingClientRect();
        if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) close();
      });
      document.body.append(dialog); dialog.showModal();
    },
    close() {
      if (!current) return;
      const sheet = current; current = null;
      sheet.restore(); sheet.dialog.close(); sheet.dialog.remove();
    },
  };
  runtime.DOEWorkSettings = bridge;
  return () => {
    // Disposal is not a user close: the source iframe may already be detached.
    bridge.close();
    if (runtime.DOEWorkSettings === bridge) delete runtime.DOEWorkSettings;
  };
}
