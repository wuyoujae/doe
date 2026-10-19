import { petalAngles, petalGeometry } from './geometry/index.js';
import { art as __doeFn_art } from '../art/index.js';
import { number as __doeFn_number } from '../number/index.js';
// Origin: public/yrkie-doe/components/shape-contents/shape-contents.js:37
import { scope as __doeScope } from "../runtime/context/index.js";

export function petals(count = 3) {
      if (count === 3) {
        const svg = (0, __doeFn_art)(340, 360);
        const paths = [
          "M166 180 126 249 C89 301 19 286 9 223 C-5 144 27 87 83 94 C119 98 137 130 166 180Z",
          "M175 174 141 113 C98 37 156 -20 218 7 C290 34 328 69 326 116 C324 159 299 174 251 174Z",
          "M175 185 252 185 C303 185 329 215 326 259 C322 305 278 342 216 354 C155 369 113 328 141 261Z",
        ];
        paths.forEach((d, index) => {
          svg.append((0, __doeScope.svgNode)("path", { d, class: "shape-contents__shape" }));
          (0, __doeFn_number)(svg, ...[[81, 184], [227, 94], [227, 273]][index], index);
        });
        return svg;
      }
      const svg = (0, __doeFn_art)(340, 360), { path, labelRadius } = petalGeometry(count);
      petalAngles(count).forEach((angle, index) => {
        svg.append((0, __doeScope.svgNode)("path", { d: path, transform: `translate(170 180) rotate(${angle * 180 / Math.PI})`, class: "shape-contents__shape" }));
        (0, __doeFn_number)(svg, 170 + labelRadius * Math.cos(angle), 180 + labelRadius * Math.sin(angle), index);
      });
      return svg;
}
