// Origin: public/yrkie-doe/components/data-table/data-table.js:55


export function semanticOptions(config, content) {
    if (config.semanticWrap === false || content.semanticWrap === false) {
      return { enabled: false };
    }
    const tableOptions = {
      ...(content.semanticWrap && typeof content.semanticWrap === "object"
        ? content.semanticWrap
        : {}),
      ...(config.semanticWrap && typeof config.semanticWrap === "object"
        ? config.semanticWrap
        : {}),
    };
    return {
      enabled: true,
      locale: tableOptions.locale || config.locale || content.locale || "auto",
      protectedTerms: Array.isArray(tableOptions.protectedTerms)
        ? tableOptions.protectedTerms
        : [],
      // Flow measures the complete natural table against the page budget.
      // Its cells must not fail solely because the legacy three-line hint was
      // exhausted. Explicit limits and the legacy fixed-height path stay intact.
      maxHeaderLines: tableOptions.maxHeaderLines == null && config.__flowLayout === true
        ? 24 : Math.max(1, Math.min(6, Number(tableOptions.maxHeaderLines) || 3)),
      maxBodyLines: tableOptions.maxBodyLines == null && config.__flowLayout === true
        ? 24 : Math.max(1, Math.min(8, Number(tableOptions.maxBodyLines) || 3)),
    };
  }
