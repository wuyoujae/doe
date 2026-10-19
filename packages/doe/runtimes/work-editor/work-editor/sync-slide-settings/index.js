import { syncLogoSettings } from '../logo-settings/index.js';
import { syncThemeSettings } from '../theme-settings/index.js';
import { currentSlide as __doeFn_currentSlide } from '../current-slide/index.js';
import { pageNumberSettings as __doeFn_pageNumberSettings } from '../page-number-settings/index.js';
import { isBleedSlide as __doeFn_isBleedSlide } from '../is-bleed-slide/index.js';
import { setCustomSelectValue as __doeFn_setCustomSelectValue } from '../set-custom-select-value/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:998
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function syncSlideSettings() {
    syncThemeSettings();
    syncLogoSettings();
    const slideValue = (0, __doeFn_currentSlide)();
    if (!slideValue) return;
    const pageNumber = (0, __doeFn_pageNumberSettings)();
    const background = slideValue.background && typeof slideValue.background === "object"
      ? slideValue.background
      : null;
    const bleed = (0, __doeFn_isBleedSlide)(slideValue);
    const hasBackground = Boolean(background?.src);

    __doeScope.elements.pageNumberEnabled.setAttribute("aria-checked", String(pageNumber.enabled));
    __doeScope.elements.pageNumberFormatField.classList.toggle("is-disabled", !pageNumber.enabled);
    (0, __doeFn_setCustomSelectValue)("page-number-format", pageNumber.format);

    __doeScope.elements.backgroundReplace.textContent = __doeScope.global.DOEContentEditor?.labels?.replaceImage || "更换图片";
    __doeScope.elements.backgroundReplace.disabled = bleed || Boolean(__doeScope.state.generation) || !__doeScope.global.DOEContentEditor?.openBackground;
    __doeScope.elements.backgroundRemove.disabled = bleed || !hasBackground;
    __doeScope.elements.backgroundOptions.classList.toggle("is-disabled", bleed || !hasBackground);
    __doeScope.elements.backgroundOpacityField.classList.toggle("is-disabled", bleed || !hasBackground);
    __doeScope.elements.backgroundDirectionField.classList.toggle("is-disabled", bleed || !hasBackground);
    __doeScope.elements.backgroundNote.hidden = !bleed;

    const contentDisabled = bleed || !hasBackground || background?.enabled === false || Boolean(__doeScope.state.generation);
    __doeScope.elements.backgroundContentWidthField.classList.toggle("is-disabled", contentDisabled);
    __doeScope.elements.backgroundContentWidth.disabled = contentDisabled;
    __doeScope.elements.backgroundContentAlignField.classList.toggle("is-disabled", contentDisabled);
    __doeScope.elements.backgroundContentAlignField.querySelector(".work-editor__custom-select-trigger").disabled = contentDisabled;
    __doeScope.elements.backgroundTextSurfaceField.classList.toggle("is-disabled", contentDisabled);
    __doeScope.elements.backgroundTextSurfaceField.querySelector(".work-editor__custom-select-trigger").disabled = contentDisabled;
    (0, __doeFn_setCustomSelectValue)("background-text-surface", background?.textSurface || "auto");
    const contentWidth = Number.isFinite(background?.contentWidth) ? background.contentWidth : 1;
    const contentPercent = Math.max(20, Math.min(100, contentWidth * 100));
    __doeScope.elements.backgroundContentWidth.value = String(contentPercent);
    __doeScope.elements.backgroundContentWidthOutput.textContent = `${Number(contentPercent.toPrecision(12))}%`;
    (0, __doeFn_setCustomSelectValue)("background-content-align", background?.contentAlign || "center");

    (0, __doeFn_setCustomSelectValue)("background-fit", background?.fit === "contain" ? "contain" : "cover");
    (0, __doeFn_setCustomSelectValue)("background-position", background?.position || "50% 50%");
    (0, __doeFn_setCustomSelectValue)("background-direction", background?.overlay?.direction || "to-right");
    const opacity = Math.max(0, Math.min(90, Math.round((Number(background?.overlay?.opacity) || 0) * 100)));
    __doeScope.elements.backgroundOpacity.value = String(opacity);
    __doeScope.elements.backgroundOpacityOutput.textContent = `${opacity}%`;
  }
