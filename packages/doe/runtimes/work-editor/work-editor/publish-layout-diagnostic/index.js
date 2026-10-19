import { hasPendingSlideMedia as __doeFn_hasPendingSlideMedia } from '../has-pending-slide-media/index.js';
import { boundedLayoutOverflow as __doeFn_boundedLayoutOverflow } from '../bounded-layout-overflow/index.js';
import { post as __doeFn_post } from '../post/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:498
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function publishLayoutDiagnostic(
    result,
    index,
    { requireActive = false, revision = __doeScope.state.formalDeckRevision } = {},
  ) {
    if (
      !__doeScope.state.formalDeckLoaded
      || __doeScope.state.generation
      || __doeScope.state.dirty
      || !result
      || !result.element
      || (0, __doeFn_hasPendingSlideMedia)(result, result.element.parentElement)
      || !Number.isSafeInteger(revision)
      || revision <= 0
      || revision !== __doeScope.state.formalDeckRevision
      || (requireActive && result !== __doeScope.state.activeResult)
    ) {
      return;
    }
    const total = __doeScope.state.slides.length;
    if (
      !Number.isSafeInteger(index)
      || index < 0
      || total < 1
      || total > 200
      || index >= total
    ) {
      return;
    }
    const overflowX = (0, __doeFn_boundedLayoutOverflow)(result.report?.overflowX);
    const overflowY = (0, __doeFn_boundedLayoutOverflow)(result.report?.overflowY);
    const issue = result.element.dataset.overflowCode || "";
    if (
      result.report?.fits !== false
      || overflowX === null
      || overflowY === null
      || (overflowX === 0 && overflowY === 0)
      || !__doeScope.LAYOUT_DIAGNOSTIC_ISSUES.includes(issue)
    ) {
      delete result.element.dataset.workLayoutDiagnostic;
      return;
    }

    result.element.dataset.workLayoutDiagnostic = issue;
    (0, __doeFn_post)("layout-diagnostic", {
      issue,
      revision,
      index: index + 1,
      total,
      overflowX,
      overflowY,
    });
  }
