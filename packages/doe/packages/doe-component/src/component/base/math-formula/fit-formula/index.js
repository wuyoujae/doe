import { readNumber as __doeFn_readNumber } from '../read-number/index.js';
// Origin: public/yrkie-doe/components/math-formula/math-formula.js:1106
import { scope as __doeScope } from "../runtime/context/index.js";

export function fitFormula(host, body) {
    const root = body.querySelector(".ppt-math-formula__root");
    if (!root) return;

    // MathML's automatic script scaling can fall below the product's smallest
    // readable body size even when the root uses h4. Keep native positioning
    // and raise only those descendants to the existing semantic normal token.
    const view = body.ownerDocument.defaultView;
    root.querySelectorAll('[data-math-min-size]').forEach(node => node.removeAttribute('data-math-min-size'));
    const probe = body.ownerDocument.createElement('span');
    probe.style.fontSize = 'var(--typography-normal-size)';
    body.append(probe);
    const minimum = Number.parseFloat(view.getComputedStyle(probe).fontSize);
    probe.remove();
    for (const node of root.querySelectorAll('*')) {
      if (Number.parseFloat(view.getComputedStyle(node).fontSize) < minimum - 0.01) node.setAttribute('data-math-min-size', '');
    }

    const computed = __doeScope.global.getComputedStyle
      ? __doeScope.global.getComputedStyle(body)
      : null;
    const baseFontPx = computed
      ? Number.parseFloat(computed.fontSize)
      : __doeScope.global.PPTTheme.theme.typography.styles.h4.sizes.default * (4 / 3);
    if (!Number.isFinite(baseFontPx) || baseFontPx <= 0) return;

    const paddingX = computed
      ? Number.parseFloat(computed.paddingLeft || 0) + Number.parseFloat(computed.paddingRight || 0)
      : 28;
    const paddingY = computed
      ? Number.parseFloat(computed.paddingTop || 0) + Number.parseFloat(computed.paddingBottom || 0)
      : 18;
    if (host.dataset.mathAutoHeight === "true") {
      const scale = body.clientHeight ? body.getBoundingClientRect().height / body.clientHeight : 1;
      const height = Math.ceil(root.getBoundingClientRect().height / (scale || 1) + paddingY);
      if (height > 0) host.style.height = `${height}px`;
    }
    const availableWidth = Math.max(
      0,
      (body.clientWidth || 0) - paddingX,
    );
    const availableHeight = Math.max(
      0,
      (body.clientHeight || 0) - paddingY,
    );
    if (availableWidth <= 0 || availableHeight <= 0) return;

    const rect = typeof root.getBoundingClientRect === "function"
      ? root.getBoundingClientRect()
      : null;
    const bodyRect = body.getBoundingClientRect();
    const scaleX = body.clientWidth ? bodyRect.width / body.clientWidth : 1;
    const scaleY = body.clientHeight ? bodyRect.height / body.clientHeight : 1;
    const formulaWidth = (0, __doeFn_readNumber)(rect?.width / (scaleX || 1), (0, __doeFn_readNumber)(root.scrollWidth, availableWidth));
    const formulaHeight = (0, __doeFn_readNumber)(rect?.height / (scaleY || 1), (0, __doeFn_readNumber)(root.scrollHeight, availableHeight));

    const fits =
      formulaWidth <= availableWidth + 1 &&
      formulaHeight <= availableHeight + 1;
    body.dataset.fitStatus = fits ? "fits" : "blocked";
    body.dataset.semanticWrapStatus = fits ? "preserved" : "blocked";
    body.dataset.fitOverflowX = String(
      Math.max(0, Math.ceil(formulaWidth - availableWidth)),
    );
    body.dataset.fitOverflowY = String(
      Math.max(0, Math.ceil(formulaHeight - availableHeight)),
    );
  }
