import { ensureThumbnailCoordinator as __doeFn_ensureThumbnailCoordinator } from '../ensure-thumbnail-coordinator/index.js';
import { pageNumberSettings as __doeFn_pageNumberSettings } from '../page-number-settings/index.js';
import { updateNavigation as __doeFn_updateNavigation } from '../update-navigation/index.js';
import { reconcileContinuousView } from '../continuous-view/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1271
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function reconcileFilmstrip({ replaceDeck = false, revealContinuous = true } = {}) {
    const coordinator = (0, __doeFn_ensureThumbnailCoordinator)();
    coordinator.reconcile(
      __doeScope.state.slides,
      __doeScope.state.activeIndex,
      (0, __doeFn_pageNumberSettings)(),
      { replaceDeck, logo: __doeScope.state.logo },
    );
    (0, __doeFn_updateNavigation)();
    reconcileContinuousView({ replaceDeck, reveal: revealContinuous });
  }
