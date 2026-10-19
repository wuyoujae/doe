import { install as installCanvas } from '../../../../packages/doe-canvas/src/surface/canvas/runtime/install/index.js';
import { createPresentationCanvasRenderer } from '../../../../packages/doe-document/src/document/presentation/canvas/adapter/index.js';

export function install(global = window) {
  // Keep the original late lookup of the classic-script engine.
  installCanvas(global, createPresentationCanvasRenderer({
    mount: (...args) => global.SlideEngine.mount(...args),
    sanitizeStaticElement: element => global.SlideEngine.sanitizeStaticElement(element),
  }));
}
