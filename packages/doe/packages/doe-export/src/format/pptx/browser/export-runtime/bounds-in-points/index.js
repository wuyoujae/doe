import canvas from '../../../../../../../doe-document/src/document/presentation/canvas/base-attributes/index.json' with { type: 'json' };
// Origin: public/yrkie-doe/export-runtime/export-runtime.js:192


export function boundsInPoints(element, slideRect) {
    const rect = element?.getBoundingClientRect?.();
    if (!rect || rect.width <= 0 || rect.height <= 0 || slideRect.width <= 0 || slideRect.height <= 0) {
      return null;
    }
    return {
      left: ((rect.left - slideRect.left) / slideRect.width) * canvas.width,
      top: ((rect.top - slideRect.top) / slideRect.height) * canvas.height,
      width: (rect.width / slideRect.width) * canvas.width,
      height: (rect.height / slideRect.height) * canvas.height,
    };
  }
