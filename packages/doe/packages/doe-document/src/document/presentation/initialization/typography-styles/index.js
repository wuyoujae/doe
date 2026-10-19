import { typographyStyleToken as __doeFn_typographyStyleToken } from "../../typography/typography-style-token/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:266
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.TYPOGRAPHY_STYLES = Object.freeze(
    Object.fromEntries(
      Object.entries(__doeScope.THEME_TYPOGRAPHY.styles).map(([styleId, token]) => [
        styleId,
        (0, __doeFn_typographyStyleToken)(
          { ...token.sizes },
          token.defaultWeight,
          token.allowedWeights,
        ),
      ]),
    ),
  );
}
