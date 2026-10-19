import { measureText as __doeFn_measureText } from '../measure-text/index.js';
// Origin: public/yrkie-doe/core/chart-utils.js:127


export function wrapText(text, maxWidth, font) {
    const lines = [];
    String(text ?? "").split(/\r?\n/).forEach((paragraph) => {
      let line = "";
      paragraph.trim().split(/\s+/).forEach((word) => {
        const candidate = line ? `${line} ${word}` : word;
        if (line && (0, __doeFn_measureText)(candidate, font) > maxWidth) {
          lines.push(line); line = "";
        }
        // Chinese paragraphs and long identifiers have no spaces. Split an
        // over-wide token instead of returning an overflowing single line.
        if ((0, __doeFn_measureText)(word, font) > maxWidth) {
          Array.from(word).forEach((character) => {
            if (line && (0, __doeFn_measureText)(line + character, font) > maxWidth) {
              lines.push(line); line = "";
            }
            line += character;
          });
        } else line = line ? `${line} ${word}` : word;
      });
      lines.push(line);
    });
    return lines;
  }
