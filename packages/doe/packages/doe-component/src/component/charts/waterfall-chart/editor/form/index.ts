import { t } from "../../../../../shared/editor/i18n/index.ts";
import type { UnknownRecord } from "../../../../../shared/editor/types/index.ts";
import { editorForm, removeCategoryReferences, units } from "../../../../../shared/editor/form-controls/index.ts";

export function createWaterfallForm(base: UnknownRecord, onChange: () => void) {
  const e = editorForm(base, onChange); const c = e.draft.content;
  const data = e.section(t('sections.waterfallData'), t('hints.waterfall'));
  e.collection(data, t('labels.dataItem'), c.items, (item, i, node) => {
    e.text(node, `item-${i}-label`, t('labels.name'), item.label, v => { item.label = v; }, true, true);
    const value = document.createElement('div');
    const drawValue = () => {
      e.clear(value);
      e.number(value, `item-${i}-value`, item.type === 'total' ? t('labels.totalValue') : t('labels.changeValue'), item.value, v => { item.value = v; }, { optional: item.type === 'total' });
    };
    e.select(node, `item-${i}-type`, t('labels.type'), item.type === 'total' ? 'total' : 'change', [['change', t('types.change')], ['total', t('types.total')]], v => { item.type = v; if (v === 'change' && item.value == null) item.value = 0; drawValue(); });
    node.append(value); drawValue();
  }, () => { return { label: t('defaults.waterfallItem', { v1: c.items.length + 1 }), value: 0 }; }, 2, i => { removeCategoryReferences(c, i); });
  units(e, c);
  const axis = e.section(t('sections.axisDisplay'), t('hints.cumulativeAxis')); const row = e.row(axis);
  e.number(row, 'minimum', t('labels.axisMin'), c.minValue, v => { c.minValue = v; }, { optional: true });
  e.number(row, 'maximum', t('labels.axisMax'), c.maxValue, v => { c.maxValue = v; }, { optional: true });
  e.number(row, 'interval', t('labels.tickInterval'), c.tickInterval, v => { c.tickInterval = v; }, { min: Number.MIN_VALUE, optional: true });
  e.toggle(axis, t('labels.showYAxis'), c.showYAxis !== false, v => { c.showYAxis = v; });
  e.toggle(axis, t('labels.showValues'), c.showValues !== false, v => { c.showValues = v; });
  e.toggle(axis, t('labels.signedChanges'), c.showChangeSigns === true, v => { c.showChangeSigns = v; });
  e.validate(() => {
    let running = 0; const values = [0];
    c.items.forEach((item: any) => { running = item.type === 'total' ? item.value ?? running : running + item.value; values.push(running); });
    if (!values.every(Number.isFinite)) return t('errors.cumulativeOverflow');
    const min = Math.min(...values); const max = Math.max(...values);
    if (c.maxValue !== undefined && c.maxValue < max) return t('errors.cumulativeMax');
    if (c.minValue !== undefined && c.minValue > min) return t('errors.cumulativeMin');
    if (c.tickInterval && ((c.maxValue ?? max) - (c.minValue ?? min)) / c.tickInterval > 100) return t('errors.denseTicks');
  });
  return e.form;
}

