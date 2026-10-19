import { isElement as __doeFn_isElement } from '../is-element/index.js';
// Origin: public/yrkie-doe/core/semantic-text-layout.js:745


export function prepareElement(element, options = {}) {
    if (!(0, __doeFn_isElement)(element)) return element;
    element.dataset.semanticWrap = options.mode || "auto";
    if (options.render === "plaintext") element.dataset.semanticRender = "plaintext";
    if (options.locale) element.dataset.semanticLocale = options.locale;
    if (options.maxLines) element.dataset.semanticMaxLines = String(options.maxLines);
    if (options.minFontPt) element.dataset.semanticMinPt = String(options.minFontPt);
    if (options.allowScale === true) element.dataset.semanticAllowScale = "true";
    if (Number.isFinite(Number(options.widthSafety))) {
      element.dataset.semanticWidthSafety = String(options.widthSafety);
    }
    if (Array.isArray(options.protectedTerms) && options.protectedTerms.length) {
      element.dataset.semanticTerms = JSON.stringify(options.protectedTerms);
    }
    return element;
  }
