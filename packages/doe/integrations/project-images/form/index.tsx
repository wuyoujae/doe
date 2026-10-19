import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { appI18n } from '@yrkie/application/i18n/i18n.ts';
import { ImagePicker } from '../ImagePicker/index.tsx';
import { imagePath, ratioValue } from '../service/index.ts';
import type { ContentForm, UnknownRecord } from "../../../packages/doe-component/src/shared/editor/types/index.ts";

export function createProjectImageForm(base: UnknownRecord, onChange: () => void, sessionId: string): ContentForm {
  const draft = structuredClone(base);
  const element = document.createElement('form'); element.className = 'doe-project-image-form';
  const root = createRoot(element);
  let disposed = false;
  function render() {
    if (disposed) return;
    root.render(<I18nextProvider i18n={appI18n}><ImagePicker key={sessionId} sessionId={sessionId} selected={draft.src || ''} initialRatio={ratioValue(String(base.aspectRatio || base.imageAspectRatio || '1:1'))} onSelect={image => {
      if (disposed) return;
      draft.src = imagePath(sessionId, image.assetId);
      render(); onChange();
    }} /></I18nextProvider>);
  }
  render();
  return { element, read: () => ({ props: structuredClone(draft) }), dispose: () => {
    if (disposed) return;
    disposed = true;
    // A host React cleanup can run during commit; unmount this independent root afterwards.
    queueMicrotask(() => root.unmount());
  } };
}
