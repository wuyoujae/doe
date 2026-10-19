import { applyTypographySizeMode as __doeFn_applyTypographySizeMode } from "../apply-typography-size-mode/index.js";
import { typographySpecLabel as __doeFn_typographySpecLabel } from "../typography-spec-label/index.js";
import { typographyCompressionSizes as __doeFn_typographyCompressionSizes } from "../typography-compression-sizes/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:358
import { scope as __doeScope } from "../../runtime/context/index.js";

export function applyTypographyCompression(element, sizeMode, densitySpec) {
    (0, __doeFn_applyTypographySizeMode)(element, sizeMode);
    const step = Math.max(0, __doeScope.DENSITIES.findIndex(
      density => density.id === (0, __doeFn_typographySpecLabel)(densitySpec),
    ));
    for (const styleId of Object.keys(__doeScope.TYPOGRAPHY_STYLES)) {
      const sizes = (0, __doeFn_typographyCompressionSizes)(styleId, sizeMode);
      element.style.setProperty(
        `--typography-${styleId}-size`,
        `${sizes[Math.min(step, sizes.length - 1)]}pt`,
      );
    }
  }
