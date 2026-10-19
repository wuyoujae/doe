// Origin: public/yrkie-doe/components/data-table/data-table.js:408


export function preserveSemanticAtomWidths(widths, metrics, totalWidth) {
    const resolved = [...widths];
    // Semantic wrapping measures with the same 8% glyph-safety reserve used by
    // prepareSemanticCell(). A column may be narrow, but it must not become a
    // few pixels narrower than its longest indivisible word/number. Otherwise
    // one English word can make an otherwise valid table+chart row look unsafe
    // and trigger a much uglier whole-slide stack fallback.
    const floors = metrics.map((metric) =>
      Math.min(
        totalWidth,
        metric.atomWidth / 0.92 + metric.padding + 2,
      ),
    );
    if (floors.reduce((sum, value) => sum + value, 0) > totalWidth + 0.5) {
      return resolved;
    }
    for (let pass = 0; pass < metrics.length * 2; pass += 1) {
      const receiver = resolved.findIndex(
        (value, index) => value + 0.5 < floors[index],
      );
      if (receiver < 0) break;
      let needed = floors[receiver] - resolved[receiver];
      const donors = resolved
        .map((value, index) => ({
          index,
          slack: index === receiver ? 0 : Math.max(0, value - floors[index]),
        }))
        .filter((entry) => entry.slack > 0.5)
        .sort((a, b) => b.slack - a.slack);
      for (const donor of donors) {
        if (needed <= 0.5) break;
        const transfer = Math.min(needed, donor.slack);
        resolved[donor.index] -= transfer;
        resolved[receiver] += transfer;
        needed -= transfer;
      }
      if (needed > 0.5) break;
    }
    return resolved;
  }
