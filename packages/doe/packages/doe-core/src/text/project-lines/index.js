// Origin: public/yrkie-doe/core/semantic-text-layout.js:405


export function projectLines(source, ranges) {
    let text = "";
    let cursor = 0;
    const breaks = [];
    ranges.forEach((range, index) => {
      const gap = source.slice(cursor, range.start);
      if (index && !gap.includes("\n")) {
        breaks.push({ index: text.length, original: gap });
        text += "\n";
      } else text += gap;
      text += source.slice(range.start, range.end);
      cursor = range.end;
    });
    text += source.slice(cursor);
    return { text, breaks };
  }
