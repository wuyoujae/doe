/** System layout policy. Values are slide points, never viewport/UI pixels. */
export const FLOW_LAYOUT = Object.freeze({
  version: 'flow-v1', pageMarginPt: 48, pageMarginVerticalPt: 20, groupGapPt: 18,
  afterPt: Object.freeze({ heading: 24, title: 24, text: 12, default: 18 }),
});

export const toPixels = points => points * 96 / 72;

/** The surface's chrome scales with its content; subtract it in logical units. */
export const logicalContentCapacity = (available, inset, scale = 1) => Math.max(0, available / scale - inset);

export function resolveComponentFlowContract(definition, props) {
  const contract = { ...definition.flowLayout, ...definition.resolveFlowLayout?.(props) };
  // Component centering belongs to its allocated slot, independent of the
  // artwork's native size and the text alignment inside it.
  if (contract.alignX === 'center') contract.alignY = 'center';
  return contract;
}

/** Fixed artwork is laid out before it is fitted into the external slot. */
export function flowLogicalWidth(contract, slotWidth) {
  if (contract.sizing === 'fixed') return contract.expandContentWidth ? Math.max(slotWidth, contract.naturalWidth) : contract.naturalWidth;
  return Math.max(contract.minimumNaturalWidth || 0, slotWidth);
}

export function componentFlowContract(type, definition = {}) {
  const graphic = (definition.category === 'charts' && type !== 'table') || definition.category === 'diagrams' || type === 'shape-contents';
  return Object.freeze({
    compression: graphic ? 'graphic' : 'text',
    surfaceScale: graphic || type === 'media' ? 'uniform' : 'reflow',
    ...(type === 'shape-contents' ? { minimumNaturalWidth: definition.minWidth } : {}),
    width: ['text', 'stat'].includes(type) ? 'intrinsic' : 'fill',
    slotWidth: 'fill',
    itemGeometry: 'variable',
    itemAlignment: 'row-stretch',
    alignX: 'start', alignY: 'start',
    height: ['question-card', 'columns'].includes(type) ? 'stretch' : 'natural',
    // Bare text has no card inset. Borders, decorations and card padding belong
    // to the component's own surface, including the bordered quote component.
    inset: ['text', 'stat', 'list', 'ordered-list', 'todo-list'].includes(type) ? 'none' : 'component',
    afterPt: FLOW_LAYOUT.afterPt[type] ?? FLOW_LAYOUT.afterPt.default,
    ...definition.flowLayout,
  });
}

/** One default for compiler, Canvas and export; legacy is always explicit. */
export function resolveFlowLayout(value) {
  if (value === null || value?.version === 'legacy') return null;
  const margin = Number(value?.pageMarginPt);
  const vertical = Number(value?.pageMarginVerticalPt);
  const margins = [12, 20, 24, 36, 48, 56, 64, 72];
  // Explicit scalar options retain their original four-sided geometry.
  const scalar = margins.includes(margin);
  return Object.freeze({ version: FLOW_LAYOUT.version,
    compression: value?.compression === 'page-v1' ? 'page-v1' : 'local-v4',
    pageMarginPt: scalar ? margin : FLOW_LAYOUT.pageMarginPt,
    pageMarginVerticalPt: margins.includes(vertical) ? vertical
      : value?.pageMarginVerticalPt === undefined && scalar ? margin : FLOW_LAYOUT.pageMarginVerticalPt });
}
