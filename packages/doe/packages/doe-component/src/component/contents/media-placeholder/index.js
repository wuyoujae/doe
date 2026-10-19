/** An empty media slot is geometry, never a fake icon or broken image URL. */
export function paintEmptyIcon(box) {
  if (box.dataset.emptyMedia === 'icon') return;
  box.dataset.emptyMedia = 'icon';
  const svg = box.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.5'); svg.setAttribute('aria-hidden', 'true');
  for (const d of ['M4 4h16v16H4z', 'M4 16l5-5 4 4 3-3 4 4', 'M15 8h2']) {
    const path = box.ownerDocument.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', d); svg.append(path);
  }
  box.replaceChildren(svg);
}

export function emptyImage(document) {
  const box = document.createElement('figure');
  box.className = 'component-media base-media__image';
  box.dataset.emptyMedia = 'image';
  return box;
}
