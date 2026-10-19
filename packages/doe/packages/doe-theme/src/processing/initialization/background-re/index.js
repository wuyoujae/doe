// Origin: public/yrkie-doe/core/theme.js:110
import { scope as __doeScope } from "../../../runtime/context/index.js";

export function initialize() {
__doeScope.BACKGROUND_RE = /(background(?:-color)?\s*:\s*)(#[0-9a-f]{3,8})\b/gi;
}
