// Origin: public/yrkie-doe/layout-engine/layout-engine.js:6277


export function setEdgeDividerLimit(divider, label = "") {
    divider.classList.toggle("is-limited", Boolean(label));
    if (label) divider.dataset.limitLabel = label;
    else delete divider.dataset.limitLabel;
    const status = divider.querySelector(".edge-media-divider__status");
    if (status) status.textContent = label;
  }
