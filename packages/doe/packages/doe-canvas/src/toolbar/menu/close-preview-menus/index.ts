import { TOOLBAR_LAYER_CLASS } from "../../constants/index.ts";
import { closeMenu } from "../close-menu/index.ts";

export function closePreviewMenus(documentTarget: Document, except?: HTMLElement) {
  documentTarget
    .querySelectorAll<HTMLElement>(
      `.${TOOLBAR_LAYER_CLASS} .doe-toolbar-preview__menu[data-open="true"]`,
    )
    .forEach((menu) => {
      if (menu !== except) closeMenu(menu);
    });
}
