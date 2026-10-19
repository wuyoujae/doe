/** Couple a semantic item's title/body, including nested collection paths.
 * Native chart labels, values and page headings keep independent identities. */
export function itemTextKey(id, path) {
  if (!['title', 'text', 'description', 'body', 'subtitle'].includes(path.at(-1))) return null;
  const index = path.findLastIndex(part => Number.isInteger(part));
  return JSON.stringify([id, index < 0 ? path.slice(0, -1) : path.slice(0, index + 1)]);
}

export function itemTextPeers(fields, field) {
  if (!field) return [];
  const group = itemTextKey(field.id, field.path);
  return group ? fields.filter(peer => itemTextKey(peer.id, peer.path) === group) : [field];
}

/** Continuous fitting shares one ratio across a component's collection copy.
 * Page headings and native chart labels are separate layout responsibilities. */
export function continuousTextPeers(fields, field) {
  if (!field) return [];
  const collection = peer => peer.path[0] !== '$label' && peer.path.some(Number.isInteger);
  if (!collection(field)) return itemTextPeers(fields, field);
  const copy = Boolean(itemTextKey(field.id, field.path));
  return fields.filter(peer => peer.id === field.id && collection(peer)
    && (copy ? Boolean(itemTextKey(peer.id, peer.path))
      : !itemTextKey(peer.id, peer.path) && peer.path.at(-1) === field.path.at(-1)));
}

export function stepItemText(plan, peers, direction) {
  let changed = false;
  const step = Math.max(0, ...peers.map(field => plan.text[field.key] || 0)) + direction;
  for (const field of peers) {
    const previous = plan.text[field.key] || 0;
    const next = Math.max(0, Math.min(field.ladder.length - 1, step));
    if (next) plan.text[field.key] = next;
    else delete plan.text[field.key];
    changed ||= next !== previous;
  }
  return changed;
}
