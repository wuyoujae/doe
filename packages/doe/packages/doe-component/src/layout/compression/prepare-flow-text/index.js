/** Flowing text may use the remaining vertical space before typography shrinks. */
export function prepareFlowText(root, availableHeight) {
  for (const field of root.querySelectorAll('[data-semantic-max-lines]')) {
    if (field.namespaceURI !== 'http://www.w3.org/1999/xhtml') continue;
    const style = field.ownerDocument.defaultView.getComputedStyle(field);
    const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
    if (!field.dataset.styleFirstMaxLines) field.dataset.styleFirstMaxLines = field.dataset.semanticMaxLines;
    const original = Number(field.dataset.styleFirstMaxLines) || 2;
    field.dataset.semanticMaxLines = String(Math.max(original, Math.floor(availableHeight / lineHeight)));
  }
}
