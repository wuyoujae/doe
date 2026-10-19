function edgeAt(rect, x, y, previous) {
  const distances = { left: Math.abs(x - rect.left), right: Math.abs(x - rect.right), top: Math.abs(y - rect.top), bottom: Math.abs(y - rect.bottom) };
  const nearest = Object.keys(distances).sort((a, b) => distances[a] - distances[b])[0];
  return previous && distances[previous] <= distances[nearest] + 4 ? previous : nearest;
}
const inside = (r, x, y, extra = 0) => x >= r.left - extra && x <= r.right + extra && y >= r.top - extra && y <= r.bottom + extra;

/** Resolve a visible boundary, not an inferred DOM/schema index. */
export function groupingHit(slide, x, y, previous) {
  if (!inside(slide.getBoundingClientRect(), x, y)) return null;
  const shells = [...slide.querySelectorAll('.block-shell')].filter(shell => inside(shell.getBoundingClientRect(), x, y, 6));
  if (!shells.length) return null;
  // An ancestor's outside edge is an explicit detach/group target. Its interior
  // still belongs to the child under the pointer, including locked collections.
  const boundary = shells.find(shell => !inside(shell.getBoundingClientRect(), x, y)) || [...shells].reverse().find(shell => {
    const r = shell.getBoundingClientRect(), edge = edgeAt(r, x, y);
    return Math.abs(({ left: r.left - x, right: r.right - x, top: r.top - y, bottom: r.bottom - y })[edge]) <= 6;
  });
  const hit = slide.ownerDocument.elementFromPoint(x, y);
  let surface = boundary || hit?.closest('[data-item-owner-id]') || hit?.closest('.block-shell') || shells.at(-1);
  if (!slide.contains(surface)) return null;
  const reference = surface.dataset.itemOwnerId
    ? { blockId: surface.dataset.itemOwnerId, index: Number(surface.dataset.collectionItemIndex), ...(surface.dataset.itemSelectionKey?.startsWith('id:') ? { itemId: surface.dataset.itemSelectionKey.slice(3) } : {}) }
    : { blockId: surface.dataset.blockId };
  if (!reference.blockId) return null;
  const edge = edgeAt(surface.getBoundingClientRect(), x, y, previous?.surface === surface ? previous.edge : null);
  return { surface, reference, edge };
}
