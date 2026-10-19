// Origin: public/yrkie-doe/layout-engine/library-components.js:220
import { scope as __doeScope } from "../../runtime/library/context/index.js";

export function numberedIconCardsColumns(props, width) {
    return __doeScope.global.DOEContentsLayout.itemColumns(props, width, props.content?.items?.length || 1, 14);
  }
