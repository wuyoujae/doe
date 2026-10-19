import { FLOW_LAYOUT, toPixels, resolveComponentFlowContract, flowLogicalWidth, logicalContentCapacity } from '../../../../../../doe-component/src/layout/flow/contract.js';
import { flowGrid } from '../../../../../../doe-component/src/layout/flow/rows.js';
import { prepareFlowText } from '../../../../../../doe-component/src/layout/compression/prepare-flow-text/index.js';
import { applyTypographyCompression } from '../../typography/apply-typography-compression/index.js';
import { adaptLeafWithResolvedItemColumns } from '../adapt-leaf-with-resolved-item-columns/index.js';
import { isEdgeSplitGroup } from '../is-edge-split-group/index.js';
import { edgeMediaPosition } from '../edge-media-position/index.js';
import { edgeMediaShape } from '../edge-media-shape/index.js';
import { safeArea } from './safe-area.js';
import { scope } from '../../runtime/context/index.js';
import { unitKey } from './compression/policy.js';
import { clearCompressionStyles, applyTextCompression, applySurfaceScale } from './compression/apply.js';
import { contentPressure } from './compression/pressure.js';
import { truncateText } from '../../../../../../doe-core/src/text/overflow/index.js';
import { imageSurfaceInsets, paintedSurface } from '../../canvas/renderer/image-surface/index.js';
import { applyFlowChildAlignment } from './child-alignment.js';
import { isLayoutFeatureLocked } from '../is-layout-feature-locked/index.js';
import { ancestorGroups } from '../ancestor-groups/index.js';

export function groupColumns(node) {
  if (node.layout?.variant === 'stack' || node.layout?.direction === 'stack') return 1;
  const explicit = Number(node.layout?.columns);
  return Math.max(1, Math.min(node.children.length || 1,
    Number.isFinite(explicit) && explicit > 0 ? explicit
      : ['row', 'columns', 'composition'].includes(node.layout?.variant) ? node.children.length : 1));
}

export function flowAdapterHeight(state, record, logicalHeight) {
  if (!state.flowHeightBudgets?.has(record.node.id)) return null;
  if (!state.flowCompression) return logicalHeight;
  // Native chart sizes are integer CSS pixels. Round toward the available
  // space so a fractional budget cannot grow the plot beyond its siblings.
  return record.definition.flowLayout.reshapeHeight === true && logicalHeight > 0 ? Math.floor(logicalHeight) : null;
}

export function applyFlowDensity(state, density) {
  clearCompressionStyles(state);
  const { layoutElement: layout, slideElement, slide } = state;
  const groups = new Map(state.groupRecords.map(record => [record.node.id, record]));
  const leaves = new Map(state.leafRecords.map(record => [record.node.id, record]));
  const edge = slide.blocks.find(isEdgeSplitGroup);
  const area = safeArea(scope.CANVAS.renderWidth, scope.CANVAS.renderHeight, state.flowLayout.pageMarginPt, edge, slide.background, state.flowLayout.pageMarginVerticalPt);
  const gap = toPixels(FLOW_LAYOUT.groupGapPt);
  const internalGap = toPixels(12);
  const contexts = new Map();
  const groupSurfaces = [];
  state.flowGeometry = new Map();
  state.flowSafeArea = area;
  layout.dataset.density = density.id;
  layout.dataset.spacingCompression = '0';
  applyTypographyCompression(layout, slide.typography?.sizeMode || 'default', density.id);
  for (const [key, value] of Object.entries({ 'page-padding': area.margin,
    'page-top-padding': area.verticalMargin, 'page-bottom-padding': area.verticalMargin, 'section-gap': 0, 'group-gap': gap, 'component-gap': internalGap })) {
    layout.style.setProperty(`--${key}`, `${value}px`);
  }
  // The root slots and their measured surfaces share the same safe rectangle.
  // Keep the background full-bleed and preserve the existing default padding.
  const narrowBackground = !edge && area.content.width < scope.CANVAS.renderWidth - area.margin * 2;
  layout.style.paddingLeft = narrowBackground ? `${area.content.x}px` : '';
  layout.style.paddingRight = narrowBackground ? `${scope.CANVAS.renderWidth - area.content.x - area.content.width}px` : '';
  slideElement.style.setProperty('--slide-page-padding', `${area.margin}px`);
  slideElement.style.setProperty('--slide-logo-center-y', `${area.logoCenterY}px`);
  // The number's line box is centered inside the footer band, below content.
  slideElement.style.setProperty('--slide-page-number-bottom', `max(0px, calc(${area.verticalMargin / 2}px - 0.5em))`);

  function after(node) {
    return toPixels(leaves.get(node.id)?.definition.flowLayout.afterPt ?? FLOW_LAYOUT.afterPt.default);
  }
  // A group must contain its children's unscaled artwork before the group is
  // scaled as one surface. Shrinking an already overflowing grid cannot fix
  // the relative overlap between its own columns.
  function minimumWidth(node) {
    const divisor = state.flowCompression?.factor[unitKey(node.id)] || 1;
    if (!node.children) {
      const record = leaves.get(node.id);
      return record ? (flowLogicalWidth(resolveComponentFlowContract(record.definition, node.props), 0) + imageSurfaceInsets(record).x) / divisor : 0;
    }
    const columns = groupColumns(node);
    let width = 0;
    for (let i = 0; i < node.children.length; i += columns) {
      const row = node.children.slice(i, i + columns);
      width = Math.max(width, Math.max(0, ...row.map(minimumWidth)) * row.length + gap * (row.length - 1));
    }
    return width / divisor;
  }
  function adapt(node, width, availableHeight, { rootFlow = false, inRow = false, parentLayout, spacingLocked = false } = {}) {
    spacingLocked ||= isLayoutFeatureLocked(node, 'spacing');
    availableHeight = state.flowHeightBudgets?.get(node.id) ?? availableHeight;
    const record = groups.get(node.id) || leaves.get(node.id);
    if (!record) return;
    record.shell.dataset.flowSlot = 'true';
    record.shell.style.margin = '0';
    record.shell.style.minWidth = '0';
    record.content.style.padding = '0';
    if (node.type === 'layout-group') {
      applyFlowChildAlignment(record, { parentLayout, inRow });
      const slotWidth = width;
      if (!rootFlow && node.layout?.intent === 'drag-compose') width = Math.max(width, minimumWidth(node) * (state.flowCompression?.factor[unitKey(node.id)] || 1));
      const columns = Math.min(groupColumns(node), state.flowColumns?.get(node.id) ?? Infinity);
      const plan = flowGrid(node.children.length, columns);
      record.content.dataset.flowGroup = 'true';
      record.content.dataset.flowRoot = String(rootFlow);
      record.content.style.display = 'grid';
      record.content.style.gridTemplateColumns = `repeat(${plan.tracks}, minmax(0, 1fr))`;
      record.content.style.gridTemplateRows = 'none';
      record.content.style.gridAutoRows = 'max-content';
      record.content.style.gap = `${rootFlow ? 0 : gap}px`;
      record.content.style.alignItems = 'stretch';
      record.content.style.alignContent = 'start';
      record.resolvedColumns = columns; record.requestedColumns = groupColumns(node);
      record.gap = rootFlow ? 0 : gap; record.compressionFits = true;
      record.resolvedDirection = columns === 1 ? 'stack' : 'row';
      record.trackWidths = null; record.compressionScales = null;
      record.content.style.width = `${width}px`;
      if (slide.background) record.content.style.marginInline = { left: '0 auto', center: 'auto', right: 'auto 0' }[slide.background.contentAlign];
      state.flowGeometry.set(node.id, { width, slotWidth, availableHeight });
      groupSurfaces.push({ record, width });
      let offset = 0;
      for (const count of plan.rows) {
        for (let i = 0; i < count; i += 1) {
          const index = offset + i;
          const child = node.children[index];
          const shell = record.childShells[index];
          shell.style.gridColumn = `span ${plan.spans[index]}`;
          shell.style.gridRow = 'auto';
          adapt(child, Math.max(0, (width - (count - 1) * gap) / count), availableHeight, { inRow: count > 1, parentLayout: node.layout, spacingLocked });
          if (rootFlow && index < node.children.length - 1) shell.style.marginBottom = `${after(child)}px`;
        }
        offset += count;
      }
      return;
    }
    const contract = { ...resolveComponentFlowContract(record.definition, node.props) };
    const verticalAlign = applyFlowChildAlignment(record, { parentLayout, inRow, height: contract.height });
    const surface = paintedSurface(record), inset = imageSurfaceInsets(record);
    if (surface !== record.element) contract.width = 'fill';
    if (slide.background) contract.alignX = { left: 'start', center: 'center', right: 'end' }[node.props?.align || slide.background.contentAlign] || contract.alignX;
    record.flowContract = contract;
    const paintScale = 1 / (state.flowCompression?.factor[unitKey(node.id)] || 1);
    const inheritedScale = (ancestorGroups(slide.blocks, node.id) || []).reduce((scale, parent) => scale / (state.flowCompression?.factor[unitKey(parent.id)] || 1), 1);
    const totalScale = paintScale * inheritedScale;
    const contentSlotWidth = logicalContentCapacity(width, inset.x, paintScale);
    const logicalWidth = flowLogicalWidth(contract, contentSlotWidth);
    const logicalHeight = logicalContentCapacity(availableHeight, inset.y, totalScale);
    if (surface !== record.element) surface.style.width = `${logicalWidth + inset.x}px`;
    record.shell.dataset.flowHeight = inRow ? contract.height : 'natural';
    record.content.style.width = '100%';
    record.content.style.height = verticalAlign ? 'auto' : '100%';
    record.content.style.display = 'flex';
    record.content.style.flexDirection = 'column';
    record.content.style.alignItems = {start:'flex-start',center:'safe center',end:'safe flex-end'}[contract.alignX];
    record.content.style.justifyContent = {start:'flex-start',center:'safe center',end:'safe flex-end'}[contract.alignY];
    record.element.dataset.itemGeometry = contract.itemGeometry;
    record.element.dataset.flowItemAlignment = contract.itemAlignment;
    record.element.dataset.flowSurface = contract.width;
    record.element.dataset.flowInset = contract.inset;
    // Measure text at the complete slot width first. A semantic line break must
    // not become next pass's intrinsic width (that would shrink on every solve).
    record.element.style.width = `${logicalWidth}px`;
    record.element.style.maxWidth = logicalWidth > width ? 'none' : '';
    record.element.dataset.flowCollection = 'true';
    // Wrapping uses the allocated width and all usable height before typography changes.
    prepareFlowText(record.element, logicalHeight);
    const context = {
      columns: 1, density: density.id, width: logicalWidth, slotWidth: contentSlotWidth, spacingLocked,
      availableHeight: logicalHeight,
      contentHeightBudget: state.flowContentBudgets?.has(node.id) ? logicalContentCapacity(state.flowContentBudgets.get(node.id), inset.y, totalScale) : undefined,
      height: flowAdapterHeight(state, record, logicalHeight),
      gap: record.definition.itemCollection ? gap : internalGap, flowLayout: true, autoItemColumns: state.autoItemColumns?.get(node.id),
      timelineFallbackStage: state.flowCompression?.timeline?.[node.id] ?? state.timelineFallbackStage ?? 0,
      compressionScale: 1,
      compressionOrientation: state.flowCompression?.orientation?.[node.id],
    };
    contexts.set(record, { context, contract, paintScale });
    state.flowGeometry.set(node.id, { width: logicalWidth + inset.x, slotWidth: width, contentSlotWidth, insetY: inset.y, availableHeight, paintScale: totalScale });
    if (!(state.flowPreview && state.activeTextEdit?.node.id === node.id)) adaptLeafWithResolvedItemColumns(record, context);
    // Nested intrinsic surfaces (e.g. metrics) also start from their full slot.
    // Otherwise last pass's inserted line feeds become their new max-content
    // width, narrowing them again on every semantic/fitting pass.
    for (const surface of record.element.querySelectorAll('[data-flow-surface="intrinsic"]')) surface.style.width = '100%';
    if (state.flowCompression) {
      applyTextCompression(state, record);
      prepareFlowText(record.element, logicalHeight);
    }
  }

  const contentNode = edge?.children.find(node => node.layout?.region === 'content');
  const roots = edge ? (contentNode?.children || []) : slide.blocks;
  state.flowTopRecords = roots.map(node => groups.get(node.id) || leaves.get(node.id)).filter(Boolean);
  const heights = state.flowHeightBudgets || new Map();
  if (edge) {
    const edgeRecord = groups.get(edge.id);
    edgeRecord.shell.dataset.flowEdge = 'true';
    edgeRecord.content.dataset.flowEdge = 'true';
    edgeRecord.content.dataset.mediaPosition = edgeMediaPosition(edge);
    edgeRecord.content.dataset.mediaShape = edgeMediaShape(edge);
    edgeRecord.content.style.cssText = 'display:block;position:relative;width:100%;height:100%;padding:0;gap:0';
    edgeRecord.resolvedColumns = 2; edgeRecord.requestedColumns = 2;
    edgeRecord.gap = 0; edgeRecord.compressionFits = true;
    edge.children.forEach((node, index) => {
      const media = node.layout?.region === 'media';
      const box = media ? area.media : area.content;
      const shell = edgeRecord.childShells[index];
      shell.style.position = 'absolute'; shell.style.left = `${box.x}px`; shell.style.top = `${box.y}px`;
      shell.style.width = `${box.width}px`; shell.style.height = `${box.height}px`;
      shell.style.margin = '0';
      if (media) {
        const leaf = leaves.get(node.id);
        if (leaf) {
          leaf.content.style.padding = '0';
          leaf.definition.adapt?.(leaf.element, node, { width: box.width, height: box.height, bleed: true, density: density.id, gap });
        }
      } else {
        adapt(node, box.width, box.height, { rootFlow: true, spacingLocked: isLayoutFeatureLocked(edge, 'spacing') });
        const content = groups.get(node.id)?.content;
        if (content) content.style.alignContent = 'safe center';
      }
    });
  } else {
    roots.forEach((node, index) => {
      adapt(node, area.content.width, heights.get(node.id) ?? area.content.height);
      if (index < roots.length - 1) state.rootShells[index].style.marginBottom = `${after(node)}px`;
    });
  }
  scope.global.PPTTheme?.apply(slideElement, state.theme);
  state.semanticWrapResults = scope.global.SemanticTextLayout?.applyTree?.(layout, {
    minFontPt: scope.MIN_MICRO_FONT_PT, allowScale: false,
  }) || [];
  // Component geometry must use the final text, before any surface is painted
  // at scale. Reflow is explicitly DOM-preserving, including during live edits.
  for (const [record, { context }] of contexts) record.definition.reflow?.(record.element, record.node, context);
  for (const [record] of contexts) state.flowGeometry.get(record.node.id).height = paintedSurface(record).offsetHeight;
  // Measure and project in logical coordinates, before any ancestor zoom.
  const pendingTruncation = new Set(Object.keys(state.flowCompression?.truncate || {}));
  for (const key of [...pendingTruncation]) {
    const pressure = contentPressure(state, pendingTruncation).find(pressure => pressure.key === key);
    pendingTruncation.delete(key);
    if (!pressure) continue;
    const field = state.flowTextTargets.find(field => field.key === key);
    if (field) {
      truncateText(field.target, pressure.availableHeight);
      if (state.mode === 'static') field.target.removeAttribute('tabindex');
    }
  }
  // Only text projection changes geometry after the first completed reflow.
  if (Object.keys(state.flowCompression?.truncate || {}).length) {
    for (const [record, { context }] of contexts) record.definition.reflow?.(record.element, record.node, context);
  }
  const intrinsicSurfaces = [...layout.querySelectorAll('[data-flow-surface="intrinsic"]')];
  for (const surface of intrinsicSurfaces) {
    const fields = surface.matches('[data-semantic-wrap]') ? [surface]
      : [...surface.querySelectorAll('[data-semantic-wrap]')];
    if (!fields.length) continue;
    let measured = 0;
    const scale = surface.getBoundingClientRect().width / Math.max(1, surface.offsetWidth);
    const width = parseFloat(getComputedStyle(surface).width);
    for (const field of fields) {
      const range = document.createRange(); range.selectNodeContents(field);
      const style = getComputedStyle(field);
      const contentWidth = field.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
      // A nested stat owns its own padding. Include the entire path from the
      // surface to the text box, not just the outer surface's own inset.
      measured = Math.max(measured, range.getBoundingClientRect().width / Math.max(.001, scale) + Math.max(0, width - contentWidth));
    }
    surface.style.width = `${Math.min(width, Math.ceil(measured + 2))}px`;
  }
  for (const [record, { context, contract, paintScale }] of contexts) {
    // Adaptors may return percentage widths. Freeze the resolved logical box,
    // never interpret `100%` as 100 slide pixels when applying zoom.
    const surface = paintedSurface(record), inset = imageSurfaceInsets(record);
    const width = (parseFloat(getComputedStyle(record.element).width) || context.width) + inset.x;
    if (surface !== record.element) surface.style.width = `${width}px`;
    Object.assign(state.flowGeometry.get(record.node.id), { width, height: surface.offsetHeight });
    applySurfaceScale(state, surface, paintScale, width, contract);
  }
  for (const { record, width } of groupSurfaces.reverse()) {
    state.flowGeometry.get(record.node.id).height = record.content.offsetHeight;
    applySurfaceScale(state, record.content, 1 / (state.flowCompression?.factor[unitKey(record.node.id)] || 1), width);
  }
  state.equalHeightResults = [];
  void layout.offsetHeight;
  return { pagePadding: area.margin, pageTopPadding: area.verticalMargin, pageBottomPadding: area.verticalMargin, sectionGap: 0, groupGap: gap, internalGap };
}
