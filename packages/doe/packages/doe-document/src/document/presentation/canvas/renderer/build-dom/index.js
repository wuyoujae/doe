import { element as __doeFn_element } from "../../../../../../../doe-core/src/runtime/element/index.js";
import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from "../../../layout/is-edge-split-group/index.js";
import { createSlideBackgroundView as __doeFn_createSlideBackgroundView } from "../create-slide-background-view/index.js";
import { createPageNumberView as __doeFn_createPageNumberView } from "../create-page-number-view/index.js";
import { applyPageNumberForeground as __doeFn_applyPageNumberForeground } from "../apply-page-number-foreground/index.js";
import { renderGroup as __doeFn_renderGroup } from "../render-group/index.js";
import { renderLeaf as __doeFn_renderLeaf } from "../render-leaf/index.js";
import { updateSelection as __doeFn_updateSelection } from "../../editor/update-selection/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7034


import { createLogoView } from '../create-logo-view/index.js';
import { stageRender } from '../render-buffer/index.js';

export function buildDom(state) {
    state.itemDragCleanup?.();
    const slideElement = (0, __doeFn_element)("section", "schema-slide");
    const layoutElement = (0, __doeFn_element)("div", "schema-layout");
    slideElement.dataset.slideId = state.slide.id;
    slideElement.dataset.theme = state.theme;
    slideElement.dataset.layoutPreset = state.slide.layout.preset;
    slideElement.dataset.editor = String(state.slide.editor);
    slideElement.dataset.canvasMode = state.mode;
    slideElement.inert = state.mode === "static";
    slideElement.dataset.pageNumberEnabled = String(
      state.pageNumber?.enabled === true,
    );
    slideElement.dataset.edgeMedia = String(
      state.slide.blocks.some((block) => (0, __doeFn_isEdgeSplitGroup)(block)),
    );

    state.slideElement = slideElement;
    if (state.flowLayout) slideElement.dataset.flowModel = state.flowLayout.version;
    state.layoutElement = layoutElement;
    state.backgroundView = null;
    state.leafRecords = [];
    state.groupRecords = [];
    state.siblingSets = [];
    state.solverItemColumnCandidates = null;
    const backgroundView = (0, __doeFn_createSlideBackgroundView)(state);
    if (backgroundView) slideElement.append(backgroundView.layer);
    slideElement.append(layoutElement);
    const logoView = createLogoView(state);
    if (logoView) slideElement.append(logoView);
    const pageNumberView = (0, __doeFn_createPageNumberView)(state);
    if (pageNumberView) slideElement.append(pageNumberView);
    (0, __doeFn_applyPageNumberForeground)(state);

    if (backgroundView?.controls) slideElement.append(backgroundView.controls);

    // Derived question-card numbers are presentation state, not authored data.
    // Reset on every rebuild so reordering cards also updates omitted indexes.
    state.questionCardSequence = 0;
    const rootShells = state.slide.blocks.map((block) =>
      block.type === "layout-group"
        ? (0, __doeFn_renderGroup)(block, state, 0)
        : (0, __doeFn_renderLeaf)(block, state, 0),
    );
    rootShells.forEach((block) => layoutElement.append(block));
    state.rootShells = rootShells;
    state.siblingSets.push(rootShells);

    layoutElement.addEventListener("click", (event) => {
      if (event.target !== layoutElement) return;
      state.selectedId = null;
      (0, __doeFn_updateSelection)(state);
    });
    stageRender(state, slideElement);
    window.PPTTheme?.apply(slideElement, state.theme);
  }
