import { semanticLeafCount as __doeFn_semanticLeafCount } from '../semantic-leaf-count/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:1060


export function chunkBySemanticLeafCount(children, maximum) {
    const chunks = [];
    let current = [];
    let currentCount = 0;
    (children || []).forEach((child) => {
      const childCount = Math.max(1, (0, __doeFn_semanticLeafCount)(child));
      if (current.length && currentCount + childCount > maximum) {
        chunks.push(current);
        current = [];
        currentCount = 0;
      }
      // Explicit local clusters are atomic authoring units. If a single
      // cluster exceeds the collection cap, retain it as its own chunk rather
      // than silently destroying the user's nested structure.
      current.push(child);
      currentCount += childCount;
      if (currentCount >= maximum) {
        chunks.push(current);
        current = [];
        currentCount = 0;
      }
    });
    if (current.length) chunks.push(current);
    return chunks;
  }
