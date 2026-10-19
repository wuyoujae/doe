import { fields as __doeFn_fields } from '../fields/index.js';
import { fieldFormat, renderInlineFormat } from '../../../../../doe-core/src/text/inline-format/index.js';
// Origin: public/yrkie-doe/layout-engine/text-fields.js:104
import { scope as __doeScope } from "../runtime/context/index.js";

export function bind(root, node, allowEditing = !root.closest('[data-canvas-mode="present"], [data-canvas-mode="static"]')) {
    if (!allowEditing) for (const target of [root, ...root.querySelectorAll('[data-doe-text-path]')]) {
      target.removeAttribute('data-doe-text-path');
      target.classList.remove('doe-text-field', 'doe-text-field--inline');
      if (target.__doeTextField) target.style.removeProperty('pointer-events');
      delete target.__doeTextField;
    }
    const editable = allowEditing && __doeScope.global.document.documentElement.dataset.doeDirectTextEdit === "true";
    for (const field of (0, __doeFn_fields)(root, node)) {
      let target = field.target;
      if (target.isContentEditable) continue;
      const value = (0, __doeScope.read)(node.props, field.path);
      if (value != null && typeof value === "object" && !Array.isArray(value)) continue;
      // Keep glyphs/swatch/icon siblings outside the editable text span.
      if (target.namespaceURI !== "http://www.w3.org/2000/svg" && !field.source) {
        if (target.querySelector("svg, i, [class$='__swatch'], [class$='__legend-line'], [class$='__legend-swatch']")) {
          let span = target.querySelector(":scope > .doe-text-field__copy");
          if (!span) {
            span = document.createElement("span");
            span.className = "doe-text-field__copy";
            for (const child of [...target.childNodes]) if (child.nodeType === 3) span.append(child);
            target.append(span);
          }
          target = span;
        }
        if (target.dataset.semanticWrap) {
          target.dataset.semanticRender = "plaintext";
        }
        // Display wrapping must not depend on whether this surface permits editing.
        target.classList.add("doe-text-content");
      }
      if (!field.source && !field.numeric && target.namespaceURI === 'http://www.w3.org/1999/xhtml') {
        const format=fieldFormat(node,field.path);
        if(format){target.__doeInlineFormat=format;renderInlineFormat(target,format.text,format.runs);}
        else {delete target.__doeInlineFormat;target.classList.remove('doe-formatted-text');}
      }
      if (!editable) continue;
      if (target.namespaceURI !== "http://www.w3.org/2000/svg" && !field.source) {
        target.classList.add("doe-text-field");
        if (field.inline) target.classList.add("doe-text-field--inline");
      }
      target.dataset.doeTextPath = JSON.stringify(field.path);
      target.__doeTextField = { ...field, target, lines: Array.isArray(value), numeric: field.numeric || typeof value === "number" };
      // Native chart roots often disable hit testing for labels.
      target.style.pointerEvents = "auto";
    }
  }
