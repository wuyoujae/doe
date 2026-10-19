import { fitFormula as __doeFn_fitFormula } from '../fit-formula/index.js';
// Origin: public/yrkie-doe/components/math-formula/math-formula.js:1175
import { scope as __doeScope } from "../runtime/context/index.js";

export function wireFormulaFit(host, body) {
    (0, __doeFn_fitFormula)(host, body);
    if (typeof __doeScope.global.requestAnimationFrame === "function") {
      __doeScope.global.requestAnimationFrame(() => {
        if (host.isConnected && body.isConnected) (0, __doeFn_fitFormula)(host, body);
      });
    }

    const previous = __doeScope.fitObservers.get(host);
    if (previous) previous.disconnect();
    if (typeof __doeScope.global.ResizeObserver === "function") {
      const observer = new __doeScope.global.ResizeObserver(() => {
        if (host.isConnected && body.isConnected) (0, __doeFn_fitFormula)(host, body);
      });
      observer.observe(host);
      __doeScope.fitObservers.set(host, observer);
    }
  }
