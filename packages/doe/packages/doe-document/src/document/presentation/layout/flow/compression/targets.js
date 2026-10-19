import { unitKey, fieldKey, fontLadder } from './policy.js';
import { scope } from '../../../runtime/context/index.js';
import { paintedSurface } from '../../../canvas/renderer/image-surface/index.js';
import { ancestorGroups } from '../../ancestor-groups/index.js';
import { isLayoutFeatureLocked } from '../../is-layout-feature-locked/index.js';

const ignored = element => {
  const hidden = element.closest('[data-slide-export-ignore], [hidden], [aria-hidden="true"], defs');
  return hidden && element.closest('.schema-slide')?.contains(hidden);
};
export const paintedScale = element => {
  let scale = 1;
  for (let node = element; node && !node.classList?.contains('schema-slide'); node = node.parentElement) {
    scale *= Number(node.dataset?.flowPaintScale) || 1;
  }
  return scale;
};

const glyphSelector = '[data-doe-text-run], [style*="font-size"], [data-typography-style]';
const glyphKey = target => `${target.style?.fontSize || ''}|${target.dataset.typographyStyle || ''}`;
const glyphTargets = target => [...(target.querySelectorAll?.(glyphSelector) || [])].filter(child => child.textContent.trim() && !ignored(child));

/** Constraints are captured before fitting, then matched against freshly rendered runs. */
export function visibleTextTargets(field) {
  const minimumPt = field.ladder?.at(-1) ?? field.basePt;
  return [{ target: field.target, minimumPt }, ...glyphTargets(field.target).map(target => ({
    target, minimumPt: field.glyphFloors?.get(target) ?? field.glyphFloors?.get(glyphKey(target)) ?? minimumPt,
  }))];
}

export function rememberGlyphFloor(field, target, minimumPt) {
  field.glyphFloors?.set(target, minimumPt);
  const key = glyphKey(target);
  field.glyphFloors?.set(key, Math.max(minimumPt, field.glyphFloors.get(key) || 0));
}

function fieldFloor(record, state, field) {
  const owners = [...(ancestorGroups(state.slide.blocks || [], record.node.id) || []), record.node];
  const optional = field.optional === true || field.target.closest('[data-typography-role="supporting"], [data-typography-style="small"]');
  const property = optional ? 'optionalMinBodyPt' : 'minBodyPt';
  const minimumPt = Math.max(0, ...owners.map(node => {
    const value = Number(node.layout?.textFit?.[property] ?? node.layout?.textFit?.minBodyPt);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }));
  return { minimumPt, typographyLocked: owners.some(node => isLayoutFeatureLocked(node, 'typography')) };
}

/** A field keeps its author identity even when the native renderer replaces DOM. */
export function textTargets(record, state) {
  const fields = (scope.global.DOETextFields?.fields(record.element, record.node) || [])
    .filter(field => field.target?.isConnected && !field.source && !ignored(field.target));
  const roots = fields.map(field => field.target);
  [...record.element.querySelectorAll('[data-typography-style], svg text')].forEach((target, index) => {
    if (ignored(target) || roots.some(root => root === target || root.contains(target) || target.contains(root))) return;
    fields.push({ target, path: ['$label', index] });
    roots.push(target);
  });
  if (record.definition?.category === 'charts') {
    // Native HTML ticks and legends have no author field or typography marker.
    // Track their painted font floor without turning them into shrinkable copy.
    [record.element, ...record.element.querySelectorAll('*')].forEach((target, index) => {
      if (target.namespaceURI !== 'http://www.w3.org/1999/xhtml' || ignored(target)
        || ![...target.childNodes].some(node => node.nodeType === 3 && node.textContent.trim())
        || roots.some(root => root === target || root.contains(target) || target.contains(root))) return;
      fields.push({ target, path: ['$label', 'html', index], constraintOnly: true });
      roots.push(target);
    });
  }
  return fields.filter(field => field.target.textContent.trim()).map(field => {
    const index = field.path[0] === 'items' && Number.isInteger(field.path[1]) ? field.path[1] : null;
    const basePt = parseFloat(getComputedStyle(field.target).fontSize) * 72 / 96;
    const { minimumPt, typographyLocked } = fieldFloor(record, state, field);
    const ladderFor = base => typographyLocked ? [base]
      : fontLadder(base, scope.TYPOGRAPHY_STYLES, state.slide.typography.sizeMode, minimumPt);
    const result = { ...field, key: fieldKey(record.node.id, field.path), id: record.node.id,
      unit: unitKey(record.node.id, index),
      ladder: ladderFor(basePt), basePt, minimumPt, typographyLocked, glyphFloors: new Map() };
    for (const target of glyphTargets(field.target)) {
      rememberGlyphFloor(result, target, ladderFor(parseFloat(getComputedStyle(target).fontSize) * 72 / 96).at(-1));
    }
    return result;
  });
}

/** Each schema node is one surface. Items are ONLY content identities. */
export function compressionRows(state) {
  const rows = [], leaves = new Map(state.leafRecords.map(record => [record.node.id, record]));
  const groups = new Map(state.groupRecords.map(record => [record.node.id, record]));
  const unit = (record, item = null, element = paintedSurface(record), owner = record.content) => ({
    key: unitKey(record.node.id, item), id: record.node.id, item, record, element, owner,
  });
  function visit(nodes) {
      for (const node of nodes) {
        const group = groups.get(node.id), record = leaves.get(node.id);
        if (group) {
          if (node.layout?.region !== 'content' && node.layout?.variant !== 'edge-media') rows.push({ units: [unit(group, null, group.content, group.shell)] });
          visit(node.children);
        } else if (record) {
          rows.push({ units: [unit(record)] });
        }
      }
  }
  visit(state.flowTopRecords.map(record => record.node));
  return rows;
}
