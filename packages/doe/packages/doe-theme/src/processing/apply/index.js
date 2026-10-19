import { themeFor } from '../theme-for/index.js';
import { normalizeThemeId as __doeFn_normalizeThemeId } from "../normalize-theme-id/index.js";
import { installVariables as __doeFn_installVariables } from "../install-variables/index.js";
import { remapElement as __doeFn_remapElement } from "../remap-element/index.js";
// Origin: public/yrkie-doe/core/theme.js:288

export function apply(scope, requestedThemeId) {
    const theme = themeFor(requestedThemeId);
    const themeId = (0, __doeFn_normalizeThemeId)(requestedThemeId);
    const root = scope?.matches?.(".schema-slide")
      ? scope
      : scope?.querySelector?.(".schema-slide");
    const target = root || scope;
    if (!target) return theme;
    (0, __doeFn_installVariables)(target, theme);
    if (target.style) target.style.fontFamily = 'var(--font-display)';
    target.setAttribute?.("data-theme", themeId);
    target.toggleAttribute?.("data-theme-font-roles", Boolean(theme.fonts.headingStack || theme.fonts.codeStack));
    target.querySelectorAll?.("*").forEach(element => __doeFn_remapElement(element, theme));
    return theme;
  }
