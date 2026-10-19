import { clamp as __doeFn_clamp } from '../clamp/index.js';
// Origin: public/yrkie-doe/core/schema-json-recovery.js:34


export function locationAt(text, position) {
    const safePosition = (0, __doeFn_clamp)(Number(position) || 0, 0, text.length);
    const prefix = text.slice(0, safePosition);
    const line = (prefix.match(/\n/g) || []).length + 1;
    const lineStart = prefix.lastIndexOf("\n") + 1;
    const lineEndIndex = text.indexOf("\n", safePosition);
    const lineEnd = lineEndIndex === -1 ? text.length : lineEndIndex;
    const sourceLine = text.slice(lineStart, lineEnd).replace(/\r$/, "");
    const column = safePosition - lineStart + 1;
    const radius = 72;
    const excerptStart = Math.max(0, safePosition - radius);
    const excerptEnd = Math.min(text.length, safePosition + radius);
    return {
      position: safePosition,
      line,
      column,
      sourceLine,
      pointer: `${" ".repeat(Math.max(0, column - 1))}^`,
      excerpt: text.slice(excerptStart, excerptEnd),
    };
  }
