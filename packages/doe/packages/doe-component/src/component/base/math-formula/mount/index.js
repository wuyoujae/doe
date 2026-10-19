import { validate as __doeFn_validate } from '../validate/index.js';
import { resolveTarget as __doeFn_resolveTarget } from '../resolve-target/index.js';
import { estimateHeight as __doeFn_estimateHeight } from '../estimate-height/index.js';
import { el as __doeFn_el } from '../el/index.js';
import { parseFormula as __doeFn_parseFormula } from '../parse-formula/index.js';
import { renderAst as __doeFn_renderAst } from '../render-ast/index.js';
import { wireFormulaFit as __doeFn_wireFormulaFit } from '../wire-formula-fit/index.js';
import { fitFormula as __doeFn_fitFormula } from '../fit-formula/index.js';
// Origin: public/yrkie-doe/components/math-formula/math-formula.js:1194
import { scope as __doeScope } from "../runtime/context/index.js";

export function mount(target, config) {
    (0, __doeFn_validate)(config);
    const host = (0, __doeFn_resolveTarget)(target, "MathFormula");
    const content = config.content;
    const formula = content.formula;

    const explicitWidth = Number(config.size?.width);
    const explicitHeight = Number(config.size?.height);
    host.dataset.mathAutoHeight = String(!(explicitHeight > 0));
    const width = explicitWidth > 0 ? explicitWidth : 960;
    const height = explicitHeight > 0 ? explicitHeight : (0, __doeFn_estimateHeight)(formula, width);

    host.replaceChildren();
    host.className = "ppt-math-formula";
    host.style.width = `${width}px`;
    host.style.height = `${height}px`;
    host.setAttribute("role", "img");
    host.setAttribute("aria-label", `LaTeX: ${formula}`);
    host.dataset.display = String(content.display === true);
    host.style.setProperty("--math-align", content.align || "center");
    host.style.removeProperty("--math-color");

    const body = (0, __doeFn_el)("div", "ppt-math-formula__body");
    const parsed = (0, __doeFn_parseFormula)(formula);
    body.append((0, __doeFn_renderAst)(parsed.ast, { display: content.display === true }));
    host.append(body);
    host.dataset.mathWarnings = String(parsed.warnings.length);

    (0, __doeFn_wireFormulaFit)(host, body);

    // Fonts may not be ready at first mount; the fallback-face measurement is
    // stale once the real math font arrives. Re-fit once, after the font
    // loading completes, so the scale reflects the actual glyph widths.
    if (host.dataset.mathFontsWired !== "1") {
      host.dataset.mathFontsWired = "1";
      const fontsReady =
        __doeScope.global.document?.fonts?.ready &&
        typeof __doeScope.global.document.fonts.ready.then === "function";
      if (fontsReady) {
        __doeScope.global.document.fonts.ready.then(() => {
          if (host.isConnected && body.isConnected) {
            (0, __doeFn_fitFormula)(host, body);
          }
        });
      }
    }

    return { element: host, size: { width, height } };
  }
