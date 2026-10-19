import { createIcon } from "../create-icon/index.ts";

export function createIdentity(
  documentTarget: Document,
  label: string,
  iconName: string,
): HTMLElement {
  const identity = documentTarget.createElement('span');
  identity.className = 'doe-toolbar-preview__identity doe-toolbar-preview__identity--icon-only';
  identity.setAttribute('aria-label', label);
  identity.title = label;
  const icon = createIcon(documentTarget, iconName, 'doe-toolbar-preview__icon');
  if (icon) {
    identity.append(icon);
  } else {
    identity.classList.remove('doe-toolbar-preview__identity--icon-only');
    const labelElement = documentTarget.createElement('strong');
    labelElement.textContent = label;
    identity.append(labelElement);
  }
  return identity;
}
