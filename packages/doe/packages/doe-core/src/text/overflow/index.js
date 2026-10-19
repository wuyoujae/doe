import { parseTerms } from '../parse-terms/index.js';

/** Display projection only: author text and formatting stay in the source model. */
export function restoreTextOverflow(element) {
  const saved = element.__doeTextOverflow;
  if (!saved) return;
  element.replaceChildren(...saved.children.map(node => node.cloneNode(true)));
  element.__semanticProjection = saved.projection;
  if (saved.tabIndex === null) element.removeAttribute('tabindex');
  else element.setAttribute('tabindex', saved.tabIndex);
  delete element.__doeTextOverflow;
  delete element.dataset.flowTruncated;
}

export function truncateText(element, height) {
  if (element.dataset.semanticEditing === 'true') return false;
  restoreTextOverflow(element);
  const children = [...element.childNodes].map(node => node.cloneNode(true));
  const projection = element.__semanticProjection;
  const fullText = element.textContent;
  const segments = [...new Intl.Segmenter(undefined, {granularity:'grapheme'}).segment(fullText)];
  // Plaintext CSS can wrap a token which semantic layout cannot break. More
  // vertical room does not make that projection valid; every ellipsis trial
  // must fit both the semantic line rules and the measured text box.
  let semanticOptions;
  const semanticLayout = element.ownerDocument.defaultView?.SemanticTextLayout?.layout;
  if (element.dataset.semanticRender === 'plaintext' && element.dataset.semanticWrapStatus === 'blocked') {
    const style = getComputedStyle(element);
    semanticOptions = {
      widthPx: Math.max(0, element.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0))
        * Math.max(.72, Math.min(1, Number(element.dataset.semanticWidthSafety) || 1)),
      fontPx: parseFloat(style.fontSize), fontFamily: style.fontFamily,
      fontWeight: style.fontWeight, fontStyle: style.fontStyle,
      letterSpacingPx: parseFloat(style.letterSpacing) || 0,
      maxLines: Number(element.dataset.semanticMaxLines) || 2,
      locale: element.dataset.semanticLocale || 'auto',
      protectedTerms: parseTerms(element.dataset.semanticTerms), allowScale: false,
    };
  }
  const fits = () => {
    if (element.ownerSVGElement) {
      const box=element.getBoundingClientRect(), bounds=element.ownerSVGElement.getBoundingClientRect();
      return box.left >= bounds.left - .5 && box.right <= bounds.right + .5 && box.height <= height + .5;
    }
    return element.scrollHeight <= height + .5 && element.scrollWidth <= element.clientWidth + .5
      && (!semanticOptions || (semanticLayout && semanticLayout(element.textContent, semanticOptions).status !== 'blocked'));
  };
  if (fits()) return true;
  const render = count => {
    element.replaceChildren(...children.map(node => node.cloneNode(true)));
    const offset = count < segments.length ? segments[count].index : fullText.length;
    const walker = element.ownerDocument.createTreeWalker(element, 4);
    let node, used = 0;
    while ((node = walker.nextNode())) {
      if (used + node.length >= offset) {
        const range = element.ownerDocument.createRange();
        range.setStart(node, offset - used); range.setEnd(element, element.childNodes.length);
        range.deleteContents(); node.parentNode.append(element.ownerDocument.createTextNode('...'));
        break;
      }
      used += node.length;
    }
  };
  render(0);
  if (!fits()) { element.replaceChildren(...children); return false; }
  let low = 0, high = segments.length;
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2); render(middle);
    if (fits()) low = middle; else high = middle;
  }
  render(low);
  element.__doeTextOverflow = { children, projection, fullText, height, tabIndex:element.getAttribute('tabindex') };
  element.dataset.flowTruncated = 'true';
  element.setAttribute('tabindex','0');
  return true;
}
