import { renderMathRow as __doeFn_renderMathRow } from '../render-math-row/index.js';
import { mathEl as __doeFn_mathEl } from '../math-el/index.js';
import { symbolTag as __doeFn_symbolTag } from '../symbol-tag/index.js';
import { renderMathScript as __doeFn_renderMathScript } from '../render-math-script/index.js';
import { emptyMathBase as __doeFn_emptyMathBase } from '../empty-math-base/index.js';
import { renderMathBigOperator as __doeFn_renderMathBigOperator } from '../render-math-big-operator/index.js';
import { renderMathMatrix as __doeFn_renderMathMatrix } from '../render-math-matrix/index.js';
import { renderMathAligned as __doeFn_renderMathAligned } from '../render-math-aligned/index.js';
// Origin: public/yrkie-doe/components/math-formula/math-formula.js:833
import { scope as __doeScope } from "../runtime/context/index.js";

export function renderMathNode(node, options) {
    if (!node) return null;
    const settings = options || {};
    switch (node.kind) {
      case "root":
      case "seq":
        return (0, __doeFn_renderMathRow)(node.children, settings);
      case "group":
        return (0, renderMathNode)(node.body, settings);
      case "style-hint":
        return null;
      case "symbol": {
        const attrs = node.italic ? { mathvariant: "italic" } : null;
        return (0, __doeFn_mathEl)((0, __doeFn_symbolTag)(node), node.char, attrs);
      }
      case "operator":
        return /^[A-Za-z\u0370-\u03ff]$/.test(String(node.char || ""))
          ? (0, __doeFn_mathEl)("mi", node.char, { mathvariant: "italic" })
          : (0, __doeFn_mathEl)("mo", node.char);
      case "text": {
        const variants = {
          mathrm: "normal",
          mathit: "italic",
          mathbf: "bold",
          mathsf: "sans-serif",
          mathtt: "monospace",
          mathbb: "double-struck",
          mathcal: "script",
          mathfrak: "fraktur",
        };
        const identifierStyle = node.style === "mathbb" || node.style === "mathcal" || node.style === "mathfrak";
        return (0, __doeFn_mathEl)(identifierStyle ? "mi" : "mtext", node.value, {
          mathvariant: variants[node.style] || "normal",
          class: `ppt-math-formula__mtext ppt-math-formula__mtext--${node.style}`,
        });
      }
      case "space":
        return (0, __doeFn_mathEl)("mspace", null, { width: `${node.widthEm}em` });
      case "unknown":
        return (0, __doeFn_mathEl)("mtext", node.source, {
          mathcolor: __doeScope.global.PPTTheme.color("body"),
        });
      case "script":
        return (0, __doeFn_renderMathScript)(node, settings);
      case "frac": {
        const fraction = (0, __doeFn_mathEl)("mfrac", null, { linethickness: "0.055em" });
        fraction.append(
          (0, renderMathNode)(node.num, settings) || (0, __doeFn_emptyMathBase)(),
          (0, renderMathNode)(node.den, settings) || (0, __doeFn_emptyMathBase)(),
        );
        return fraction;
      }
      case "sqrt": {
        const radical = (0, __doeFn_mathEl)(node.index ? "mroot" : "msqrt");
        radical.append((0, renderMathNode)(node.radicand, settings) || (0, __doeFn_emptyMathBase)());
        if (node.index) radical.append((0, renderMathNode)(node.index, settings) || (0, __doeFn_emptyMathBase)());
        return radical;
      }
      case "delim": {
        const row = (0, __doeFn_mathEl)("mrow");
        if (node.open) row.append((0, __doeFn_mathEl)("mo", node.open, { stretchy: String(node.stretchy !== false), fence: "true" }));
        row.append((0, renderMathNode)(node.body, settings) || (0, __doeFn_emptyMathBase)());
        if (node.close) row.append((0, __doeFn_mathEl)("mo", node.close, { stretchy: String(node.stretchy !== false), fence: "true" }));
        return row;
      }
      case "fixed-delim":
        return (0, __doeFn_mathEl)("mo", node.char, { fence: "true", mathsize: `${node.size}em` });
      case "bigop":
        return (0, __doeFn_renderMathBigOperator)(node, settings);
      case "accent": {
        if (node.stretch) {
          const overline = (0, __doeFn_mathEl)("mrow", null, { class: "ppt-math-formula__overline" });
          overline.append((0, renderMathNode)(node.body, settings) || (0, __doeFn_emptyMathBase)());
          return overline;
        }
        const accent = (0, __doeFn_mathEl)("mover", null, { accent: "true" });
        accent.append(
          (0, renderMathNode)(node.body, settings) || (0, __doeFn_emptyMathBase)(),
          (0, __doeFn_mathEl)("mo", node.mark, { accent: "true" }),
        );
        return accent;
      }
      case "matrix":
        return (0, __doeFn_renderMathMatrix)(node, settings);
      case "aligned":
        return (0, __doeFn_renderMathAligned)(node, settings);
      default:
        return null;
    }
  }
