// Origin: public/yrkie-doe/components/waterfall-chart/waterfall-chart.js:41
import { scope as __doeScope } from "../runtime/context/index.js";

export function wrapText(text, maxWidth, font) {
    const paragraphs = String(text || "").split(/\n/);
    const lines = [];

    paragraphs.forEach((paragraph) => {
      if (!paragraph) {
        lines.push("");
        return;
      }
      if (__doeScope.utils.measureText(paragraph, font) <= maxWidth) {
        lines.push(paragraph);
        return;
      }

      const words = /\s/.test(paragraph)
        ? paragraph.trim().split(/\s+/)
        : Array.from(paragraph);
      let line = "";
      words.forEach((word) => {
        const separator = /\s/.test(paragraph) && line ? " " : "";
        const candidate = `${line}${separator}${word}`;
        if (line && __doeScope.utils.measureText(candidate, font) > maxWidth) {
          lines.push(line);
          line = word;
        } else {
          line = candidate;
        }
      });
      if (line) lines.push(line);
    });

    return lines.length ? lines : [""];
  }
