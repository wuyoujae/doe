import { mediaObjectFit as __doeFn_mediaObjectFit } from '../media-object-fit/index.js';
// Origin: public/yrkie-doe/layout-engine/components.js:219


export function setResolvedMediaFit(root, fit) {
    root.dataset.mediaFit = fit;
    const image = root.querySelector?.(".component-media__image");
    if (image) image.style.objectFit = (0, __doeFn_mediaObjectFit)(fit);
  }
