import { currentOptionLabel } from "../current-option-label/index.ts";
import { createIcon } from "../../icon/create-icon/index.ts";
import { nextMenuSequence } from "../sequence/index.ts";
import { closeAllMenus } from "../close-all-menus/index.ts";
import { positionPopover } from "../../position/popover/index.ts";
import { closeMenu } from "../close-menu/index.ts";

export function createMenu(
  documentTarget: Document,
  label: string,
  buttons: HTMLButtonElement[],
  iconName: string,
  layout: string,
  cleanupCallbacks: Array<() => void>,
  valueLabels: Record<string, string> = {},
): HTMLElement {
  const menuRoot = documentTarget.createElement('span');
  menuRoot.className = 'doe-toolbar-preview__menu';
  menuRoot.dataset.open = 'false';

  const trigger = documentTarget.createElement('button');
  trigger.type = 'button';
  trigger.className = 'doe-toolbar-preview__trigger';
  const currentLabel = currentOptionLabel(buttons);
  trigger.setAttribute('aria-label', `${label}：${currentLabel}`);
  trigger.title = `${label}：${currentLabel}`;
  trigger.setAttribute('aria-haspopup', 'menu');
  trigger.setAttribute('aria-expanded', 'false');
  const icon = createIcon(documentTarget, iconName, 'doe-toolbar-preview__icon');
  if (icon) trigger.append(icon);
  const value = documentTarget.createElement('strong');
  value.className = 'doe-toolbar-preview__trigger-value';
  value.textContent = valueLabels[currentLabel] ?? currentLabel;
  trigger.append(value);
  const chevron = createIcon(documentTarget, 'ChevronDown', 'doe-toolbar-preview__chevron');
  if (chevron) trigger.append(chevron);

  const popover = documentTarget.createElement('span');
  popover.className = 'doe-toolbar-preview__popover';
  popover.id = `doe-toolbar-preview-menu-${nextMenuSequence()}`;
  popover.dataset.layout = layout;
  popover.setAttribute('role', 'menu');
  popover.setAttribute('aria-label', label);
  popover.hidden = true;
  trigger.setAttribute('aria-controls', popover.id);
  const options = documentTarget.createElement('span');
  options.className = 'doe-toolbar-preview__options';
  const originalMenuAttributes = buttons.map((button) => ({
    button,
    role: button.getAttribute('role'),
    checked: button.getAttribute('aria-checked'),
    pressed: button.getAttribute('aria-pressed'),
  }));
  buttons.forEach((button) => {
    button.setAttribute('role', 'menuitemradio');
    button.setAttribute('aria-checked', String(button.getAttribute('aria-pressed') === 'true'));
    button.removeAttribute('aria-pressed');
    options.append(button);
  });
  cleanupCallbacks.push(() => {
    originalMenuAttributes.forEach(({ button, role, checked, pressed }) => {
      if (role === null) button.removeAttribute('role');
      else button.setAttribute('role', role);
      if (checked === null) button.removeAttribute('aria-checked');
      else button.setAttribute('aria-checked', checked);
      if (pressed === null) button.removeAttribute('aria-pressed');
      else button.setAttribute('aria-pressed', pressed);
    });
  });
  popover.append(options);

  const openForKeyboard = (last = false) => {
    closeAllMenus(documentTarget, menuRoot);
    popover.hidden = false;
    menuRoot.dataset.open = 'true';
    trigger.setAttribute('aria-expanded', 'true');
    documentTarget.defaultView?.requestAnimationFrame(() => {
      positionPopover(menuRoot);
      (last ? buttons.at(-1) : buttons[0])?.focus();
    });
  };
  const handleTrigger = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    if (popover.hidden) openForKeyboard();
    else closeMenu(menuRoot);
  };
  const handleMenuKeydown = (event: KeyboardEvent) => {
    if (event.target === trigger && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      openForKeyboard(event.key === 'ArrowUp');
      return;
    }
    const optionIndex = buttons.indexOf(event.target as HTMLButtonElement);
    if (optionIndex < 0) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeMenu(menuRoot);
      trigger.focus();
      return;
    }
    const navigationKeys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'];
    if (!navigationKeys.includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? buttons.length - 1
        : ['ArrowDown', 'ArrowRight'].includes(event.key)
          ? (optionIndex + 1) % buttons.length
          : (optionIndex - 1 + buttons.length) % buttons.length;
    buttons[nextIndex]?.focus();
  };
  trigger.addEventListener('click', handleTrigger);
  menuRoot.addEventListener('keydown', handleMenuKeydown);
  cleanupCallbacks.push(() => {
    trigger.removeEventListener('click', handleTrigger);
    menuRoot.removeEventListener('keydown', handleMenuKeydown);
  });
  menuRoot.append(trigger, popover);
  return menuRoot;
}
