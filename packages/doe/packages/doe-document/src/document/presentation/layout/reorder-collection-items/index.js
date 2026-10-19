// Origin: public/yrkie-doe/layout-engine/layout-engine.js:5803


export function reorderCollectionItems(values, sourceIndex, targetIndex, intent = {}) {
    if (
      !Array.isArray(values) ||
      sourceIndex < 0 ||
      sourceIndex >= values.length ||
      targetIndex < 0 ||
      targetIndex >= values.length
    ) {
      return null;
    }
    const next = [...values];
    const [moved] = next.splice(sourceIndex, 1);
    let insertionIndex = targetIndex;
    if (!intent.fixedLayout) {
      if (sourceIndex < targetIndex) insertionIndex -= 1;
      if (!intent.before) insertionIndex += 1;
    }
    insertionIndex = Math.max(0, Math.min(next.length, insertionIndex));
    next.splice(insertionIndex, 0, moved);
    return next;
  }
