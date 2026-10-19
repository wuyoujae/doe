// Origin: public/yrkie-doe/work-editor/component-gallery.js:18
import { scope as __doeScope } from "../../../../studio/gallery/chinese/runtime/context/index.js";

export function slide(id, blocks, layout = __doeScope.baseLayout, background = null) {
    return {
      version: 4,
      slide: {
        id,
        size: { width: 960, height: 540, unit: "pt" },
        editor: true,
        ...(background ? { background } : {}),
        layout,
        blocks,
      },
    };
  }
