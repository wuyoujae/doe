// Origin: public/yrkie-doe/layout-engine/layout-engine.js:285
import { scope as __doeScope } from "../../runtime/context/index.js";

export function normalizeTypographySizeMode(value, warnings) {
    if (value === undefined || value === null || value === "") return "default";
    if (__doeScope.TYPOGRAPHY_SIZE_MODE_SET.has(value)) return value;
    warnings?.push(
      `typography.sizeMode '${value}' 无效，已回退为 'default'。`,
    );
    return "default";
  }
