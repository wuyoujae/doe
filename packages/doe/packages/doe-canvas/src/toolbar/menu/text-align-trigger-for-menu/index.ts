

export function textAlignTriggerForMenu(menu: HTMLElement): HTMLButtonElement | null {
  if (!menu.id) return null;
  return [...menu.ownerDocument.querySelectorAll<HTMLButtonElement>(
    '.text-edit-toolbar__align-trigger[aria-controls]',
  )].find((trigger) => trigger.getAttribute('aria-controls') === menu.id) ?? null;
}
