import { valueAtPath as __doeFn_valueAtPath } from "../value-at-path/index.js";
// Origin: public/yrkie-doe/core/theme.js:125


export function color(name) {
    const value = (0, __doeFn_valueAtPath)(name);
    if (typeof value !== "string") throw new TypeError(`未知 Yrkie 主题颜色: '${name}'。`);
    return value;
  }
