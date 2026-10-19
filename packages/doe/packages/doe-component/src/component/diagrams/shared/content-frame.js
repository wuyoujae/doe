/** Trim unused canvas after semantic wrapping, without resizing the artwork. */
export function fitContentFrame(root, geometry, width, offset) {
  const { svg, slots } = geometry, art = svg.getBBox();
  let left = art.x + offset - 2, right = art.x + art.width + offset + 2;
  const scale = root.getBoundingClientRect().width / parseFloat(getComputedStyle(root).width);
  slots.forEach((slot, index) => {
    const copy = root.querySelector(`[data-collection-item-index="${index}"]`);
    const originalLeft = parseFloat(copy.style.left), originalWidth = parseFloat(copy.style.width);
    let textWidth = 0;
    for (const field of copy.querySelectorAll('.doe-diagram__title,.doe-diagram__text')) {
      const range = root.ownerDocument.createRange(); range.selectNodeContents(field);
      textWidth = Math.max(textWidth, range.getBoundingClientRect().width / scale);
    }
    // Two pixels retain fractional glyph/line measurement slack. Existing line
    // breaks remain intact; empty space is not an external compression demand.
    let usedWidth = Math.min(originalWidth, Math.ceil(textWidth + 2));
    const service = root.ownerDocument.defaultView.SemanticTextLayout;
    for (const field of copy.querySelectorAll('.doe-diagram__title,.doe-diagram__text')) {
      if (!field.textContent.trim()) continue;
      const style = getComputedStyle(field), fontPx = parseFloat(style.fontSize);
      const candidate = service.layout(field.dataset.semanticSource || field.textContent, {
        widthPx: usedWidth, fontPx, fontFamily: style.fontFamily, fontWeight: style.fontWeight,
        fontStyle: style.fontStyle, letterSpacingPx: parseFloat(style.letterSpacing) || 0,
        maxLines: Number(field.dataset.semanticMaxLines) || 24, locale: field.dataset.semanticLocale || 'auto', allowScale: false,
      });
      if (field.__doeInlineFormat?.runs.length || candidate.status === 'blocked' || candidate.lines.length > Number(field.dataset.semanticLines || 1)) {
        usedWidth = originalWidth; break;
      }
    }
    const shift = (originalWidth - usedWidth) / (slot.align === 'center' ? 2 : 1);
    const x = originalLeft + (slot.align === 'center' || slot.align === 'right' ? shift : 0);
    Object.assign(copy.style, { left: `${x}px`, width: `${usedWidth}px` });
    left = Math.min(left, x); right = Math.max(right, x + usedWidth);
    const icon = copy.querySelector('.doe-diagram__icon');
    if (icon) {
      const iconLeft = originalLeft + parseFloat(getComputedStyle(icon).left);
      icon.style.left = `${iconLeft - x}px`;
      left = Math.min(left, iconLeft); right = Math.max(right, iconLeft + icon.offsetWidth);
    }
    if (slot.value) {
      left = Math.min(left, slot.value.x + offset); right = Math.max(right, slot.value.x + offset + slot.value.w);
    }
  });
  // Diagrams with callouts on both sides keep their artwork axis centered.
  if (slots.some(slot => slot.expand === 'left') && slots.some(slot => slot.expand === 'right')) {
    const inset = Math.min(left, width - right); left = inset; right = width - inset;
  }
  left = Math.max(0, Math.floor(left)); right = Math.min(width, Math.ceil(right));
  const fittedWidth = right - left;
  root.style.width = `${fittedWidth}px`;
  svg.setAttribute('viewBox', `${left - offset} 0 ${fittedWidth} ${geometry.height}`);
  Object.assign(svg.style, { left: '0px', width: `${fittedWidth}px` });
  for (const child of root.querySelectorAll(':scope > .doe-diagram__copy,:scope > .doe-diagram__value-box'))
    child.style.left = `${parseFloat(child.style.left) - left}px`;
}
