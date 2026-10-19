import { isElement as __doeFn_isElement } from '../is-element/index.js';
import { applyElement as __doeFn_applyElement } from '../apply-element/index.js';
// Origin: public/yrkie-doe/core/semantic-text-layout.js:734


export function applyTree(root, options = {}) {
    if (!(0, __doeFn_isElement)(root)) return [];
    const results = [];
    root.querySelectorAll("[data-semantic-wrap]").forEach((element) => {
      if (element.dataset.semanticOwner && options.includeOwned !== true) return;
      const result = (0, __doeFn_applyElement)(element, options);
      if (result) results.push({ element, result });
    });
    return results;
  }
