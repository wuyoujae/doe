// Origin: public/yrkie-doe/core/semantic-text-layout.js:40
import { scope as __doeScope } from "../layout/runtime/context/index.js";

export function uniqueTerms(locale, customTerms) {
    return [...new Set([
      ...(__doeScope.DEFAULT_TERMS[locale] || []),
      ...(Array.isArray(customTerms) ? customTerms : []),
    ].map((term) => String(term || "").trim()).filter(Boolean))]
      .sort((a, b) => b.length - a.length);
  }
