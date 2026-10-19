import { typographySpecLabel as __doeFn_typographySpecLabel } from "../../typography/typography-spec-label/index.js";
import { applyTypographyCompression as __doeFn_applyTypographyCompression } from "../../typography/apply-typography-compression/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7358
import { scope as __doeScope } from "../../runtime/context/index.js";

export function applyCompositionDensity(
    shell,
    densitySpec,
    internalGap,
    minimumFontPt = __doeScope.MIN_READABLE_FONT_PT,
    allowMicroText = false,
    authoredSizeMode = "default",
  ) {
    const densityId = (0, __doeFn_typographySpecLabel)(densitySpec);
    const floorPt = __doeScope.MIN_MICRO_FONT_PT;
    (0, __doeFn_applyTypographyCompression)(shell, authoredSizeMode, densitySpec);
    shell.style.setProperty(
      "--composition-density",
      typeof densitySpec === "string"
        ? densityId
        : `${densitySpec.from || densityId}-${densitySpec.to || densityId}-${(
            Number(densitySpec.progress) || 0
          ).toFixed(3)}`,
    );
    shell.style.setProperty("--composition-font-floor", `${floorPt}pt`);
    shell.style.setProperty("--body-size", "var(--typography-normal-size)");
    shell.style.setProperty("--component-title-size", "var(--typography-h4-size)");
    shell.style.setProperty("--slide-title-size", "var(--typography-h1-size)");
    shell.style.setProperty("--hero-title-size", "var(--typography-h1-size)");
    shell.style.setProperty("--emphasis-size", "var(--typography-h2-size)");
    shell.style.setProperty("--hero-subtitle-size", "var(--typography-large-size)");
    shell.style.setProperty("--eyebrow-size", "var(--typography-small-size)");
    shell.style.setProperty("--metric-value-size", "var(--typography-h1-size)");
    shell.style.setProperty("--small-text-size", "var(--typography-small-size)");
    shell.style.setProperty("--delta-text-size", "var(--typography-small-size)");
    shell.style.setProperty("--question-index-size", "var(--typography-h4-size)");
    shell.style.setProperty(
      "--metric-min-height",
      `${__doeScope.COMPOSITION_METRIC_MIN_HEIGHT_PX[densityId] || 72}px`,
    );
    shell.style.setProperty(
      "--component-padding",
      `${Math.max(__doeScope.SPACING_TOKENS["6pt"], internalGap).toFixed(2)}px`,
    );
    shell.style.setProperty(
      "--component-gap",
      `${Math.max(__doeScope.SPACING_TOKENS["6pt"], internalGap).toFixed(2)}px`,
    );
  }
