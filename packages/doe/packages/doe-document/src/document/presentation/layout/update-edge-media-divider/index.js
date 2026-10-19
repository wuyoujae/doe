import { edgeMediaAxis as __doeFn_edgeMediaAxis } from '../edge-media-axis/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2503


export function updateEdgeMediaDivider(record, ratio, position) {
    if (!record?.divider) return;
    const divider = record.divider;
    const horizontal = (0, __doeFn_edgeMediaAxis)(position) === "row";
    const boundary = ["left", "top"].includes(position)
      ? ratio
      : 1 - ratio;
    divider.dataset.orientation = horizontal ? "vertical" : "horizontal";
    divider.dataset.mediaPosition = position;
    divider.setAttribute(
      "aria-orientation",
      horizontal ? "vertical" : "horizontal",
    );
    divider.style.left = horizontal ? `${boundary * 100}%` : "0";
    divider.style.top = horizontal ? "0" : `${boundary * 100}%`;
    divider.style.right = horizontal ? "auto" : "0";
    divider.style.bottom = horizontal ? "0" : "auto";
    const percentage = Math.round(ratio * 100);
    divider.setAttribute("aria-valuenow", String(percentage));
    divider.setAttribute("aria-valuetext", `图片占比 ${percentage}%`);
    const readout = divider.querySelector(".edge-media-divider__readout");
    if (readout) readout.textContent = `图片 ${percentage}%`;
    const toolbarReadout = record.shell.querySelector(
      ".edge-media-ratio-readout",
    );
    if (toolbarReadout) toolbarReadout.textContent = `图片 ${percentage}%`;
  }
