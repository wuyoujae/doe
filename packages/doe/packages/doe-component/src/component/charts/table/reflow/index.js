// Owned semantic fields are excluded from the generic text-tree pass. Reflow
// them after Flow applies its final font sizes, including unchanged signatures.
export function reflow(root, _component, context) {
  if (!context.flowLayout) return;
  const service = root.ownerDocument.defaultView?.SemanticTextLayout;
  if (!service?.applyElement) return;
  for (const cell of root.querySelectorAll('[data-semantic-owner="data-table"]')) {
    service.applyElement(cell, { allowScale: false });
  }
  // Reclaim existing vertical cell padding before the page sacrifices nearby
  // title typography. Horizontal padding and every authored cell remain intact.
  const table = root.querySelector('table');
  const budget = Number(context.contentHeightBudget);
  root.dataset.spaceDensity = 'comfortable';
  if (!table || context.spacingLocked || !Number.isFinite(budget)) return;
  for (const density of ['comfortable', 'compact', 'tight', 'minimum']) {
    root.dataset.spaceDensity = density;
    if (table.offsetHeight <= budget) break;
  }
}
