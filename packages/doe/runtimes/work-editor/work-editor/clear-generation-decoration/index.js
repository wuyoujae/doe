// Origin: public/yrkie-doe/work-editor/work-editor.js:614
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function clearGenerationDecoration() {
    const stage = __doeScope.elements.frame.closest('.work-editor__stage') || __doeScope.elements.canvas;
    stage
      .querySelectorAll(".block-shell.is-ai-generating, .block-shell.is-ai-arriving")
      .forEach((shell) => {
        shell.classList.remove("is-ai-generating", "is-ai-arriving");
        delete shell.dataset.aiBadgePlacement;
      });
    stage
      .querySelectorAll('[data-ai-generation-chrome="true"]')
      .forEach((node) => node.remove());
  }
