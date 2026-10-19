import { computedPixelValue as __doeFn_computedPixelValue } from "../../../../../../../doe-canvas/src/measurement/computed-pixel-value/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:9917
import { scope as __doeScope } from "../../../runtime/context/index.js";
import { measureCompressionPressure } from '../../../layout/flow/compression/pressure.js';

export function settledGeometryOverflow(state) {
    if (state.flowCompression?.version === 'local-v4') {
      return measureCompressionPressure(state, __doeScope.DENSITIES[0], {});
    }
    const layout = state.layoutElement;
    if (!layout) return { overflowX: 0, overflowY: 0 };
    const paddingRight = (0, __doeFn_computedPixelValue)(layout, "paddingRight");
    const paddingBottom = (0, __doeFn_computedPixelValue)(layout, "paddingBottom");
    const allowedRight = layout.clientWidth - paddingRight;
    const allowedBottom = layout.clientHeight - paddingBottom;
    let contentRight = 0;
    let contentBottom = 0;
    state.rootShells.forEach((shell) => {
      contentRight = Math.max(contentRight, shell.offsetLeft + shell.offsetWidth);
      contentBottom = Math.max(contentBottom, shell.offsetTop + shell.offsetHeight);
    });
    let componentOverflowX = 0;
    let componentOverflowY = 0;
    state.leafRecords.forEach((record) => {
      const isTransparentTextPrimitive =
        __doeScope.TRANSPARENT_TEXT_COMPONENT_TYPES.has(record.node.type);
      componentOverflowX = Math.max(
        componentOverflowX,
        isTransparentTextPrimitive
          ? 0
          : record.element.scrollWidth - record.element.clientWidth,
        record.content.scrollWidth - record.shell.clientWidth,
      );
      componentOverflowY = Math.max(
        componentOverflowY,
        isTransparentTextPrimitive
          ? 0
          : record.element.scrollHeight - record.element.clientHeight,
        record.content.scrollHeight - record.shell.clientHeight,
      );
    });
    return {
      overflowX: Math.max(
        0,
        contentRight - allowedRight,
        layout.scrollWidth - layout.clientWidth,
        componentOverflowX,
      ),
      overflowY: Math.max(
        0,
        contentBottom - allowedBottom,
        layout.scrollHeight - layout.clientHeight,
        componentOverflowY,
      ),
    };
  }
