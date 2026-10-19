// Origin: public/yrkie-doe/components/data-table/data-table.js:381


export function clampColumnWidths(raw, totalWidth, columnCount) {
    const minShare = columnCount === 2 ? 0.25 : columnCount === 3 ? 0.16 : 0.09;
    const maxShare = columnCount === 2 ? 0.75 : columnCount === 3 ? 0.58 : 0.44;
    const minimum = totalWidth * minShare;
    const maximum = totalWidth * maxShare;
    const widths = raw.map((value) => Math.min(maximum, Math.max(minimum, value)));
    for (let pass = 0; pass < 8; pass += 1) {
      const delta = totalWidth - widths.reduce((sum, value) => sum + value, 0);
      if (Math.abs(delta) < 0.5) break;
      const eligible = widths
        .map((value, index) => ({ value, index }))
        .filter(({ value }) => delta > 0 ? value < maximum - 0.5 : value > minimum + 0.5);
      if (!eligible.length) break;
      const portion = delta / eligible.length;
      eligible.forEach(({ index }) => {
        widths[index] = Math.min(maximum, Math.max(minimum, widths[index] + portion));
      });
    }
    const resolved = widths.reduce((sum, value) => sum + value, 0) || totalWidth;
    return widths.map((value) => value * totalWidth / resolved);
  }
