import { clearCanvasSelection as __doeFn_clearCanvasSelection } from '../../clear-canvas-selection/index.js';
import { setHostReadOnly } from '../../set-host-read-only/index.js';
import { setSettingsOpen } from '../../set-settings-open/index.js';
import { setViewMode, pauseContinuousView, resumeContinuousView, flushSlideEditors, hasIndependentCanvases, invalidateAllSlideEditors } from '../../continuous-view/index.js';
import { resolveSlideDelete } from '../../delete-slide/index.js';
import { handleComponentInsertion, cancelComponentInsertion } from '../../insert-component/index.js';
import { setActiveSlide as __doeFn_setActiveSlide } from '../../set-active-slide/index.js';
import { announceReady as __doeFn_announceReady } from '../../announce-ready/index.js';
import { post as __doeFn_post } from '../../post/index.js';
import { currentDeck as __doeFn_currentDeck } from '../../current-deck/index.js';
import { schedulePendingDeckRender as __doeFn_schedulePendingDeckRender } from '../../schedule-pending-deck-render/index.js';
import { refreshActiveThumbnail as __doeFn_refreshActiveThumbnail } from '../../refresh-active-thumbnail/index.js';
import { publishLayoutDiagnostic as __doeFn_publishLayoutDiagnostic } from '../../publish-layout-diagnostic/index.js';
import { reconcileFilmstrip as __doeFn_reconcileFilmstrip } from '../../reconcile-filmstrip/index.js';
import { beginGeneration as __doeFn_beginGeneration } from '../../begin-generation/index.js';
import { setGenerationDeck as __doeFn_setGenerationDeck } from '../../set-generation-deck/index.js';
import { commitGeneration as __doeFn_commitGeneration } from '../../commit-generation/index.js';
import { abortGeneration as __doeFn_abortGeneration } from '../../abort-generation/index.js';
import { normalizeDeck as __doeFn_normalizeDeck } from '../../normalize-deck/index.js';
import { activeSlideId as __doeFn_activeSlideId } from '../../active-slide-id/index.js';
import { sameContent as __doeFn_sameContent } from '../../same-content/index.js';
import { releaseActiveResult as __doeFn_releaseActiveResult } from '../../release-active-result/index.js';
import { renderDeck as __doeFn_renderDeck } from '../../render-deck/index.js';
import { setGenerationReadOnly as __doeFn_setGenerationReadOnly } from '../../set-generation-read-only/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1602
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
__doeScope.global.addEventListener("message", (event) => {
    if (event.source !== __doeScope.global.parent) return;
    if (__doeScope.POST_TARGET !== "*" && event.origin !== __doeScope.POST_TARGET) return;
    const message = event.data;
    if (
      !message
      || message.channel !== __doeScope.MESSAGE_CHANNEL
      || message.version !== __doeScope.MESSAGE_VERSION
      || typeof message.type !== "string"
    ) return;
    if (message.type === "clear-selection") { (0, __doeFn_clearCanvasSelection)(); return; }
    if (message.type === 'host-read-only') { setHostReadOnly(message.readOnly); return; }
    if (message.type === 'set-view-mode') { setViewMode(message.mode, message.viewLabels); return; }
    if (message.type === 'open-settings') {
      if (message.section === null) { setSettingsOpen(false); return; }
      if (!['theme', 'page-number', 'logo'].includes(message.section)
        || __doeScope.state.generation || !__doeScope.state.activeResult
        || (__doeScope.runtimeSurface === 'work' && !__doeScope.state.formalDeckLoaded)) return;
      setSettingsOpen(true, { section: message.section, locale: message.locale, labels: message.labels });
      return;
    }
    if (message.type === 'insert-component') { void handleComponentInsertion(message); return; }
    if (message.type === 'cancel-component-insertion') { cancelComponentInsertion(message.requestId); return; }
    if (message.type === "resolve-slide-delete") {
      void resolveSlideDelete(message.requestId, message.confirmed).catch((error) => {
        (0, __doeFn_post)("error", { message: error instanceof Error ? error.message : String(error) });
      });
      return;
    }
    if (message.type === "set-active-slide") {
      void (0, __doeFn_setActiveSlide)(message.index);
      return;
    }
    if (message.type === "host-ready") {
      (0, __doeFn_announceReady)();
      return;
    }
    if (message.type === "request-deck") {
      (0, __doeFn_post)("deck-state", {
        dirty: __doeScope.state.dirty,
        revision: __doeScope.state.formalDeckRevision,
        index: __doeScope.state.activeIndex,
        total: __doeScope.state.slides.length,
        deck: (0, __doeFn_currentDeck)(),
      });
      return;
    }
    if (message.type === "host-visibility") {
      __doeScope.state.hostVisible = message.visible !== false;
      if (!__doeScope.state.hostVisible) {
        pauseContinuousView();
        setSettingsOpen(false);
        __doeScope.state.pendingDeckRender = true;
        __doeScope.state.resumeRenderAttempts = 0;
        __doeScope.state.renderToken += 1;
        __doeScope.state.activeMountAbortController?.abort();
        __doeScope.state.thumbnailCoordinator?.cancelBackground({ clearQueue: true });
        return;
      }
      resumeContinuousView();
      (0, __doeFn_schedulePendingDeckRender)();
      return;
    }
    if (message.type === "flush-deck") {
      const requestId = typeof message.requestId === "string" ? message.requestId : "";
      if (!requestId) return;
      if (__doeScope.runtimeSurface === 'work' && !__doeScope.state.formalDeckLoaded) {
        (0, __doeFn_post)("flush-deck-result", { requestId, errorCode: "schema-deck-editor-not-ready" });
        return;
      }
      void (async () => {
        if (__doeScope.state.generation) {
          (0, __doeFn_post)("flush-deck-result", { requestId, errorCode: "schema-deck-generation-active" });
          return;
        }
        try {
          await __doeScope.state.hostReadOnlyTransition;
          const slides = __doeScope.state.slides;
          await flushSlideEditors();
          await (0, __doeFn_refreshActiveThumbnail)();
          if (slides !== __doeScope.state.slides || __doeScope.state.generation) throw new Error('Deck changed while flushing');
          (0, __doeFn_post)("flush-deck-result", {
            requestId,
            dirty: __doeScope.state.dirty,
            revision: __doeScope.state.formalDeckRevision,
            changeVersion: __doeScope.state.changeVersion,
            index: __doeScope.state.activeIndex,
            total: __doeScope.state.slides.length,
            deck: (0, __doeFn_currentDeck)(),
          });
        } catch (error) {
          (0, __doeFn_post)("flush-deck-result", {
            requestId,
            errorCode: "schema-deck-flush-failed",
          });
        }
      })();
      return;
    }
    if (message.type === "ack-deck-revision") {
      const revision = Number(message.revision);
      const changeVersion = Number(message.changeVersion);
      if (
        !__doeScope.state.formalDeckLoaded
        || __doeScope.state.generation
        || !Number.isSafeInteger(revision)
        || revision <= __doeScope.state.formalDeckRevision
        || !Number.isSafeInteger(changeVersion)
        || changeVersion !== __doeScope.state.changeVersion
      ) return;
      __doeScope.state.formalDeckRevision = revision;
      __doeScope.state.activeResultRevision = revision;
      __doeScope.state.dirty = false;
      if (__doeScope.state.activeResult) {
        (0, __doeFn_publishLayoutDiagnostic)(__doeScope.state.activeResult, __doeScope.state.activeIndex, {
          requireActive: true,
          revision,
        });
      }
      (0, __doeFn_reconcileFilmstrip)({ replaceDeck: true });
      (0, __doeFn_post)("deck-state", {
        dirty: false,
        revision: __doeScope.state.formalDeckRevision,
        index: __doeScope.state.activeIndex,
        total: __doeScope.state.slides.length,
        deck: (0, __doeFn_currentDeck)(),
      });
      return;
    }
    if (message.type === "begin-generation") {
      (0, __doeFn_beginGeneration)(message.generationId);
      return;
    }
    if (message.type === "set-generation-deck") {
      (0, __doeFn_setGenerationDeck)(message);
      return;
    }
    if (message.type === "commit-generation") {
      (0, __doeFn_commitGeneration)(message.generationId);
      return;
    }
    if (message.type === "abort-generation") {
      void (0, __doeFn_abortGeneration)(message.generationId);
      return;
    }
    if (message.type === "sync-deck") {
      const requestId = String(message.requestId || "");
      const revision = Number(message.revision);
      if (__doeScope.state.generation || !Number.isSafeInteger(revision) || revision <= __doeScope.state.formalDeckRevision
        || Number(message.changeVersion) !== __doeScope.state.changeVersion) {
        (0, __doeFn_post)("sync-deck-result", { requestId, errorCode: "schema-deck-sync-conflict" });
        return;
      }
      try {
        const normalized = (0, __doeFn_normalizeDeck)(message.deck);
        const selectedId = (0, __doeFn_activeSlideId)();
        const oldIndex = __doeScope.state.activeIndex;
        const oldActive = __doeScope.state.slides[__doeScope.state.activeIndex];
        const sharedChanged = __doeScope.state.theme !== normalized.theme
          || !(0, __doeFn_sameContent)(__doeScope.state.pageNumber, normalized.pageNumber)
          || !(0, __doeFn_sameContent)(__doeScope.state.logo, normalized.logo);
        __doeScope.state.title = normalized.title;
        __doeScope.state.theme = normalized.theme;
        __doeScope.state.pageNumber = normalized.pageNumber;
        __doeScope.state.logo = normalized.logo;
        __doeScope.state.slides = normalized.slides;
        const index = __doeScope.state.slides.findIndex((slide) => slide.id === selectedId);
        __doeScope.state.activeIndex = index >= 0 ? index : Math.min(__doeScope.state.activeIndex, __doeScope.state.slides.length - 1);
        __doeScope.state.formalDeckRevision = revision;
        __doeScope.state.activeResultRevision = revision;
        __doeScope.state.changeVersion += 1;
        __doeScope.state.dirty = Boolean(message.dirty);
        const activeChanged = sharedChanged || __doeScope.state.activeRendering || oldIndex !== __doeScope.state.activeIndex
          || !(0, __doeFn_sameContent)(oldActive, __doeScope.state.slides[__doeScope.state.activeIndex]);
        (0, __doeFn_post)("sync-deck-result", { requestId, revision, changeVersion: __doeScope.state.changeVersion, dirty: __doeScope.state.dirty, index: __doeScope.state.activeIndex });
        (0, __doeFn_reconcileFilmstrip)({ replaceDeck: true });
        if (hasIndependentCanvases() || activeChanged) {
          if (!hasIndependentCanvases()) (0, __doeFn_releaseActiveResult)();
          void (0, __doeFn_renderDeck)({ discardPrevious: true });
        }
      } catch (error) {
        (0, __doeFn_post)("sync-deck-result", { requestId, errorCode: "schema-deck-sync-failed" });
      }
      return;
    }
    if (message.type === "set-deck") {
      try {
        const revision = Number(message.revision);
        if (!Number.isSafeInteger(revision) || revision <= 0) {
          throw new Error("Deck revision 无效");
        }
        const normalized = (0, __doeFn_normalizeDeck)(message.deck);
        invalidateAllSlideEditors();
        __doeScope.state.generation = null;
        __doeScope.state.title = normalized.title;
        __doeScope.state.theme = normalized.theme;
        __doeScope.state.pageNumber = normalized.pageNumber;
        __doeScope.state.logo = normalized.logo;
        __doeScope.state.slides = normalized.slides;
        __doeScope.state.activeIndex = Math.max(0, Math.min(__doeScope.state.slides.length - 1, Number(message.activeIndex) || 0));
        __doeScope.state.formalDeckLoaded = true;
        __doeScope.state.formalDeckRevision = revision;
        __doeScope.state.changeVersion = 0;
        if (!hasIndependentCanvases()) (0, __doeFn_releaseActiveResult)();
        __doeScope.state.dirty = false;
        (0, __doeFn_setGenerationReadOnly)(false);
        void (0, __doeFn_renderDeck)({ replaceDeck: true, discardPrevious: true }).then(() => {
          (0, __doeFn_post)("deck-state", {
            dirty: false,
            revision,
            index: __doeScope.state.activeIndex,
            total: __doeScope.state.slides.length,
            deck: (0, __doeFn_currentDeck)(),
          });
        });
      } catch (error) {
        (0, __doeFn_post)("error", { message: error?.message || "无法载入 Deck" });
      }
    }
  });
}
