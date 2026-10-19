

export function closeMenu(menuRoot: HTMLElement) {
  const trigger = menuRoot.querySelector<HTMLButtonElement>('.doe-toolbar-preview__trigger');
  const popover = menuRoot.querySelector<HTMLElement>('.doe-toolbar-preview__popover');
  if (!trigger || !popover) return;
  trigger.setAttribute('aria-expanded', 'false');
  menuRoot.dataset.open = 'false';
  popover.hidden = true;
}
