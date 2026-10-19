import { WORK_EDITOR_PATH } from "../../constants/index.ts";

export function canInstallYrkieDoeToolbar(
  hostOrigin: string,
  frameHref: string,
): boolean {
  try {
    const url = new URL(frameHref);
    return url.origin === hostOrigin && url.pathname === WORK_EDITOR_PATH;
  } catch {
    return false;
  }
}
