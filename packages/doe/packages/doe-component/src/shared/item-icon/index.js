const NS = 'http://www.w3.org/2000/svg';
const FALLBACKS = {
  CircleDot: [['circle', { cx: 12, cy: 12, r: 10 }], ['circle', { cx: 12, cy: 12, r: 1 }]],
  ArrowRight: [['path', { d: 'M5 12h14m-7-7 7 7-7 7' }]],
  RotateCw: [['path', { d: 'M21 7v5h-5M20.5 12a8.5 8.5 0 1 0-2.6 6.1' }]],
  Layers: [['path', { d: 'm12 3 10 6-10 6L2 9l10-6ZM2 15l10 6 10-6M2 12l10 6 10-6' }]],
  Droplet: [['path', { d: 'M12 3c-2 4-7 7-7 11a7 7 0 0 0 14 0c0-4-5-7-7-11Z' }]],
  CircleHelp: [['circle', { cx: 12, cy: 12, r: 10 }], ['path', { d: 'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01' }]],
  Link2: [['path', { d: 'M9 7H7a5 5 0 0 0 0 10h2m6-10h2a5 5 0 0 1 0 10h-2M8 12h8' }]],
};
const pascal = value => String(value || '').replace(/(^|[-_\s]+)(\w)/g, (_, _separator, letter) => letter.toUpperCase());
const kebab = value => value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/** Runtime fallback is visual only; the author's field remains unchanged. */
export function itemIcon(document, name, fallback = 'CircleDot') {
  const lucide = document.defaultView?.lucide || globalThis.lucide;
  const requested = pascal(name), defaultName = FALLBACKS[fallback] ? fallback : 'CircleDot';
  const actual = (lucide?.icons?.[requested] || lucide?.[requested]) ? requested : defaultName;
  const data = lucide?.icons?.[actual] || lucide?.[actual];
  let svg;
  if (data && typeof lucide.createElement === 'function') svg = lucide.createElement(data);
  else {
    svg = document.createElementNS(NS, 'svg');
    for (const [tag, attrs] of FALLBACKS[defaultName]) {
      const child = document.createElementNS(NS, tag);
      for (const [key, value] of Object.entries(attrs)) child.setAttribute(key, String(value));
      svg.append(child);
    }
  }
  for (const [key, value] of Object.entries({ viewBox: '0 0 24 24', width: 24, height: 24, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', 'data-lucide': kebab(actual) })) svg.setAttribute(key, String(value));
  return svg;
}

export function svgItemIcon(parent, x, y, index, name, fallback, className, size = 36) {
  const marker = parent.ownerDocument.createElementNS(NS, 'g');
  marker.setAttribute('class', className);
  marker.dataset.itemIconIndex = String(index);
  marker.setAttribute('transform', `translate(${x} ${y})`);
  const icon = itemIcon(parent.ownerDocument, name, fallback);
  for (const [key, value] of Object.entries({ x: -size / 2, y: -size / 2, width: size, height: size })) icon.setAttribute(key, String(value));
  marker.append(icon); parent.append(marker); return marker;
}

export function itemIconFields(root) {
  return [...root.querySelectorAll('[data-item-icon-index]')].map(marker => ({ target: marker.querySelector('svg'), path: ['items', Number(marker.dataset.itemIconIndex), 'icon'], label: '图标', required: false }));
}

export function paintItemIcons(root, items, fallback) {
  root.querySelectorAll('[data-item-icon-index]').forEach(marker => {
    const previous = marker.querySelector('svg');
    const icon = itemIcon(root.ownerDocument, items[Number(marker.dataset.itemIconIndex)]?.icon, fallback);
    for (const key of ['x', 'y', 'width', 'height']) if (previous?.hasAttribute(key)) icon.setAttribute(key, previous.getAttribute(key));
    marker.replaceChildren(icon);
  });
}
