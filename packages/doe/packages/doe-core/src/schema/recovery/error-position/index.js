import { clamp as __doeFn_clamp } from '../clamp/index.js';
import { positionFromLineColumn as __doeFn_positionFromLineColumn } from '../position-from-line-column/index.js';
// Origin: public/yrkie-doe/core/schema-json-recovery.js:20


export function errorPosition(text, error) {
    const message = String(error?.message || "");
    const positioned = message.match(/\bposition\s+(\d+)/i);
    if (positioned) return (0, __doeFn_clamp)(Number(positioned[1]), 0, text.length);

    const lineColumn = message.match(/\bline\s+(\d+)\s+column\s+(\d+)/i);
    if (lineColumn) {
      return (0, __doeFn_positionFromLineColumn)(text, Number(lineColumn[1]), Number(lineColumn[2]));
    }

    if (/unexpected end|end of json|unterminated/i.test(message)) return text.length;
    return null;
  }
