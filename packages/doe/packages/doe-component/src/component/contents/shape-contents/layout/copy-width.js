/** Allocate the full free horizontal interval outside artwork and peer labels. */
export function expandRadialCopy(root, width, gap) {
  const art = root.querySelector('.shape-contents__art');
  const artWidth = parseFloat(art.style.width), artTop = parseFloat(art.style.top);
  const semi = root.dataset.variant === 'semicircle';
  const cx = width / 2, cy = artTop + artWidth * (semi ? .5 : 180 / 340);
  const radius = artWidth * (semi ? 300 / 640 : 164 / 340) + gap;
  const boxes = [...root.querySelectorAll('.shape-contents__copy')].map(element => ({
    element, x: parseFloat(element.style.left), y: parseFloat(element.style.top),
    width: parseFloat(element.style.width), height: parseFloat(element.style.height),
  }));
  for (const box of boxes) {
    const anchor = box.x + box.width / 2;
    let left = 0, right = width;
    // Petals include asymmetric Bezier artwork. Preserve its full bounding box;
    // circular variants can also lend their unused outer corners to the copy.
    if (root.dataset.variant === 'petals') {
      if (box.y < artTop + artWidth * 360 / 340 + gap && box.y + box.height > artTop - gap) {
        if (anchor < cx) right = cx - artWidth / 2 - gap;
        else left = cx + artWidth / 2 + gap;
      }
    } else {
      const distanceY = Math.max(box.y - cy, cy - box.y - box.height, 0);
      if (distanceY < radius - .001 && (!semi || box.y < cy + gap)) {
        const half = Math.sqrt(radius * radius - distanceY * distanceY);
        if (anchor < cx) right = cx - half;
        else left = cx + half;
      }
    }
    for (const peer of boxes) {
      if (peer === box || box.y + box.height + gap <= peer.y + .01 || peer.y + peer.height + gap <= box.y + .01) continue;
      const other = peer.x + peer.width / 2, boundary = (anchor + other) / 2;
      if (other < anchor) left = Math.max(left, boundary + gap / 2);
      else right = Math.min(right, boundary - gap / 2);
    }
    // Upper labels stay attached to their sectors. A central label must not
    // turn into a full-slide banner just because the space above the arc is free.
    const central = semi && Math.abs(anchor - cx) < .001;
    if (central || semi && boxes.length > 2 && (box === boxes[boxes.length / 2 - 1] || box === boxes[boxes.length / 2])) {
      const half = Math.max(0, Math.min(anchor - left, right - anchor, central ? artWidth / 2 : Infinity));
      left = anchor - half; right = anchor + half;
    }
    box.element.style.left = `${left}px`;
    box.element.style.width = `${Math.max(0, right - left)}px`;
  }
}
