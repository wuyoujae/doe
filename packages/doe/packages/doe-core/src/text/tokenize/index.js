import { normalizeLocale as __doeFn_normalizeLocale } from '../normalize-locale/index.js';
import { tokenizeParagraph as __doeFn_tokenizeParagraph } from '../tokenize-paragraph/index.js';
// Origin: public/yrkie-doe/core/semantic-text-layout.js:153


export function tokenize(text, options = {}) {
    const source = String(text ?? "").replace(/\r\n?/g, "\n");
    const locale = (0, __doeFn_normalizeLocale)(options.locale, source);
    const paragraphs = source.split(/\r?\n/u).map((paragraph) =>
      (0, __doeFn_tokenizeParagraph)(paragraph, { ...options, locale }),
    );
    return {
      locale,
      source,
      paragraphSources: source.split("\n"),
      paragraphs: paragraphs.map((paragraph) => paragraph.tokens),
      tokens: paragraphs.flatMap((paragraph) => paragraph.tokens),
    };
  }
