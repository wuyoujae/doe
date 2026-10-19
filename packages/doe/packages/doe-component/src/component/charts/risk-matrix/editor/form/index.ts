import { t } from "../../../../../shared/editor/i18n/index.ts";
import type { UnknownRecord } from "../../../../../shared/editor/types/index.ts";
import { editorForm } from "../../../../../shared/editor/form-controls/index.ts";

export function createRiskMatrixForm(base: UnknownRecord, onChange: () => void) {
  const e = editorForm(base, onChange); const c = e.draft.content;
  const axes = e.section(t('sections.riskCoordinates'), t('hints.coordinates'));
  e.text(axes, 'x-label', t('labels.xAxisName'), c.xLabel, v => { c.xLabel = v; });
  e.text(axes, 'y-label', t('labels.yAxisName'), c.yLabel, v => { c.yLabel = v; });
  const items = e.section(t('sections.risks'), t('hints.riskNames'));
  e.collection(items, t('labels.risk'), c.items, (item, i, node) => {
    e.text(node, `risk-${i}-label`, t('labels.riskName'), item.label, v => { item.label = v; }, true);
    const row = e.row(node);
    for (const [key, label] of [['x', t('labels.impact')], ['y', t('labels.likelihood')]]) e.number(row, `risk-${i}-${key}`, label, item[key], v => { item[key] = v; }, { min: 0, max: 1 });
  }, () => ({ label: t('defaults.risk', { v1: c.items.length + 1 }), x: 0.5, y: 0.5 }));
  const zone = e.section(t('sections.riskZone')); const fields = document.createElement('div');
  const drawZone = () => {
    e.clear(fields); const z = c.priorityZone; if (!z) return;
    e.text(fields, 'zone-label', t('labels.zoneName'), z.labelLines?.join('\n') ?? z.label, v => { z.labelLines = v.split('\n'); }, false, true);
    const row = e.row(fields);
    for (const [key, label] of [['x', t('labels.startX')], ['y', t('labels.startY')], ['width', t('labels.zoneWidth')], ['height', t('labels.zoneHeight')]]) e.number(row, `zone-${key}`, label, z[key], v => { z[key] = v; }, { min: key === 'width' || key === 'height' ? 0.01 : 0, max: 1 });
  };
  e.toggle(zone, t('labels.showZone'), Boolean(c.priorityZone), v => { if (v) c.priorityZone = { x: 0.55, y: 0.4, width: 0.4, height: 0.55, labelLines: [t('defaults.keyRisk')] }; else delete c.priorityZone; drawZone(); }); zone.append(fields); drawZone();
  e.validate(() => {
    const z = c.priorityZone;
    if (z && (z.x + z.width > 1.000001 || z.y + z.height > 1.000001)) return t('errors.zoneBounds');
  });
  return e.form;
}

