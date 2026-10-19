import { compareStructureFirstAttempts as __doeFn_compareStructureFirstAttempts } from '../compare-structure-first-attempts/index.js';
import { structuralDirectionSignature as __doeFn_structuralDirectionSignature } from '../structural-direction-signature/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:5110


export function diversePromisingStructures(attempts, limit = 2) {
    const sorted = [...attempts].sort(__doeFn_compareStructureFirstAttempts);
    const selected = [];
    const seenDirections = new Set();
    for (const attempt of sorted) {
      const signature = (0, __doeFn_structuralDirectionSignature)(attempt);
      if (seenDirections.has(signature)) continue;
      seenDirections.add(signature);
      selected.push(attempt);
      if (selected.length >= limit) return selected;
    }
    for (const attempt of sorted) {
      if (selected.includes(attempt)) continue;
      selected.push(attempt);
      if (selected.length >= limit) break;
    }
    return selected;
  }
