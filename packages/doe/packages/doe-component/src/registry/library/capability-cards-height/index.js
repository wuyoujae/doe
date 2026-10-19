import { capabilityCardsColumns as __doeFn_capabilityCardsColumns } from '../capability-cards-columns/index.js';
import { clamp as __doeFn_clamp } from '../clamp/index.js';
// Origin: public/yrkie-doe/layout-engine/library-components.js:178
import { scope as __doeScope } from "../../runtime/library/context/index.js";

export function capabilityCardsHeight(props, width) {
    const items = props.content?.items || [];
    const columns = (0, __doeFn_capabilityCardsColumns)(props, width);
    const rows = Math.max(1, Math.ceil(items.length / columns));
    const columnWidth = Math.max(
      120,
      (width - Math.max(0, columns - 1) * 12) / columns,
    );
    const textFontSize = (0, __doeScope.typographyDefaultPx)("normal");
    const labelFontSize = (0, __doeScope.typographyDefaultPx)("normal");
    const contentWidth = Math.max(56, columnWidth - 94);
    const estimateLines = (value, fontSize, availableWidth) => {
      const visualUnits = Array.from(String(value || "")).reduce((total, character) => {
        if (/\s/u.test(character)) return total + 0.34;
        if (/[\u3400-\u9fff\uf900-\ufaff]/u.test(character)) return total + 1;
        return total + 0.58;
      }, 0);
      return Math.max(
        1,
        Math.ceil(visualUnits / Math.max(1, availableWidth / fontSize)),
      );
    };
    const tallestCard = Math.max(
      96,
      ...items.map((item) => {
        const legacyText = Array.isArray(item?.bullets) ? item.bullets.join("；") : "";
        const labelLines = estimateLines(item?.title, labelFontSize, columnWidth - 28);
        const textLines = estimateLines(item?.text || legacyText, textFontSize, contentWidth);
        const labelHeight = 10 + labelLines * labelFontSize;
        const bodyHeight = Math.max(62, 20 + textLines * textFontSize * 1.34);
        // Reserve the 2px top/bottom borders in addition to the measured grid
        // rows. Semantic wrapping settles after mount; without this four-pixel
        // allowance the final line box was clipped inside an otherwise safe
        // equal-height card.
        return Math.ceil(labelHeight + bodyHeight + 8);
      }),
    );
    const naturalHeight = rows * tallestCard + Math.max(0, rows - 1) * 12;
    return Math.round((0, __doeFn_clamp)(naturalHeight, 96, 620));
  }
