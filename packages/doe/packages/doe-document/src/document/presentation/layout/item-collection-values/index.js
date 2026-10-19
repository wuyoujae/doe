// Origin: public/yrkie-doe/layout-engine/layout-engine.js:4534


export function itemCollectionValues(node, definition) {
    const path = definition.itemCollection?.path || "items";
    const value = String(path)
      .split(".")
      .filter(Boolean)
      .reduce((current, key) => current?.[key], node.props);
    return Array.isArray(value) ? value : null;
  }
