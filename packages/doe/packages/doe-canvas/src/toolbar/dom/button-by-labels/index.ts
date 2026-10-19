import { text } from "../text/index.ts";

export function buttonByLabels(buttons: HTMLButtonElement[], labels: string[]): HTMLButtonElement[] {
  const accepted = new Set(labels);
  return buttons.filter((button) => accepted.has(text(button)));
}
