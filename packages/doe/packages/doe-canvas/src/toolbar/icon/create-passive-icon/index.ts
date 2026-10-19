import { createIcon } from "../create-icon/index.ts";

export function createPassiveIcon(
  documentTarget: Document,
  label: string,
  iconName: string,
): HTMLElement {
  const hint = documentTarget.createElement('span');
  hint.className = 'doe-toolbar-preview__passive doe-toolbar-preview__passive--icon-only';
  hint.setAttribute('aria-label', label);
  hint.title = label;
  const icon = createIcon(documentTarget, iconName, 'doe-toolbar-preview__icon');
  if (icon) {
    hint.append(icon);
  } else {
    hint.classList.remove('doe-toolbar-preview__passive--icon-only');
    hint.textContent = label;
  }
  return hint;
}
