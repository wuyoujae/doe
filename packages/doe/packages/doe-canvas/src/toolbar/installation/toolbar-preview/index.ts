import type { ToolbarPreviewController } from "../../contracts/index.ts";
import { installToolbar } from "../toolbar/index.ts";
import type { ToolbarLocale } from "../../locale/index.ts";

export function installToolbarPreview(
  frame: HTMLIFrameElement,
  locale: ToolbarLocale,
): ToolbarPreviewController | null {
  return installToolbar(frame, true, locale);
}
