// Origin: public/yrkie-doe/work-editor/work-editor.js:314
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function post(type, payload = {}) {
    let messagePayload = payload;
    if (type === "deck-change" && payload.dirty === true) {
      if (__doeScope.runtimeSurface === 'work' && !__doeScope.state.formalDeckLoaded) return;
      __doeScope.state.changeVersion += 1;
      messagePayload = { ...payload, revision: __doeScope.state.formalDeckRevision, changeVersion: __doeScope.state.changeVersion };
    }
    __doeScope.global.parent.postMessage(
      { channel: __doeScope.MESSAGE_CHANNEL, version: __doeScope.MESSAGE_VERSION, type, ...messagePayload },
      __doeScope.POST_TARGET,
    );
  }
