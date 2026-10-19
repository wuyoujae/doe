export function showDropIndicator(target, placement) {
  const edge = { before: 'top', after: 'bottom' }[placement] || placement;
  if (!['top', 'bottom', 'left', 'right'].includes(edge)) return;
  let line = target.querySelector(':scope > .doe-drop-indicator');
  if (!line) {
    line = target.ownerDocument.createElement('span');
    line.className = 'doe-drop-indicator';
    line.dataset.slideExportIgnore = 'true';
    line.setAttribute('aria-hidden', 'true');
    target.append(line);
  }
  line.dataset.edge = edge;
  target.classList.add('has-insertion-indicator');
}
