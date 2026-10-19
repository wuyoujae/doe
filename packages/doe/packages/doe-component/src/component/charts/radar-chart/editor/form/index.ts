import { t } from "../../../../../shared/editor/i18n/index.ts";
import type { UnknownRecord } from "../../../../../shared/editor/types/index.ts";
import { editorForm } from "../../../../../shared/editor/form-controls/index.ts";

export function createRadarForm(base: UnknownRecord, onChange: () => void) {
  const e = editorForm(base, onChange); const c = e.draft.content;
  const axes = e.section(t('sections.dimensions'), t('hints.dimensions'));
  const values = e.section(t('sections.comparisonData')); const fields = document.createElement('div'); values.append(fields);
  const drawData = () => {
    e.clear(fields);
    e.collection(fields, t('labels.series'), c.datasets, (dataset, s, card) => {
      e.text(card, `dataset-${s}`, t('labels.seriesName'), dataset.name, v => { dataset.name = v; }, true);
      c.axes.forEach((axis: any, i: number) => e.number(card, `radar-value-${s}-${i}`, t('labels.dimensionValue', { v1: i + 1, v2: axis.label }), dataset.values[i], v => { dataset.values[i] = v; }, { min: 0 }));
    }, () => ({ name: t('defaults.series', { v1: c.datasets.length + 1 }), values: c.axes.map(() => 0) }));
  };
  e.collection(axes, t('labels.dimension'), c.axes, (axis, i, card) => {
    e.text(card, `axis-label-${i}`, t('labels.dimensionName'), axis.label, v => { axis.label = v; }, true);
    e.number(card, `axis-max-${i}`, t('labels.dimensionMax'), axis.max ?? 1, v => { axis.max = v; }, { min: Number.MIN_VALUE });
  }, () => { c.datasets.forEach((dataset: any) => dataset.values.push(0)); queueMicrotask(drawData); return { label: t('defaults.dimension', { v1: c.axes.length + 1 }), max: 100 }; }, 3,
  i => { c.datasets.forEach((dataset: any) => dataset.values.splice(i, 1)); drawData(); });
  drawData();
  const display = e.section(t('sections.gridLegend'));
  e.number(display, 'rings', t('labels.gridRings'), c.rings ?? 3, v => { c.rings = v; }, { min: 1, max: 12, integer: true });
  e.toggle(display, t('labels.showLegend'), c.showLegend !== false, v => { c.showLegend = v; });
  e.validate(() => {
    if (c.axes.length < 3) return t('errors.radarDimensions');
    for (const dataset of c.datasets) for (let i = 0; i < c.axes.length; i++) if (Number(dataset.values[i]) > Number(c.axes[i].max ?? 1)) return t('errors.dimensionLimit', { v1: dataset.name, v2: c.axes[i].label });
  });
  return e.form;
}

