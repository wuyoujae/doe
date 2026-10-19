// Origin: public/yrkie-doe/core/semantic-text-layout.js:392


export function parseTerms(value) {
    if (Array.isArray(value)) return value;
    const source = String(value || "").trim();
    if (!source) return [];
    try {
      const parsed = JSON.parse(source);
      if (Array.isArray(parsed)) return parsed;
    } catch (_error) {
      // Plain comma-separated attributes remain supported for authored HTML.
    }
    return source.split(/[,，|]/u).map((term) => term.trim()).filter(Boolean);
  }
