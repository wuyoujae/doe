import { t } from "../i18n/index.ts";
import type { UnknownRecord } from "../types/index.ts";
import { editorForm, removeCategoryReferences, units } from "../form-controls/index.ts";

export function seriesForm(base: UnknownRecord, onChange: () => void, stacked: boolean) {
  const e = editorForm(base, onChange); const c = e.draft.content;
  const section = e.section(stacked ? t('sections.stackedData') : t('sections.lineData'), stacked ? t('hints.stacked') : t('hints.line'));
  const actions = e.row(section); const grid = document.createElement('div'); grid.className = 'chart-content-data-grid'; section.append(grid);
  let structureChanged = () => {};
  const draw = () => {
    e.clear(grid); const table = document.createElement('table'); grid.append(table);
    const head = table.createTHead().insertRow(); head.insertCell().textContent = t('labels.category');
    c.series.forEach((series: any, s: number) => {
      const cell = head.insertCell(); e.text(cell, `series-${s}`, t('labels.seriesNameAt', { v1: s + 1 }), series.name, v => { series.name = v; }, true);
      e.button(cell, t('actions.removeSeries', { v1: s + 1 }), () => { c.series.splice(s, 1); draw(); }, c.series.length === 1);
    });
    head.insertCell().textContent = t('labels.actions');
    const body = table.createTBody();
    c.categories.forEach((category: string, i: number) => {
      const row = body.insertRow(); e.text(row.insertCell(), `category-${i}`, t('defaults.category', { v1: i + 1 }), category, v => { c.categories[i] = v; }, true);
      c.series.forEach((series: any, s: number) => e.number(row.insertCell(), `value-${s}-${i}`, t('labels.matrixValue', { v1: i + 1, v2: s + 1 }), series.data[i], v => { series.data[i] = v; }, stacked ? { min: 0 } : {}));
      e.button(row.insertCell(), t('actions.removeCategory', { v1: i + 1 }), () => { c.categories.splice(i, 1); c.series.forEach((s: any) => s.data.splice(i, 1)); removeCategoryReferences(c, i); draw(); structureChanged(); }, c.categories.length === 1);
    });
  };
  e.button(actions, t('actions.addCategory'), () => { c.categories.push(t('defaults.category', { v1: c.categories.length + 1 })); c.series.forEach((s: any) => s.data.push(0)); draw(); structureChanged(); });
  e.button(actions, t('actions.addSeries'), () => { c.series.push({ name: t('defaults.series', { v1: c.series.length + 1 }), data: c.categories.map(() => 0) }); draw(); });
  draw(); units(e, c);
  const axis = e.section(t('sections.axisDisplay'), t('hints.autoAxis')); const row = e.row(axis);
  if (!stacked) e.number(row, 'minimum', t('labels.axisMin'), c.minValue, v => { c.minValue = v; }, { optional: true });
  e.number(row, 'maximum', t('labels.axisMax'), c.maxValue, v => { c.maxValue = v; }, { optional: true });
  e.number(row, 'interval', t('labels.tickInterval'), c.tickInterval, v => { c.tickInterval = v; }, { min: Number.MIN_VALUE, optional: true });
  e.toggle(axis, t('labels.showLegend'), e.draft.showLegend !== false, v => { e.draft.showLegend = v; });
  e.validate(() => {
    const values = stacked ? c.categories.map((_: any, i: number) => c.series.reduce((sum: number, s: any) => sum + Number(s.data[i]), 0)) : c.series.flatMap((s: any) => s.data.map(Number));
    const max = Math.max(0, ...values); const min = Math.min(0, ...values);
    if (!values.every(Number.isFinite)) return t('errors.totalOverflow');
    if (c.maxValue !== undefined && c.maxValue < max) return t('errors.axisMax');
    if (c.minValue !== undefined && c.minValue > min) return t('errors.axisMin');
    if (c.tickInterval && ((c.maxValue ?? max) - (c.minValue ?? min)) / c.tickInterval > 100) return t('errors.denseTicks');
  });
  return { ...e, onStructureChange: (callback: () => void) => { structureChanged = callback; } };
}

