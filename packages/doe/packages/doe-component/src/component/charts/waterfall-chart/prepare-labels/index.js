import { wrapText as __doeFn_wrapText } from '../wrap-text/index.js';
// Origin: public/yrkie-doe/components/waterfall-chart/waterfall-chart.js:208
import { scope as __doeScope } from "../runtime/context/index.js";

export function prepareLabels(content, slotWidth) {
    const autoStagger = content.staggerLabels ?? content.items.length > 10;
    const labels = content.items.map((item, index) => {
      const tier = Number.isFinite(Number(item.labelTier))
        ? Math.max(0, Number(item.labelTier))
        : autoStagger && index > 0 && index < content.items.length - 1
          ? index % 2
          : 0;
      return {
        index,
        tier,
        lines: (0, __doeFn_wrapText)(item.label, Math.max(54, slotWidth * 1.12), `16px ${__doeScope.FONT_STACK}`),
      };
    });
    const maxTier = Math.max(0, ...labels.map((label) => label.tier));
    const tierHeights = Array.from({ length: maxTier + 1 }, (_, tier) => {
      const lineCount = Math.max(
        1,
        ...labels.filter((label) => label.tier === tier).map((label) => label.lines.length)
      );
      return lineCount * 18 + 12;
    });
    const tierOffsets = [];
    let offset = 22;
    tierHeights.forEach((height, index) => {
      tierOffsets[index] = offset;
      offset += height;
    });
    return { labels, tierOffsets, height: offset + 2 };
  }
