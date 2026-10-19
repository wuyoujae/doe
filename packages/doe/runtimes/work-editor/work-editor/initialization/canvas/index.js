import canvas from '../../../../../packages/doe-document/src/document/presentation/canvas/base-attributes/index.json' with { type: 'json' };
// Origin: public/yrkie-doe/work-editor/work-editor.js:15
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
__doeScope.CANVAS = Object.freeze({ width: canvas.renderWidth, height: canvas.renderHeight });
if (canvas.renderWidth !== 1280 || canvas.renderHeight !== 720) {
  const style = __doeScope.global.document.documentElement.style;
  const ratio = canvas.renderWidth / canvas.renderHeight;
  for (const [name, width] of [['default', 154], ['mobile', 116]]) {
    const portraitWidth = width * 9 / 16 * ratio;
    style.setProperty(`--doe-thumb-${name}-width`, `${portraitWidth}px`);
    style.setProperty(`--doe-thumb-${name}-scale`, String(portraitWidth / canvas.renderWidth));
  }
  style.setProperty('--doe-thumb-focus-scale', String(140 / canvas.renderWidth));
}
}
