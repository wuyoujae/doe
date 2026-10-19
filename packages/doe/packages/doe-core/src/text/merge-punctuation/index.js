// Origin: public/yrkie-doe/core/semantic-text-layout.js:58
import { scope as __doeScope } from "../layout/runtime/context/index.js";

export function mergePunctuation(tokens) {
    const merged = [];
    let pendingOpen = null;
    tokens.forEach((token) => {
      if (__doeScope.OPENING_PUNCTUATION.test(token.text)) {
        if (pendingOpen) { pendingOpen.text += (token.gapBefore || "") + token.text; pendingOpen.end = token.end; }
        else pendingOpen = { ...token };
        return;
      }
      if (__doeScope.CLOSING_PUNCTUATION.test(token.text) && merged.length) {
        merged[merged.length - 1].text += (token.gapBefore || "") + token.text;
        merged[merged.length - 1].end = token.end;
        return;
      }
      merged.push({
        ...token,
        text: pendingOpen ? pendingOpen.text + (token.gapBefore || "") + token.text : token.text,
        start: pendingOpen ? pendingOpen.start : token.start,
        gapBefore: pendingOpen ? pendingOpen.gapBefore : token.gapBefore,
      });
      pendingOpen = null;
    });
    if (pendingOpen) {
      if (merged.length) {
        merged[merged.length - 1].text += (pendingOpen.gapBefore || "") + pendingOpen.text;
        merged[merged.length - 1].end = pendingOpen.end;
      }
      else {
        merged.push({
          ...pendingOpen,
          protected: true,
          spaceBefore: false,
        });
      }
    }
    return merged;
  }
