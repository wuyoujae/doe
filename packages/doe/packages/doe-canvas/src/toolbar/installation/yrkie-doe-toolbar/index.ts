import type { YrkieDoeToolbarController } from "../../contracts/index.ts";
import { installToolbar } from "../toolbar/index.ts";
import type { ToolbarLocale } from "../../locale/index.ts";

export function installYrkieDoeToolbar(
  frame: HTMLIFrameElement,
  locale: ToolbarLocale,
): YrkieDoeToolbarController | null {
  return installToolbar(frame, false, locale);
}
