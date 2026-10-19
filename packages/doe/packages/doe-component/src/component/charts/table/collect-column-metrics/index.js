import { canvasContext as __doeFn_canvasContext } from '../canvas-context/index.js';
import { fontString as __doeFn_fontString } from '../font-string/index.js';
import { measuredTextWidth as __doeFn_measuredTextWidth } from '../measured-text-width/index.js';
import { semanticSegments as __doeFn_semanticSegments } from '../semantic-segments/index.js';
import { cellHorizontalPadding as __doeFn_cellHorizontalPadding } from '../cell-horizontal-padding/index.js';
import { percentile as __doeFn_percentile } from '../percentile/index.js';
// Origin: public/yrkie-doe/components/data-table/data-table.js:347


export function collectColumnMetrics(table, columns, locale) {
    const context = (0, __doeFn_canvasContext)();
    const rows = [table.tHead?.rows?.[0], ...Array.from(table.tBodies?.[0]?.rows || [])]
      .filter(Boolean)
      .slice(0, 81);
    return columns.map((_column, columnIndex) => {
      const fullWidths = [];
      const atomWidths = [];
      let padding = 0;
      rows.forEach((row) => {
        const cell = row.cells[columnIndex];
        if (!cell || !context) return;
        const font = (0, __doeFn_fontString)(cell);
        const text = cell.textContent || "";
        const full = (0, __doeFn_measuredTextWidth)(context, font, text);
        const atoms = (0, __doeFn_semanticSegments)(text, locale);
        const atom = Math.max(0, ...atoms.map((part) => (0, __doeFn_measuredTextWidth)(context, font, part)));
        fullWidths.push(full);
        atomWidths.push(atom);
        padding = Math.max(padding, (0, __doeFn_cellHorizontalPadding)(cell));
      });
      const preferredText = Math.max(
        fullWidths[0] || 0,
        (0, __doeFn_percentile)(fullWidths.slice(1), 0.72),
      );
      return {
        fullWidths,
        atomWidth: Math.max(0, ...atomWidths),
        preferred: preferredText + padding,
        padding,
      };
    });
  }
