import { clamp as __doeFn_clamp } from '../clamp/index.js';
// Origin: public/yrkie-doe/core/schema-json-recovery.js:11


export function positionFromLineColumn(text, line, column) {
    const lines = String(text).split(/\r?\n/);
    let position = 0;
    for (let index = 0; index < Math.max(0, line - 1) && index < lines.length; index += 1) {
      position += lines[index].length + 1;
    }
    return (0, __doeFn_clamp)(position + Math.max(0, column - 1), 0, text.length);
  }
