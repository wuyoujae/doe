import { collectColumnMetrics as __doeFn_collectColumnMetrics } from '../collect-column-metrics/index.js';
import { preserveSemanticAtomWidths as __doeFn_preserveSemanticAtomWidths } from '../preserve-semantic-atom-widths/index.js';
import { clampColumnWidths as __doeFn_clampColumnWidths } from '../clamp-column-widths/index.js';
import { estimateLineCount as __doeFn_estimateLineCount } from '../estimate-line-count/index.js';
// Origin: public/yrkie-doe/components/data-table/data-table.js:449


export function resolveColumnWidths(table, columns, totalWidth, mode, locale) {
    const count = columns.length;
    const equal = Array(count).fill(totalWidth / count);
    if (mode === "equal" || count < 2 || !Number.isFinite(totalWidth) || totalWidth <= 0) {
      return { widths: equal, resolved: "equal", reason: "requested-or-single-column" };
    }

    const metrics = (0, __doeFn_collectColumnMetrics)(table, columns, locale);
    const weights = metrics.map((metric) => Math.sqrt(Math.max(48, metric.preferred)));
    const weightTotal = weights.reduce((sum, value) => sum + value, 0) || count;
    const adaptive = (0, __doeFn_preserveSemanticAtomWidths)(
      (0, __doeFn_clampColumnWidths)(
        weights.map((weight) => totalWidth * weight / weightTotal),
        totalWidth,
        count,
      ),
      metrics,
      totalWidth,
    );

    const equalContent = totalWidth / count;
    const pressureColumns = metrics.filter((metric) => metric.preferred > equalContent * 0.98).length;
    const lowColumns = metrics.filter((metric) => metric.preferred < equalContent * 0.62).length;
    const atomicOverflow = metrics.some((metric) => metric.atomWidth + metric.padding > equalContent + 1);
    const equalLines = metrics.reduce((sum, metric) => sum + (0, __doeFn_estimateLineCount)(metric, equalContent), 0);
    const adaptiveLines = metrics.reduce(
      (sum, metric, index) => sum + (0, __doeFn_estimateLineCount)(metric, adaptive[index]),
      0,
    );
    const savedLines = equalLines - adaptiveLines;
    const preferredValues = metrics.map((metric) => metric.preferred).filter(Boolean);
    const preferredDemand = preferredValues.reduce((sum, value) => sum + value, 0);
    const minimumPreferred = preferredValues.length ? Math.min(...preferredValues) : 0;
    const maximumPreferred = preferredValues.length ? Math.max(...preferredValues) : 0;
    const imbalance = preferredValues.length
      ? maximumPreferred / Math.max(1, minimumPreferred)
      : 1;
    const spreadShare = (maximumPreferred - minimumPreferred) / Math.max(1, totalWidth);
    const widthPressure = preferredDemand / Math.max(1, totalWidth);
    // Compression makes every column wrap, so wrap-count deltas alone can
    // wrongly classify a visibly imbalanced table as equal. Preserve the
    // intrinsic demand of each entire column, including after a fresh remount.
    const intrinsicRebalance = count >= 2 &&
      imbalance >= (count === 2 ? 1.42 : 1.5) &&
      spreadShare >= (count === 2 ? 0.08 : 0.055);
    const pressureRebalance = count >= 2 &&
      widthPressure >= 0.82 &&
      imbalance >= 1.28 &&
      spreadShare >= 0.035;
    const structuralRebalance = count >= 3 &&
      lowColumns >= 2 &&
      imbalance >= 2.5 &&
      savedLines >= 1;
    const materiallyBetter = atomicOverflow || intrinsicRebalance || pressureRebalance || structuralRebalance || (
      lowColumns >= 1 &&
      (count === 2 ? pressureColumns >= 1 : pressureColumns >= 2) &&
      imbalance >= 1.5 &&
      savedLines >= 2
    );
    const useAdaptive = mode === "adaptive" || materiallyBetter;
    return {
      widths: useAdaptive ? adaptive : equal,
      resolved: useAdaptive ? "adaptive" : "equal",
      reason: mode === "adaptive"
        ? "requested"
        : atomicOverflow
          ? "semantic-atom-overflow"
          : materiallyBetter
            ? "meaningful-wrap-reduction"
            : "equal-is-stable",
      diagnostics: {
        pressureColumns,
        lowColumns,
        atomicOverflow,
        structuralRebalance,
        intrinsicRebalance,
        pressureRebalance,
        savedLines,
        imbalance,
        widthPressure,
        spreadShare,
      },
    };
  }
