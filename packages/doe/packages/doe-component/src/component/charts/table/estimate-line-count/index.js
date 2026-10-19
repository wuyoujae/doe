// Origin: public/yrkie-doe/components/data-table/data-table.js:403


export function estimateLineCount(metric, availableWidth) {
    const contentWidth = Math.max(12, availableWidth - metric.padding);
    return metric.fullWidths.reduce((sum, width) => sum + Math.max(1, Math.ceil(width / contentWidth)), 0);
  }
