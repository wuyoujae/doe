/** Solver metadata is owned by the system, never by the Markdown author. */
export const COMPRESSION_POLICY = Object.freeze({
  version: 'local-v4', maximumDivisor: 3, divisorStep: 0.1,
});

export const unitKey = (id, item = null) => JSON.stringify([id, item]);
export const fieldKey = (id, path) => JSON.stringify([id, path]);

export function normalizeCompression(value) {
  const plan = { version: COMPRESSION_POLICY.version, algorithm: 'geometry-v29', text: {}, textRatio: {}, truncate: {}, factor: {}, height: {}, columns: {}, orientation: {}, timeline: {}, order: [] };
  if (value?.version !== plan.version || value.algorithm !== plan.algorithm) return plan;
  for (const kind of ['text', 'textRatio', 'truncate', 'factor', 'height']) {
    for (const [key, number] of Object.entries(value[kind] || {}).slice(0, 2048)) {
      let parts;
      try { parts = JSON.parse(key); } catch { continue; }
      if (!Array.isArray(parts) || parts.length !== 2 || typeof parts[0] !== 'string') continue;
      if (kind !== 'factor' && (!Array.isArray(parts[1]) || !parts[1].every(p => typeof p === 'string' || Number.isInteger(p)))) continue;
      if (kind === 'factor' && parts[1] !== null) continue;
      if (!Number.isFinite(number)) continue;
      if (kind === 'text' && Number.isInteger(number) && number > 0 && number <= 32) plan.text[key] = number;
      if (kind === 'textRatio' && number > 0 && number < 1) plan.textRatio[key] = number;
      if (kind === 'truncate' && number === 1) plan.truncate[key] = 1;
      if (kind === 'height' && number > 0 && number <= 2160) plan.height[key] = number;
      if (kind === 'factor' && number > 1 && number <= COMPRESSION_POLICY.maximumDivisor) plan.factor[key] = number;
    }
  }
  for (const [id, columns] of Object.entries(value.columns || {}).slice(0, 2048)) {
    if (Number.isInteger(columns) && columns >= 1 && columns <= 12) Object.defineProperty(plan.columns, id, { value: columns, enumerable: true, configurable: true, writable: true });
  }
  for (const [id, orientation] of Object.entries(value.orientation || {}).slice(0, 2048)) {
    if (orientation === 'vertical' || orientation === 'horizontal') Object.defineProperty(plan.orientation, id, { value: orientation, enumerable: true, configurable: true, writable: true });
  }
  for (const [id, stage] of Object.entries(value.timeline || {}).slice(0, 2048)) {
    if (stage === 1 || stage === 2) Object.defineProperty(plan.timeline, id, { value: stage, enumerable: true, configurable: true, writable: true });
  }
  const active = new Set([...Object.keys(plan.factor), ...Object.keys(plan.columns).map(id => unitKey(id)), ...Object.keys(plan.orientation).map(id => unitKey(id)), ...Object.keys(plan.timeline).map(id => unitKey(id)), ...[...Object.keys(plan.text), ...Object.keys(plan.textRatio)].flatMap(key => {
    const [id, path] = JSON.parse(key);
    return path[0] === 'items' && Number.isInteger(path[1]) ? [unitKey(id), unitKey(id, path[1])] : [unitKey(id)];
  })]);
  plan.order = [...new Set((Array.isArray(value.order) ? value.order : []).filter(key => typeof key === 'string' && active.has(key)))].slice(0, 2048);
  if (value.inputs && typeof value.inputs === 'object') {
    plan.inputs = Object.fromEntries(Object.entries(value.inputs).slice(0,2049).filter(([key, stamp])=> {
      if (typeof stamp !== 'string' || !/^[a-f0-9]{16}$/.test(stamp)) return false;
      if (key === '$context') return true;
      try { const parts=JSON.parse(key); return Array.isArray(parts) && parts.length===2 && typeof parts[0]==='string' && Array.isArray(parts[1]); } catch { return false; }
    }));
  }
  return plan;
}

/** Smallest legal divisor that fits BOTH axes; round toward safety. */
export function fittingDivisor(width, height, availableWidth, availableHeight) {
  const ratio = Math.max(1, width > 0 ? width / availableWidth : 1, height > 0 ? height / availableHeight : 1);
  if (!Number.isFinite(ratio) || ratio > COMPRESSION_POLICY.maximumDivisor + 1e-9) return null;
  return Math.ceil(ratio * 10 - 1e-9) / 10;
}

/** Parent and child factors share one physical limit, not one limit per node. */
export function validNestedFactors(nodes, factors, inherited = 1) {
  return (nodes || []).every(node => {
    const factor = inherited * (factors[unitKey(node.id)] || 1);
    return factor <= COMPRESSION_POLICY.maximumDivisor + 1e-9 && validNestedFactors(node.children, factors, factor);
  });
}

/** Theme enums, in descending size; never grow an authored smaller value. */
export function fontLadder(basePt, styles, sizeMode = 'default', minimumPt = 0) {
  const small = styles.small?.sizes || {};
  const floor = Math.min(basePt, Math.max(Number(small[sizeMode] ?? small.default) || 10.5,
    Number.isFinite(minimumPt) && minimumPt > 0 ? minimumPt : 0));
  const values = Object.values(styles).map(style => style.sizes?.[sizeMode] ?? style.sizes?.default);
  return [basePt, ...[...new Set([...values.map(Number), floor])]
    .filter(value => value < basePt - 0.05 && value >= floor).sort((a, b) => b - a)];
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function leafNodes(nodes, result = new Map()) {
  for (const node of nodes || []) {
    result.set(node.id, node);
    if (node.children) leafNodes(node.children, result);
  }
  return result;
}

/** Capture the cause before DOM rebuilding changes selection or item identity. */
export function compressionChanges(before, after) {
  const old = leafNodes(before), current = leafNodes(after), changes = [];
  function paths(previous, next, prefix = [], result = []) {
    if (same(previous, next)) return result;
    if (next && typeof next === 'object' && previous && typeof previous === 'object') {
      for (const key of new Set([...Object.keys(previous), ...Object.keys(next)])) paths(previous[key], next[key], [...prefix, Array.isArray(next) ? Number(key) : key], result);
    } else result.push(prefix);
    return result;
  }
  for (const [id, node] of current) {
    const previous = old.get(id);
    if (node.children) {
      if (previous && !same(node.layout, previous.layout)) changes.push({ id, paths: null });
      continue;
    }
    if (!previous) { changes.push({ id, paths: null }); continue; }
    const changed = paths(previous.props, node.props);
    if (changed.length || !same(previous.textOverrides, node.textOverrides) || !same(previous.layout, node.layout)) {
      changes.push({ id, paths: changed.length ? changed : null });
    }
  }
  // A structural edit can change a row's capacity without changing its text.
  if (!changes.length) {
    for (const [id, node] of current) {
      const previous = old.get(id);
      if (node.children && (!previous || !same(node.layout, previous.layout) || !same(node.children.map(n => n.id), previous.children?.map(n => n.id)))) {
        const descendants = leafNodes(node.children);
        for (const child of descendants.values()) if (!child.children) changes.push({ id: child.id, paths: null });
      }
    }
  }
  return changes;
}
