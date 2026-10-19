const VERTICAL_ALIGN = new Set(['start', 'center', 'end']);

/** Align the natural content inside its row slot; never change the slot height. */
export function applyFlowChildAlignment(record, { parentLayout, inRow = false, height = 'natural' } = {}) {
  const requested = parentLayout?.align ?? (['columns', 'composition', 'grid'].includes(parentLayout?.variant) ? 'center' : null);
  const align = inRow && height !== 'stretch' && VERTICAL_ALIGN.has(requested) ? requested : null;
  if (align) record.shell.dataset.flowVerticalAlign = align;
  else delete record.shell.dataset.flowVerticalAlign;
  return align;
}
