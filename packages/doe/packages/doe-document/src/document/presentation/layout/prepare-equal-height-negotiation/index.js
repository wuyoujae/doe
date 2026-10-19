import { needsEqualHeightNegotiation as __doeFn_needsEqualHeightNegotiation } from '../needs-equal-height-negotiation/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7493


export function prepareEqualHeightNegotiation(state) {
    state.groupRecords.forEach((group) => {
      if (!(0, __doeFn_needsEqualHeightNegotiation)(group)) return;
      group.content.dataset.equalHeightPhase = "measuring";
      group.content.style.gridAutoRows = "max-content";
      group.content.style.removeProperty("--equal-item-height");
      group.childShells.forEach((shell) => {
        delete shell.dataset.equalHeightItem;
        shell.style.removeProperty("height");
        shell.style.removeProperty("min-height");
        shell.style.removeProperty("--equal-item-height");
        const content = [...shell.children].find(
          (child) =>
            child.classList?.contains("block-content") ||
            child.classList?.contains("layout-group__content"),
        );
        content?.style.removeProperty("height");
        content?.style.removeProperty("min-height");
        content?.querySelector(":scope > .component-card")?.style.removeProperty("height");
      });
    });
  }
