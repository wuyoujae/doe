import { createIcon } from "../create-icon/index.ts";
import { text } from "../../dom/text/index.ts";

export function addActionIcon(
  documentTarget: Document,
  button: HTMLButtonElement,
  iconName: string,
  injectedNodes: Element[],
  cleanupCallbacks: Array<() => void>,
) {
  button.classList.add('doe-toolbar-preview__action');
  const icon = createIcon(documentTarget, iconName, 'doe-toolbar-preview__icon');
  if (!icon) return;
  const label = text(button);
  const originalAriaLabel = button.getAttribute('aria-label');
  const originalTitle = button.getAttribute('title');
  button.classList.add('doe-toolbar-preview__action--icon-only');
  button.setAttribute('aria-label', originalAriaLabel ?? label);
  button.title = originalTitle ?? label;
  icon.setAttribute('data-doe-toolbar-preview-icon', 'true');
  button.prepend(icon);
  injectedNodes.push(icon);
  cleanupCallbacks.push(() => {
    button.classList.remove('doe-toolbar-preview__action--icon-only');
    if (originalAriaLabel === null) button.removeAttribute('aria-label');
    else button.setAttribute('aria-label', originalAriaLabel);
    if (originalTitle === null) button.removeAttribute('title');
    else button.setAttribute('title', originalTitle);
  });
}
