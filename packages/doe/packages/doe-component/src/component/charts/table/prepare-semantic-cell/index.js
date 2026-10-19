// Origin: public/yrkie-doe/components/data-table/data-table.js:78
import { scope as __doeScope } from "../runtime/context/index.js";

export function prepareSemanticCell(cell, options, column, kind) {
    const service = __doeScope.global.SemanticTextLayout;
    if (!options.enabled || !service?.prepareElement) return;
    const columnTerms = Array.isArray(column?.protectedTerms)
      ? column.protectedTerms
      : [];
    service.prepareElement(cell, {
      locale: column?.locale || options.locale,
      maxLines: kind === "header" ? options.maxHeaderLines : options.maxBodyLines,
      protectedTerms: [...options.protectedTerms, ...columnTerms],
      mode: kind,
    });
    // Canvas text metrics can be a few percent narrower than the glyphs the
    // browser finally paints (especially for mixed CJK/Latin custom fonts).
    // Keep a small measurement reserve so a line is wrapped before it can
    // visually cross into the next table column.
    cell.dataset.semanticWidthSafety = "0.92";
    cell.dataset.semanticOwner = "data-table";
  }
