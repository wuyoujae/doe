import { directRowCapacity as __doeFn_directRowCapacity } from '../direct-row-capacity/index.js';
import { tableBorderBoxHeight as __doeFn_tableBorderBoxHeight } from '../table-border-box-height/index.js';
import { tableCellsFit as __doeFn_tableCellsFit } from '../table-cells-fit/index.js';
import { expandSemanticLineBudget as __doeFn_expandSemanticLineBudget } from '../expand-semantic-line-budget/index.js';
import { applySemanticCells as __doeFn_applySemanticCells } from '../apply-semantic-cells/index.js';
// Origin: public/yrkie-doe/components/data-table/data-table.js:204
import { scope as __doeScope } from "../runtime/context/index.js";

export function reboundTypographyToAvailableHeight(
    host,
    table,
    colgroup,
    columns,
    requestedMode,
    locale,
    authoredHeight,
    configuredAvailableHeight,
  ) {
    const availableHeight = (0, __doeFn_directRowCapacity)(host, configuredAvailableHeight);
    if (availableHeight <= Math.max(0, authoredHeight) + 2) {
      delete host.dataset.typographyRebound;
      delete host.dataset.typographyReboundAvailableHeight;
      return null;
    }

    const previousTableMinHeight = table.style.minHeight;
    table.style.minHeight = "0";
    host.style.height = "auto";
    host.dataset.spaceDensity = "minimum";

    const selectedFont =
      Number.parseFloat(__doeScope.global.getComputedStyle?.(table)?.fontSize) ||
      __doeScope.global.PPTTheme.theme.typography.styles.normal.sizes.default * (4 / 3);
    let selectedDensity = "minimum";
    let selectedFits = false;

    // Table copy always uses the theme's `normal` token. Available space may
    // change cell density and row height, but it must never synthesize an
    // intermediate pixel size outside the shared typography enum.
    for (const density of __doeScope.SPACE_DENSITIES) {
      host.dataset.spaceDensity = density;
      void table.offsetHeight;
      const fits =
        table.scrollWidth <= host.clientWidth + 1 &&
        (0, __doeFn_tableBorderBoxHeight)(table) <= availableHeight + 1 &&
        (0, __doeFn_tableCellsFit)(table);
      if (fits) {
        selectedDensity = density;
        selectedFits = true;
        break;
      }
    }

    host.dataset.spaceDensity = selectedDensity;
    (0, __doeFn_expandSemanticLineBudget)(table);
    let semantic = (0, __doeFn_applySemanticCells)(table);
    void table.offsetHeight;
    let naturalHeight = (0, __doeFn_tableBorderBoxHeight)(table);
    const resolvedHeight = Math.max(
      Math.ceil(authoredHeight),
      Math.min(availableHeight, naturalHeight),
    );
    host.style.height = `${resolvedHeight}px`;
    table.style.minHeight = previousTableMinHeight;
    host.dataset.typographyRebound = `${selectedFont}px`;
    host.dataset.typographyReboundAvailableHeight = String(availableHeight);
    host.dataset.typographyReboundFits = String(
      selectedFits &&
        semantic.blocked === 0 &&
        naturalHeight <= availableHeight + 1 &&
        (0, __doeFn_tableCellsFit)(table),
    );
    host.dataset.spaceFits = host.dataset.typographyReboundFits;
    // fitCellSpacing may have recorded a blocked token before the row supplied
    // enough height for the normal-token reflow. Once every final cell fits its own
    // content box, that old diagnostic is no longer valid and must not keep
    // the slide in an overflow state.
    host.dataset.semanticBlocked = String(semantic.blocked);
    return {
      fontPx: selectedFont,
      density: selectedDensity,
      height: resolvedHeight,
      availableHeight,
      fits: host.dataset.typographyReboundFits === "true",
    };
  }
