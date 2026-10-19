// Origin: public/yrkie-doe/core/semantic-text-layout.js:564


export function sourceTextFor(element) {
    if (element.dataset.semanticSource !== undefined) {
      return element.dataset.semanticSource;
    }
    const source = String(element.textContent || "");
    element.dataset.semanticSource = source;
    return source;
  }
