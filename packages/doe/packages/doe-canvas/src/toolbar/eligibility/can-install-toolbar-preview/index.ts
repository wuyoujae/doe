import { isLoopbackHostname } from "../is-loopback-hostname/index.ts";
import { WORK_EDITOR_PATH } from "../../constants/index.ts";

export function canInstallToolbarPreview(
  hostHostname: string,
  hostOrigin: string,
  frameHref: string,
): boolean {
  if (!isLoopbackHostname(hostHostname)) return false;
  try {
    const url = new URL(frameHref);
    return url.origin === hostOrigin
      && url.pathname === WORK_EDITOR_PATH
      && Boolean(url.searchParams.get('studio-session'));
  } catch {
    return false;
  }
}
