import { t } from "../../../packages/doe-component/src/shared/editor/i18n/index.ts";
import type { UnknownRecord } from "../../../packages/doe-component/src/shared/editor/types/index.ts";

/** Image-only preview, independent of the Canvas crop and component geometry. */
export function createProjectImagePreview(container: HTMLElement, source: HTMLElement) {
  let revision = 0;
  let disposed = false;
  const original = source.querySelector('img');
  container.classList.add('doe-image-preview');
  return {
    async render(props: UnknownRecord) {
      const current = ++revision;
      if (props.src === '') {
        container.replaceChildren();
        container.style.removeProperty('--doe-image-preview-ratio');
        return false;
      }
      const image = new Image();
      image.alt = original?.alt || '';
      image.src = typeof props.src === 'string' ? props.src : original?.currentSrc || original?.src || '';
      try { await image.decode(); } catch { throw new Error(t('images.imageFailed')); }
      if (disposed || current !== revision) return false;
      container.style.setProperty('--doe-image-preview-ratio', String(image.naturalWidth / image.naturalHeight));
      container.replaceChildren(image);
      return true;
    },
    dispose() { disposed = true; revision++; container.replaceChildren(); },
  };
}
