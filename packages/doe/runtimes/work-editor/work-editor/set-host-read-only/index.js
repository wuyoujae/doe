// Host edit exclusion is independent from generation previews and preserves pending edits.
import { scope } from '../../../../integrations/work/editor/runtime/context/index.js';
import { flushSlideEditors, invalidateAllSlideEditors, hasIndependentCanvases } from '../continuous-view/index.js';
import { releaseActiveResult } from '../release-active-result/index.js';
import { renderDeck } from '../render-deck/index.js';
import { setSettingsOpen } from '../set-settings-open/index.js';
import { cancelComponentInsertion } from '../insert-component/index.js';
import { updateNavigation } from '../update-navigation/index.js';

export function setHostReadOnly(enabled) {
  const value = enabled === true;
  if (scope.state.hostReadOnly === value) return;
  scope.state.hostReadOnly = value;
  scope.global.document.documentElement.dataset.hostReadOnly = String(value);
  scope.elements.add.disabled = value || Boolean(scope.state.generation);
  if (scope.elements.settingsTrigger) scope.elements.settingsTrigger.disabled = value || Boolean(scope.state.generation);
  if (value) {
    setSettingsOpen(false);
    cancelComponentInsertion();
    for (const frame of scope.global.document.querySelectorAll('doe-canvas')) frame.inert = true;
  }
  const previous = scope.state.hostReadOnlyTransition;
  const transition = (async () => {
    await previous?.catch(() => undefined);
    // The host's explicit flush can save changes made before exclusion began.
    await flushSlideEditors();
    if (!scope.state.formalDeckLoaded || scope.state.generation) return;
    invalidateAllSlideEditors();
    if (!hasIndependentCanvases()) releaseActiveResult();
    // Rendering can wait for external images. The save barrier needs the flushed source,
    // not a second full layout pass, so do not hold the host flush behind image decoding.
    void renderDeck({ discardPrevious: true }).then(() => {
      for (const frame of scope.global.document.querySelectorAll('doe-canvas')) frame.inert = Boolean(scope.state.hostReadOnly || scope.state.generation);
      updateNavigation();
    }).catch(() => undefined);
  })();
  scope.state.hostReadOnlyTransition = transition;
  // Explicit flush consumes the rejection; avoid an unhandled rejection for status-only locks.
  void transition.catch(() => undefined);
}
