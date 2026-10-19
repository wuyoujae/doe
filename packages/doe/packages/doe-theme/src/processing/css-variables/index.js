// Origin: public/yrkie-doe/core/theme.js:146
import { scope as __doeScope } from "../../runtime/context/index.js";

export function cssVariables(theme = __doeScope.YRKIE_THEME) {
    const variables = {
      "--font-display": theme.fonts.stack,
      "--font-heading": theme.fonts.headingStack || theme.fonts.stack,
      "--yrkie-hero-title-size": `${theme.typography.heroSizePt || theme.typography.styles.h1.sizes.default}pt`,
      "--yrkie-metric-single-size": theme.typography.heroSizePt ? `${theme.typography.heroSizePt}pt` : "var(--typography-h1-size)",
      "--yrkie-metric-single-color": theme.typography.heroSizePt ? "var(--yrkie-color-primary)" : "var(--demo-navy)",
      "--font-code": theme.fonts.codeStack || '"Cascadia Code", "SFMono-Regular", Consolas, monospace',
      "--font-sans-cn": "var(--font-display)",
      "--font-serif-cn": "var(--font-display)",
      "--font-sans-en": theme.fonts.stack,
      "--yrkie-radius-canvas": theme.radius.canvas,
      "--yrkie-radius-component": theme.radius.component,
      "--yrkie-radius-pill": theme.radius.pill,
      "--yrkie-radius-circle": theme.radius.circle,
      "--yrkie-line-height": String(theme.typography.lineHeight),
      "--yrkie-line-height-em": `${theme.typography.lineHeight}em`,
      "--yrkie-letter-spacing-body": theme.typography.letterSpacing.body,
      "--yrkie-letter-spacing-heading": theme.typography.letterSpacing.heading,
      "--yrkie-letter-spacing-eyebrow": theme.typography.letterSpacing.eyebrow,
      "--yrkie-icon-stroke-width": String(theme.icon.strokeWidth),
      "--yrkie-font-weight-regular": String(theme.typography.weights.regular),
      "--yrkie-font-weight-semibold": String(theme.typography.weights.semibold),
      "--yrkie-font-weight-bold": String(theme.typography.weights.bold),
      "--yrkie-color-primary": theme.colors.primary,
      "--yrkie-color-mark": "#FACC15",
      "--yrkie-color-on-mark": "#F9F9FF",
      "--yrkie-color-secondary": theme.colors.secondary,
      "--yrkie-color-title": theme.colors.title,
      "--yrkie-color-body": theme.colors.body,
      "--yrkie-color-auxiliary": theme.colors.auxiliary,
      "--yrkie-color-dark": theme.colors.dark,
      "--yrkie-color-light": theme.colors.light,
      "--yrkie-color-surface": theme.colors.surface,
      "--yrkie-color-soft-surface": theme.colors.softSurface,
      "--yrkie-color-on-primary": theme.colors.onPrimary,
      "--yrkie-color-on-image": theme.colors.onImage,
      "--yrkie-color-mask": theme.colors.mask,
      "--yrkie-color-studio-stage": theme.colors.studioStage,
      "--yrkie-color-chart-1": theme.colors.chart[0],
      "--yrkie-color-chart-2": theme.colors.chart[1],
      "--yrkie-color-chart-3": theme.colors.chart[2],
      "--yrkie-color-chart-4": theme.colors.chart[3],
      "--yrkie-color-chart-5": theme.colors.chart[4],
      "--yrkie-code-background": theme.colors.code.background,
      "--yrkie-code-border": theme.colors.code.border,
      "--yrkie-code-text": theme.colors.code.text,
      "--yrkie-code-comment": theme.colors.code.comment,
      "--yrkie-code-string": theme.colors.code.string,
      "--yrkie-code-number": theme.colors.code.number,
      "--yrkie-code-keyword": theme.colors.code.keyword,
      "--yrkie-code-builtin": theme.colors.code.builtin,
      "--yrkie-code-operator": theme.colors.code.operator,
    };
    Object.entries(theme.typography.styles).forEach(([styleId, token]) => {
      variables[`--typography-${styleId}-size`] = `${token.sizes.default}pt`;
      variables[`--typography-${styleId}-weight`] = String(theme.typography.weights[token.defaultWeight]);
    });
    variables["--yrkie-line"] = `color-mix(in srgb, var(--yrkie-color-auxiliary) ${theme.lineAlpha.normal}%, transparent)`;
    variables["--yrkie-grid-line"] = `color-mix(in srgb, var(--yrkie-color-auxiliary) ${theme.lineAlpha.grid}%, transparent)`;
    variables["--yrkie-line-strong"] = `color-mix(in srgb, var(--yrkie-color-auxiliary) ${theme.lineAlpha.strong}%, transparent)`;
    // Resolve card/table rules once against the slide surface. Translucent
    // strokes otherwise darken again where rounded fills are antialiased.
    variables["--yrkie-line-solid"] = `color-mix(in srgb, var(--yrkie-color-auxiliary) ${theme.lineAlpha.normal}%, var(--yrkie-color-light))`;
    variables["--yrkie-line-strong-solid"] = `color-mix(in srgb, var(--yrkie-color-auxiliary) ${theme.lineAlpha.strong}%, var(--yrkie-color-light))`;
    variables["--yrkie-line-strong-on-fill"] = `color-mix(in srgb, var(--yrkie-color-auxiliary) ${theme.lineAlpha.strong}%, var(--yrkie-color-secondary))`;
    variables["--yrkie-on-image-muted"] = "color-mix(in srgb, var(--yrkie-color-on-image) 78%, transparent)";
    variables["--yrkie-shadow-soft"] = `color-mix(in srgb, ${theme.shadow.color} ${theme.shadow.softAlpha}%, transparent)`;
    variables["--yrkie-shadow-medium"] = `color-mix(in srgb, ${theme.shadow.color} ${theme.shadow.mediumAlpha}%, transparent)`;
    variables["--yrkie-shadow-strong"] = `color-mix(in srgb, ${theme.shadow.color} ${theme.shadow.strongAlpha}%, transparent)`;
    Object.assign(variables, {
      "--doe-heading-color": "var(--yrkie-color-title)",
      "--doe-body-color": "var(--yrkie-color-body)",
      "--doe-eyebrow-color": "var(--yrkie-color-title)",
      "--doe-eyebrow-background": "var(--yrkie-color-secondary)",
      "--doe-quote-rule-color": "var(--yrkie-color-primary)",
      "--doe-question-card-header-background": "var(--yrkie-color-secondary)",
      "--doe-question-card-header-color": "var(--yrkie-color-body)",
      "--t-paper": "var(--yrkie-color-light)",
      "--t-surface": "var(--yrkie-color-surface)",
      "--t-surface-raise": "var(--yrkie-color-surface)",
      "--t-ink": "var(--yrkie-color-title)",
      "--t-muted": "var(--yrkie-color-body)",
      "--t-muted-strong": "var(--yrkie-color-body)",
      "--t-line": "var(--yrkie-line)",
      "--t-line-strong": "var(--yrkie-line-strong)",
      "--t-primary": "var(--yrkie-color-primary)",
      "--t-accent": "var(--yrkie-color-primary)",
      "--t-on-primary": "var(--yrkie-color-on-primary)",
      "--t-neutral-soft": "var(--yrkie-color-light)",
      "--demo-navy": "var(--yrkie-color-body)",
      "--demo-red": "var(--yrkie-color-primary)",
      "--demo-red-soft": "var(--yrkie-color-secondary)",
      "--demo-ink": "var(--yrkie-color-title)",
      "--demo-muted": "var(--yrkie-color-body)",
      "--demo-line": "var(--yrkie-line)",
      "--demo-surface": "var(--yrkie-color-soft-surface)",
    });
    return variables;
  }
