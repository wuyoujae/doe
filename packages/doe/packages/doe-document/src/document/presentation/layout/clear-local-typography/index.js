// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7425
import { scope as __doeScope } from "../../runtime/context/index.js";

export function clearLocalTypography(shell) {
    __doeScope.LOCAL_TYPOGRAPHY_PROPERTIES.forEach((property) =>
      shell.style.removeProperty(property),
    );
    delete shell.dataset.typographySizeMode;
  }
