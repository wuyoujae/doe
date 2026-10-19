// Origin: public/yrkie-doe/core/semantic-text-layout.js:424


export function editingText(element) {
    let text = element.textContent || "";
    let breaks = (element.__semanticProjection?.text === text
      ? element.__semanticProjection.breaks : []).map(entry => ({ ...entry }));
    const update = (next) => {
      if (next === text) return;
      let prefix = 0;
      while (prefix < text.length && prefix < next.length && text[prefix] === next[prefix]) prefix++;
      let oldEnd = text.length;
      let newEnd = next.length;
      while (oldEnd > prefix && newEnd > prefix && text[oldEnd - 1] === next[newEnd - 1]) { oldEnd--; newEnd--; }
      breaks = breaks.filter(entry => entry.index < prefix || entry.index >= oldEnd)
        .map(entry => ({ ...entry, index: entry.index >= oldEnd ? entry.index + newEnd - oldEnd : entry.index }));
      text = next;
    };
    const source = () => {
      let result = ""; let cursor = 0;
      for (const entry of breaks) { result += text.slice(cursor, entry.index) + entry.original; cursor = entry.index + 1; }
      return result + text.slice(cursor);
    };
    return {
      update, source,
      snapshot() { return { text, breaks: breaks.map(entry => ({ ...entry })) }; },
      sourceOffset(offset) {
        return offset + breaks.filter(entry => entry.index < offset).reduce((delta, entry) => delta + entry.original.length - 1, 0);
      },
      displayOffset(offset) {
        let delta = 0;
        for (const entry of breaks) {
          const start = entry.index + delta;
          if (offset < start + entry.original.length) break;
          delta += entry.original.length - 1;
        }
        return offset - delta;
      },
      reset(projection) { text = projection.text; breaks = projection.breaks.map(entry => ({ ...entry })); },
    };
  }
