import { closePreviewMenus } from "../close-preview-menus/index.ts";
import { TOOLBAR_LAYER_CLASS } from "../../constants/index.ts";
import { closeTextAlignMenu } from "../close-text-align-menu/index.ts";

export function closeAllMenus(documentTarget: Document, except?: HTMLElement) {
  closePreviewMenus(documentTarget, except);
  documentTarget
    .querySelectorAll<HTMLElement>(
      `.${TOOLBAR_LAYER_CLASS} > .doe-toolbar-preview__text-align-menu:not([hidden])`,
    )
    .forEach((menu) => closeTextAlignMenu(menu));
}
