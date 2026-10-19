import { normalizeCompression, unitKey, fieldKey } from '../../layout/flow/compression/policy.js';
import { reconcileCompression } from '../../layout/flow/compression/reconcile.js';

/** Item transfers carry paths, not guessed text equality or positional indices. */
export function groupingCompression(value, before, after, transfers, collapsed = []) {
  const old = normalizeCompression(value), next = reconcileCompression(value, before, after);
  const destinations = new Set(transfers.map(entry => entry.destination.blockId));
  for (const kind of ['text', 'textRatio', 'truncate', 'height']) {
    for (const key of Object.keys(next[kind])) {
      const [id, path] = JSON.parse(key);
      if (destinations.has(id) && ['items', 'content'].includes(path[0])) delete next[kind][key];
    }
    for (const [key, amount] of Object.entries(old[kind])) {
      const [id, path] = JSON.parse(key);
      const transfer = transfers.find(entry => entry.blockId === id && entry.path.every((part, index) => path[index] === part));
      if (!transfer) continue;
      let rest = path.slice(transfer.path.length);
      if (transfer.scalar) rest = ['text', ...rest];
      if (transfer.fields && !transfer.fields[rest[0]]) continue;
      // Combined fields get a new content budget; a title's old truncation or
      // height must not become the entire destination paragraph's constraint.
      if (transfer.offsets && Object.keys(transfer.offsets).length) continue;
      if (transfer.fields) rest[0] = transfer.fields[rest[0]];
      next[kind][fieldKey(transfer.destination.blockId, [...transfer.destination.path, ...rest])] = amount;
    }
  }
  const oldIds = new Set();
  const collect = nodes => nodes.forEach(node => { oldIds.add(node.id); if (node.children) collect(node.children); });
  collect(before);
  for (const transfer of transfers) {
    if (!oldIds.has(transfer.destination.blockId)) {
      const factor = old.factor[unitKey(transfer.blockId, null)];
      if (factor) next.factor[unitKey(transfer.destination.blockId, null)] = factor;
    }
  }
  for (const { id, childId } of [...collapsed].reverse()) {
    const factor = next.factor[unitKey(id)] || old.factor[unitKey(id)];
    if (!factor) continue;
    const destination = unitKey(childId);
    next.factor[destination] = Math.min(3, Math.ceil(factor * (next.factor[destination] || old.factor[destination] || 1) * 10 - 1e-9) / 10);
    delete next.factor[unitKey(id)];
  }
  return next;
}
