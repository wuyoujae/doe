import { textAlignTriggerForMenu } from "../text-align-trigger-for-menu/index.ts";

export function closeTextAlignMenu(menu: HTMLElement, restoreFocus = false) {
  const trigger = textAlignTriggerForMenu(menu);
  menu.hidden = true;
  trigger?.setAttribute('aria-expanded', 'false');
  if (restoreFocus) trigger?.focus();
}
