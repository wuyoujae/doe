import { needsEqualHeightNegotiation as __doeFn_needsEqualHeightNegotiation } from '../needs-equal-height-negotiation/index.js';
import { naturalEqualHeightItemSize as __doeFn_naturalEqualHeightItemSize } from '../natural-equal-height-item-size/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7531


export function equalizeNegotiatedCardHeights(state) {
    const results = [];
    state.groupRecords.forEach((group) => {
      if (!(0, __doeFn_needsEqualHeightNegotiation)(group)) return;
      // The measuring phase uses max-content tracks and no child floor. Text
      // therefore wraps at the real resolved width while retaining the current
      // semantic font size. The outer density solver will only step the entire
      // cohort down if this natural shared height exceeds the slide boundary.
      void group.content.offsetHeight;
      const heights = group.childShells.map(__doeFn_naturalEqualHeightItemSize);
      const equalHeight = Math.max(0, ...heights);
      if (!equalHeight) return;
      group.content.style.setProperty(
        "--equal-item-height",
        `${equalHeight}px`,
      );
      group.content.dataset.equalHeightPhase = "equalized";
      group.childShells.forEach((shell) => {
        shell.dataset.equalHeightItem = "true";
        shell.style.height = `${equalHeight}px`;
        shell.style.minHeight = `${equalHeight}px`;
        shell.style.setProperty("--equal-item-height", `${equalHeight}px`);
        const content = [...shell.children].find(
          (child) =>
            child.classList?.contains("block-content") ||
            child.classList?.contains("layout-group__content"),
        );
        if (content) {
          content.style.height = "100%";
          content.style.minHeight = "0";
          const card = content.querySelector(":scope > .component-card");
          if (card) card.style.height = "100%";
        }
      });
      results.push({
        id: group.node.id,
        equalHeight,
        naturalHeights: heights,
      });
    });
    return results;
  }
