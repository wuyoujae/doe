import { isElement as __doeFn_isElement } from '../is-element/index.js';
import { sourceTextFor as __doeFn_sourceTextFor } from '../source-text-for/index.js';
import { parseTerms as __doeFn_parseTerms } from '../parse-terms/index.js';
import { renderBlockedTokens as __doeFn_renderBlockedTokens } from '../render-blocked-tokens/index.js';
import { renderLines as __doeFn_renderLines } from '../render-lines/index.js';
import { layout as __doeFn_layout } from '../layout/index.js';
import { renderInlineFormat } from '../inline-format/index.js';
import { renderedLineOverflowRatio as __doeFn_renderedLineOverflowRatio } from '../rendered-line-overflow-ratio/index.js';
// Origin: public/yrkie-doe/core/semantic-text-layout.js:621
import { scope as __doeScope } from "../layout/runtime/context/index.js";

export function applyElement(element, options = {}) {
    if (!(0, __doeFn_isElement)(element)) return null;
    if (element.dataset.semanticEditing === "true" && !options.editing) return null;
    if (element.dataset.flowTruncated === 'true' && !options.editing) return {status:'truncated',lines:[],tokens:[]};
    if (element.__doeInlineFormat?.runs.length) {
      const {text,runs}=element.__doeInlineFormat;
      renderInlineFormat(element,text,runs);
      const style=getComputedStyle(element);
      element.dataset.semanticWrapStatus='formatted';
      element.dataset.semanticAppliedWidth=String((element.clientWidth-(parseFloat(style.paddingLeft)||0)-(parseFloat(style.paddingRight)||0))*(Number(element.dataset.semanticWidthSafety)||1));
      element.dataset.semanticAppliedFontPx=String(parseFloat(style.fontSize));
      return {status:'formatted',lines:[],tokens:[]};
    }
    const source = (0, __doeFn_sourceTextFor)(element);
    if (!source) return null;

    if (element.dataset.semanticOriginalInlineFontSize === undefined) {
      element.dataset.semanticOriginalInlineFontSize = element.style.fontSize || "";
    }
    if (!options.editing) element.style.fontSize = element.dataset.semanticResolvedFontSize || element.dataset.semanticOriginalInlineFontSize;
    const style = __doeScope.global.getComputedStyle(element);
    const horizontalPadding =
      (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
    const rawAvailableWidth = Math.max(0, element.clientWidth - horizontalPadding);
    const widthSafety = Math.max(
      0.72,
      Math.min(
        1,
        Number(options.widthSafety || element.dataset.semanticWidthSafety) || 1,
      ),
    );
    const availableWidth = rawAvailableWidth * widthSafety;
    if (availableWidth <= 0) {
      delete element.dataset.semanticAppliedWidth;
      delete element.dataset.semanticAppliedFontPx;
      element.dataset.semanticWrapStatus = "deferred";
      return { status: "deferred", lines: [], tokens: [] };
    }

    const authoredPx = parseFloat(style.fontSize) || 16;
    const maxLines = Math.max(
      1,
      Number(options.maxLines || element.dataset.semanticMaxLines) || 2,
    );
    // The Studio shell is Chinese, but slide content may be English or
    // multilingual. Only an explicit component locale is sticky; otherwise
    // detect the language from the source instead of inheriting the UI locale.
    const locale = options.locale || element.dataset.semanticLocale || "auto";
    const protectedTerms = [
      ...(0, __doeFn_parseTerms)(element.dataset.semanticTerms),
      ...(Array.isArray(options.protectedTerms) ? options.protectedTerms : []),
    ];
    const layoutOptions = {
      locale,
      protectedTerms,
      widthPx: availableWidth,
      fontPx: authoredPx,
      minFontPt: Number(options.minFontPt || element.dataset.semanticMinPt) || 8,
      maxLines,
      allowScale: options.allowScale === true || element.dataset.semanticAllowScale === "true",
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight,
      fontStyle: style.fontStyle,
      letterSpacingPx: parseFloat(style.letterSpacing) || 0,
    };

    const renderResult = (candidate) => {
      if (!options.editing) element.style.fontSize = element.dataset.semanticResolvedFontSize || element.dataset.semanticOriginalInlineFontSize;
      if (element.dataset.semanticRender === "plaintext") {
        const projection = candidate.projection || { text: source, breaks: [] };
        if (element.textContent !== projection.text || element.childNodes.length !== 1) element.textContent = projection.text;
        element.__semanticProjection = projection;
        if (candidate.status === "scaled") element.style.fontSize = `${candidate.fontPx}px`;
        return;
      }
      if (candidate.status === "blocked") {
        (0, __doeFn_renderBlockedTokens)(element, candidate.tokens);
        return;
      }
      if (candidate.status === "scaled") {
        element.style.fontSize = `${candidate.fontPx}px`;
      }
      (0, __doeFn_renderLines)(element, candidate.lines);
    };

    let result = (0, __doeFn_layout)(source, layoutOptions);
    renderResult(result);

    // Canvas shaping can be a few pixels narrower than the final browser glyph
    // run, especially for mixed Chinese/Latin content. Semantic lines are
    // intentionally nowrap, so a false one-line fit would otherwise escape the
    // card. Verify the painted line and retry with its measured safety ratio.
    // `allowScale` is unchanged: normal body copy keeps its authored size and
    // gains another line instead of being shrunk early.
    for (let attempt = 0; attempt < 2 && result.status !== "blocked"; attempt += 1) {
      const fitRatio = (0, __doeFn_renderedLineOverflowRatio)(element);
      if (fitRatio >= 0.998) break;
      layoutOptions.widthPx = Math.max(
        1,
        layoutOptions.widthPx * Math.max(0.72, Math.min(0.97, fitRatio * 0.98)),
      );
      result = (0, __doeFn_layout)(source, layoutOptions);
      renderResult(result);
    }

    element.setAttribute("aria-label", source);
    element.dataset.semanticWrapStatus = result.status;
    element.dataset.semanticLines = String(result.lines.length);
    element.dataset.semanticLocale = result.locale;
    // The winning layout may be repainted at a different width/font after an
    // iframe becomes visible, a composition ratio changes, or a streaming
    // draft settles. Persist the actual constraints used by this pass so the
    // engine can invalidate stale semantic line markup instead of mistaking
    // existing spans for a finished result.
    element.dataset.semanticAppliedWidth = String(
      Math.round(availableWidth * 100) / 100,
    );
    element.dataset.semanticAppliedFontPx = String(
      Math.round((parseFloat(__doeScope.global.getComputedStyle(element).fontSize) || authoredPx) * 100) / 100,
    );
    return result;
  }
