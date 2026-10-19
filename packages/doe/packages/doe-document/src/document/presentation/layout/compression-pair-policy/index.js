import { compositionPairPolicy as __doeFn_compositionPairPolicy } from '../composition-pair-policy/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2178


export function compressionPairPolicy(
    sourceNode,
    targetNode,
    availableWidth = 0,
    requestedDirection = "auto",
  ) {
    return (0, __doeFn_compositionPairPolicy)(
      sourceNode,
      targetNode,
      availableWidth,
      requestedDirection,
    );
  }
