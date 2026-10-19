import { normalizeMediaFormat as __doeFn_normalizeMediaFormat } from '../normalize-media-format/index.js';
import { sourceLooksLikeGif as __doeFn_sourceLooksLikeGif } from '../source-looks-like-gif/index.js';
// Origin: public/yrkie-doe/layout-engine/components.js:240


export function resolveMediaFormat(props = {}) {
    const declared = (0, __doeFn_normalizeMediaFormat)(props.format);
    if (declared !== "auto") return declared;
    return (0, __doeFn_sourceLooksLikeGif)(props.src) ? "gif" : "image";
  }
