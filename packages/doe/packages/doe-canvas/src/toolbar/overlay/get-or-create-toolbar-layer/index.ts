import { TOOLBAR_LAYER_CLASS } from "../../constants/index.ts";
import { TOOLBAR_PREVIEW_VERSION } from "../../constants/index.ts";

export function getOrCreateToolbarLayer(documentTarget: Document): HTMLElement {
  const existing = documentTarget.querySelector<HTMLElement>(`.${TOOLBAR_LAYER_CLASS}`);
  if (existing) return existing;
  const layer = documentTarget.createElement('div');
  layer.className = TOOLBAR_LAYER_CLASS;
  layer.dataset.doeToolbarPreviewLayer = TOOLBAR_PREVIEW_VERSION;
  documentTarget.body.append(layer);
  return layer;
}
