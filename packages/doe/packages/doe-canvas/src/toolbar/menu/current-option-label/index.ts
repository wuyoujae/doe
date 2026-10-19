import { text } from "../../dom/text/index.ts";

export function currentOptionLabel(buttons: HTMLButtonElement[]): string {
  return text(buttons.find((button) => button.getAttribute('aria-pressed') === 'true'))
    || text(buttons[0])
    || '选择';
}
