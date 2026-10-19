import { normalizeCompression, unitKey, fieldKey } from './policy.js';

const key = value => JSON.stringify(value);
function nodes(list, result = new Map()) {
  for (const node of list || []) {
    result.set(node.id, node);
    if (node.children) nodes(node.children, result);
  }
  return result;
}

/** Match surviving items first; remaining same-position entries are text edits. */
export function itemIndexMap(before, after) {
  const result = new Map(), used = new Set();
  before.forEach((item, index) => {
    if (!item?.id) return;
    const match = after.findIndex((next, target) => !used.has(target) && next?.id === item.id);
    if (match >= 0) { result.set(index, match); used.add(match); }
  });
  before.forEach((item, index) => {
    if (result.has(index)) return;
    const match = after.findIndex((next, target) => !used.has(target) && key(item) === key(next));
    if (match >= 0) { result.set(index, match); used.add(match); }
  });
  if (before.length === after.length) before.forEach((_, index) => {
    if (!result.has(index) && !used.has(index)) { result.set(index, index); used.add(index); }
  });
  return result;
}

/** Index-based component contracts must not transfer compression to a new item. */
export function reconcileCompression(value, before, after) {
  const plan = normalizeCompression(value), next = normalizeCompression(null);
  const oldNodes = nodes(before), newNodes = nodes(after);
  for (const kind of ['text', 'textRatio', 'truncate', 'factor', 'height']) for (const [entry, number] of Object.entries(plan[kind])) {
    const [id, target] = JSON.parse(entry), oldNode = oldNodes.get(id), node = newNodes.get(id);
    if (!node || node.type !== oldNode?.type) continue;
    if (kind === 'factor') {
      const index = target === null ? null : itemIndexMap(oldNode.props.items || [], node.props.items || []).get(target);
      if (index !== undefined) {
        next[kind][unitKey(id, index)] = number;
      }
      continue;
    }
    const path = [...target];
    let old = oldNode.props, current = node.props, valid = true;
    for (let i = 0; i < path.length; i++) {
      const part = target[i];
      if (typeof part === 'number' && Array.isArray(old) && Array.isArray(current)) {
        const mapped = itemIndexMap(old, current).get(part);
        if (mapped === undefined) { valid = false; break; }
        path[i] = mapped;
      }
      old = old?.[part]; current = current?.[path[i]];
    }
    if (valid) next[kind][fieldKey(id, path)] = number;
  }
  for (const [id, columns] of Object.entries(plan.columns)) {
    if (newNodes.has(id) && newNodes.get(id)?.type === oldNodes.get(id)?.type) next.columns[id] = columns;
  }
  for (const [id, orientation] of Object.entries(plan.orientation)) {
    const node = newNodes.get(id), old = oldNodes.get(id);
    if (node && old && node.type === old.type && node.props?.presentation === old.props?.presentation && node.props?.orientation === old.props?.orientation) next.orientation[id] = orientation;
  }
  for (const [id, stage] of Object.entries(plan.timeline)) {
    const node = newNodes.get(id), old = oldNodes.get(id);
    if (node && old && node.type === old.type && ['presentation', 'orientation', 'staggered', 'connectors'].every(prop => node.props?.[prop] === old.props?.[prop])) next.timeline[id] = stage;
  }
  next.order = plan.order.flatMap(entry => {
    const [id, item] = JSON.parse(entry), old = oldNodes.get(id), node = newNodes.get(id);
    if (!node || node.type !== old?.type) return [];
    const index = item === null ? null : itemIndexMap(old.props.items || [], node.props.items || []).get(item);
    return index === undefined ? [] : [unitKey(id, index)];
  });
  return next;
}
