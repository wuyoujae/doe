import { numberedIconCardsColumns as __doeFn_numberedIconCardsColumns } from '../numbered-icon-cards-columns/index.js';
import { clamp as __doeFn_clamp } from '../clamp/index.js';
// Origin: public/yrkie-doe/layout-engine/library-components.js:224
import { scope as __doeScope } from "../../runtime/library/context/index.js";

export function numberedIconCardsHeight(props, width, density) {
    const items = props.content?.items || [];
    const columns = (0, __doeFn_numberedIconCardsColumns)(props, width);
    const rows = Math.max(1, Math.ceil(items.length / columns));
    const rowGap = rows === 1 ? 0 : 12;
    const columnGap = 14;
    const columnWidth = Math.max(
      120,
      (Math.max(1, width) - Math.max(0, columns - 1) * columnGap) / columns,
    );
    const iconSize = rows === 1 ? 82 : rows === 2 ? 78 : 56;
    const horizontalPadding = rows === 1 ? 44 : rows === 2 ? 36 : 28;
    const headingSize = (0, __doeScope.typographyDefaultPx)("h3");
    const headingGap = rows === 1 ? 12 : rows === 2 ? 10 : 8;
    const textSize = (0, __doeScope.typographyDefaultPx)("normal");
    const minimumCardHeight = rows === 1 ? 240 : rows === 2 ? 180 : 130;
    const estimateLines = (value, fontSize, availableWidth) => {
      const visualUnits = Array.from(String(value || "")).reduce((total, character) => {
        if (/\s/u.test(character)) return total + 0.34;
        if (/[\u3400-\u9fff\uf900-\ufaff]/u.test(character)) return total + 1;
        return total + 0.58;
      }, 0);
      return Math.max(
        1,
        Math.ceil(
          visualUnits /
            Math.max(1, Math.max(40, availableWidth) / Math.max(1, fontSize)),
        ),
      );
    };
    const rowHeights = Array.from({ length: rows }, (_, rowIndex) =>
      Math.max(
        minimumCardHeight,
        ...items
          .slice(rowIndex * columns, (rowIndex + 1) * columns)
          .map((item) => {
            const textWidth = columnWidth - horizontalPadding - iconSize * 0.2;
            const headingLines = estimateLines(item?.title, headingSize, textWidth);
            const textLines = estimateLines(item?.text, textSize, textWidth);
            const topPadding = rows === 1 ? 20 : rows === 2 ? 16 : 12;
            const bottomReserve = iconSize * 0.88 + 12;
            const itemBadgeInset = iconSize * 0.12;
            return Math.ceil(
              topPadding +
                headingLines * headingSize * 1.08 +
                headingGap +
                textLines * textSize * (rows === 3 ? 1.32 : rows === 2 ? 1.34 : 1.38) +
                bottomReserve +
                itemBadgeInset,
            );
          }),
      ),
    );
    const naturalHeight =
      rowHeights.reduce((sum, height) => sum + height, 0) +
      Math.max(0, rows - 1) * rowGap;
    return Math.round((0, __doeFn_clamp)(naturalHeight, 220, 580) * (__doeScope.densityScale[density] || 1));
  }
