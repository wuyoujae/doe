import value0 from '../../canvas/base-attributes/index.json' with { type: 'json' };
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:4
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.CANVAS = Object.freeze(value0);
if (value0.renderWidth !== 1280 || value0.renderHeight !== 720) {
  const style = __doeScope.global.document.documentElement.style;
  style.setProperty('--doe-canvas-width', `${value0.renderWidth}px`);
  style.setProperty('--doe-canvas-height', `${value0.renderHeight}px`);
  style.setProperty('--doe-canvas-ratio', `${value0.renderWidth} / ${value0.renderHeight}`);
}
}
