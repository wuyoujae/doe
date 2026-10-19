// Origin: public/yrkie-doe/layout-engine/text-fields.js:6
import { scope as __doeScope } from "../runtime/context/index.js";

export function write(props, path, value) {
    const keys = (0, __doeScope.pathOf)(path);
    let parent = props;
    for (const key of keys.slice(0, -1)) {
      if (["__proto__", "prototype", "constructor"].includes(String(key))) return false;
      if (!parent[key] || typeof parent[key] !== "object") parent[key] = {};
      parent = parent[key];
    }
    const key = keys.at(-1);
    if (["__proto__", "prototype", "constructor"].includes(String(key))) return false;
    parent[key] = value;
    return true;
  }
