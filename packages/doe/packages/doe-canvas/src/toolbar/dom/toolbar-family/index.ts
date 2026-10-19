import type { ToolbarFamily } from "../../contracts/index.ts";

export function toolbarFamily(toolbar: HTMLElement): ToolbarFamily | null {
  if (toolbar.classList.contains('block-toolbar--content')) return 'content';
  if (toolbar.classList.contains('text-edit-toolbar')) return 'text';
  if (toolbar.classList.contains('block-toolbar--component')) return 'media';
  if (toolbar.classList.contains('block-toolbar--items')) return 'items';
  const shell = toolbar.parentElement;
  if (shell?.dataset.edgeSplitRoot === 'true') return 'edge-media';
  if (shell?.dataset.compositionGroup === 'true') return 'composition';
  return 'layout';
}
