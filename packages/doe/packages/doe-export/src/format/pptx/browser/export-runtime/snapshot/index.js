import { stripEditorState as __doeFn_stripEditorState } from '../strip-editor-state/index.js';
import { styleSheets as __doeFn_styleSheets } from '../style-sheets/index.js';
import { nativeComponents as __doeFn_nativeComponents } from '../native-components/index.js';
import { scope } from '../../../../../runtime/context/index.js';
// Origin: public/yrkie-doe/export-runtime/export-runtime.js:256


export function snapshot(semanticSlide, slideElement) {
    if (scope.activeResult?.element !== slideElement || !slideElement?.isConnected ||
        getComputedStyle(slideElement).opacity === '0') {
      throw new Error('Schema slide is not settled; refusing an incomplete export snapshot.');
    }
    return {
      rootHtml: (0, __doeFn_stripEditorState)(slideElement).outerHTML,
      styleSheets: (0, __doeFn_styleSheets)(),
      nativeComponents: (0, __doeFn_nativeComponents)(semanticSlide, slideElement),
    };
  }

export async function captureSnapshot(slideId) {
    const result = scope.activeResult;
    if (!result || String(result.slide?.id) !== String(slideId)) {
      throw new Error('Schema slide mount does not match the requested snapshot.');
    }
    const { element } = await result.whenSettled();
    if (scope.activeResult !== result) throw new Error('Schema slide changed during snapshot capture.');
    if (result.report?.solverVersion === 'flow-local-v4' && !result.report.fits) {
      throw new Error(result.report.overflowLabel || 'DOE content does not fit; export refused.');
    }
    return snapshot(result.slide, element);
  }

export async function captureInspection(slideId) {
    const result = scope.activeResult;
    if (!result || String(result.slide?.id) !== String(slideId)) throw new Error('Inspection page changed.');
    const { element } = await result.whenSettled();
    if (scope.activeResult !== result || !element?.isConnected || getComputedStyle(element).opacity === '0') {
      throw new Error('Inspection canvas is not settled.');
    }
    return { report: result.report, diagnostics: [...(result.compilerDiagnostics || []), ...(result.runtimeDiagnostics || [])] };
  }
