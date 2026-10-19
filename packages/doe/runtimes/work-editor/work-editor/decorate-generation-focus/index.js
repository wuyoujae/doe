import { clearGenerationDecoration as __doeFn_clearGenerationDecoration } from '../clear-generation-decoration/index.js';
import { currentSlide as __doeFn_currentSlide } from '../current-slide/index.js';
import { createGenerationIcon as __doeFn_createGenerationIcon } from '../create-generation-icon/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:653
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function decorateGenerationFocus(generation, animate = false) {
    (0, __doeFn_clearGenerationDecoration)();
    if (
      !generation
      || __doeScope.state.generation !== generation
      || generation.focusSlideId !== (0, __doeFn_currentSlide)()?.id
      || !generation.focusBlockId
    ) return;
    const shell = [...__doeScope.elements.canvas.querySelectorAll(".block-shell")].find(
      (candidate) => candidate.dataset.blockId === generation.focusBlockId,
    );
    if (!shell) return;

    const outline = document.createElement("span");
    outline.className = "ai-generation-outline";
    outline.dataset.aiGenerationChrome = "true";
    outline.setAttribute("aria-hidden", "true");

    const badge = document.createElement("span");
    badge.className = "ai-generation-badge";
    badge.dataset.aiGenerationChrome = "true";
    badge.setAttribute("role", "status");
    badge.setAttribute("aria-live", "polite");
    const icon = (0, __doeFn_createGenerationIcon)("Sparkles", "ai-generation-badge__icon");
    const label = document.createElement("span");
    label.textContent = "AI 正在生成…";
    if (icon) badge.append(icon);
    badge.append(label);

    const slideElement = shell.closest(".schema-slide");
    const slideRect = slideElement?.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    const scale = slideRect?.width ? slideRect.width / __doeScope.CANVAS.width : 1;
    shell.dataset.aiBadgePlacement =
      slideRect && shellRect.top - slideRect.top < 28 * scale ? "inside" : "outside";
    shell.classList.add("is-ai-generating");
    if (animate) shell.classList.add("is-ai-arriving");
    shell.append(outline, badge);
    if (animate) {
      __doeScope.global.setTimeout(() => shell.classList.remove("is-ai-arriving"), 700);
    }
  }
