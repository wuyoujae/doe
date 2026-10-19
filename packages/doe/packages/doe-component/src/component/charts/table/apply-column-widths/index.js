// Origin: public/yrkie-doe/components/data-table/data-table.js:534


export function applyColumnWidths(host, colgroup, result) {
    const total = result.widths.reduce((sum, value) => sum + value, 0) || 1;
    Array.from(colgroup.children).forEach((column, index) => {
      column.style.width = `${(result.widths[index] / total * 100).toFixed(3)}%`;
    });
    host.dataset.columnSizingResolved = result.resolved;
    host.dataset.columnSizingReason = result.reason;
    host.dataset.columnWidths = result.widths
      .map((value) => `${(value / total * 100).toFixed(1)}%`)
      .join(",");
    if (result.diagnostics) {
      host.dataset.columnSizingDiagnostics = JSON.stringify({
        pressureColumns: result.diagnostics.pressureColumns,
        lowColumns: result.diagnostics.lowColumns,
        atomicOverflow: result.diagnostics.atomicOverflow,
        structuralRebalance: result.diagnostics.structuralRebalance,
        intrinsicRebalance: result.diagnostics.intrinsicRebalance,
        pressureRebalance: result.diagnostics.pressureRebalance,
        savedLines: result.diagnostics.savedLines,
        imbalance: Number(result.diagnostics.imbalance.toFixed(2)),
        widthPressure: Number(result.diagnostics.widthPressure.toFixed(2)),
        spreadShare: Number(result.diagnostics.spreadShare.toFixed(3)),
      });
    }
  }
