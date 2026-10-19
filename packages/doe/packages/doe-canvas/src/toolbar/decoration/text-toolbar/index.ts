import { closeTextAlignMenu } from "../../menu/close-text-align-menu/index.ts";
import { createMenu } from "../../menu/create-menu/index.ts";

export function decorateTextToolbar(
  toolbar: HTMLElement,
  cleanupCallbacks: Array<() => void>,
) {
  toolbar.querySelectorAll<HTMLElement>(':scope > .text-edit-toolbar__component-options').forEach(controls => {
    const original = [...controls.childNodes];
    let label = '';
    let buttons: HTMLButtonElement[] = [];
    const flush = () => {
      if (label && buttons.length) controls.append(createMenu(controls.ownerDocument, label, buttons, 'SlidersHorizontal', 'list', cleanupCallbacks));
      buttons = [];
    };
    controls.replaceChildren();
    original.forEach(node => {
      if (!(node instanceof controls.ownerDocument.defaultView!.Element)) return;
      if (node.classList.contains('block-toolbar__group-label')) {
        flush(); label = node.textContent?.trim() ?? '';
      } else if (node instanceof controls.ownerDocument.defaultView!.HTMLButtonElement) buttons.push(node);
    });
    flush();
    cleanupCallbacks.push(() => controls.replaceChildren(...original));
  });
  const trigger = toolbar.querySelector<HTMLButtonElement>(
    '.text-edit-toolbar__align-trigger[aria-controls]',
  );
  if (!trigger) return;
  const menuId = trigger.getAttribute('aria-controls');
  const menu = menuId ? toolbar.ownerDocument.getElementById(menuId) : null;
  if (!(menu instanceof toolbar.ownerDocument.defaultView!.HTMLElement)) return;
  const checkedOption = menu.querySelector<HTMLElement>('[role="menuitemradio"][aria-checked="true"]');
  const currentLabel = checkedOption?.getAttribute('aria-label')
    ?? checkedOption?.getAttribute('title')
    ?? '左对齐';
  const originalTriggerAriaLabel = trigger.getAttribute('aria-label');
  const originalTriggerTitle = trigger.getAttribute('title');
  const originalExpanded = trigger.getAttribute('aria-expanded');
  const originalMenuAriaLabel = menu.getAttribute('aria-label');
  const accessibleLabel = `对齐方向：${currentLabel}`;
  trigger.setAttribute('aria-label', accessibleLabel);
  trigger.title = accessibleLabel;
  // i18n-ignore: Legacy source label; localizeToolbar translates the assembled UI.
  menu.setAttribute('aria-label', '对齐方向');
  const options = [...menu.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')];
  const handleMenuKeydown = (event: KeyboardEvent) => {
    const optionIndex = options.indexOf(event.target as HTMLButtonElement);
    if (optionIndex < 0) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeTextAlignMenu(menu, true);
      return;
    }
    const navigationKeys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'];
    if (!navigationKeys.includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? options.length - 1
        : ['ArrowDown', 'ArrowRight'].includes(event.key)
          ? (optionIndex + 1) % options.length
          : (optionIndex - 1 + options.length) % options.length;
    options[nextIndex]?.focus();
  };
  menu.addEventListener('keydown', handleMenuKeydown);
  cleanupCallbacks.push(() => {
    menu.removeEventListener('keydown', handleMenuKeydown);
    if (originalTriggerAriaLabel === null) trigger.removeAttribute('aria-label');
    else trigger.setAttribute('aria-label', originalTriggerAriaLabel);
    if (originalTriggerTitle === null) trigger.removeAttribute('title');
    else trigger.setAttribute('title', originalTriggerTitle);
    if (originalExpanded === null) trigger.removeAttribute('aria-expanded');
    else trigger.setAttribute('aria-expanded', originalExpanded);
    if (originalMenuAriaLabel === null) menu.removeAttribute('aria-label');
    else menu.setAttribute('aria-label', originalMenuAriaLabel);
  });
}
