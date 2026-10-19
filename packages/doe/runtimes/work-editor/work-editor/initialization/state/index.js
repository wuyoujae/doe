import { deepClone as __doeFn_deepClone } from '../../deep-clone/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:276
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
__doeScope.state = {
    title: __doeScope.DEFAULT_DECK.deck.title,
    theme: __doeScope.DEFAULT_DECK.deck.theme,
    logo: null,
    pageNumber: (0, __doeFn_deepClone)(__doeScope.DEFAULT_DECK.pageNumber),
    slides: __doeScope.runtimeSurface === 'work' ? [] : (0, __doeFn_deepClone)(__doeScope.DEFAULT_DECK.deck.slides),
    activeIndex: 0,
    viewMode: __doeScope.runtimeSurface === 'work' ? 'continuous' : 'single',
    activeResult: null,
    activeResultRevision: 0,
    activeMountAbortController: null,
    activeRendering: false,
    thumbnailCoordinator: null,
    renderToken: 0,
    dirty: false,
    initialized: false,
    fontsReady: false,
    hostVisible: true,
    hostReadOnly: false,
    hostReadOnlyTransition: null,
    pendingDeckRender: false,
    resumeRenderScheduled: false,
    resumeRenderAttempts: 0,
    settingsOpen: false,
    settingsSection: null,
    generation: null,
    formalDeckLoaded: false,
    formalDeckRevision: 0,
    changeVersion: 0,
  };
}
