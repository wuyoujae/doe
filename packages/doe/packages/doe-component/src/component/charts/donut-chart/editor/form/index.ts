import { t } from "../../../../../shared/editor/i18n/index.ts";
import type { UnknownRecord } from "../../../../../shared/editor/types/index.ts";
import { editorForm, units } from "../../../../../shared/editor/form-controls/index.ts";

export function createDonutForm(base: UnknownRecord, onChange: () => void) {
  const e = editorForm(base, onChange); const c = e.draft.content;
  e.collection(e.section(t('sections.shares'), t('hints.shares')), t('labels.item'), c.items, (item, i, card) => {
    e.text(card, `donut-label-${i}`, t('labels.itemName'), item.label, v => { item.label = v; }, true);
    e.number(card, `donut-value-${i}`, t('labels.itemValue'), item.value, v => { item.value = v; }, { min: 0 });
    if (item.percentLabel !== undefined) e.text(card, `percent-label-${i}`, t('labels.shareText'), item.percentLabel, v => { item.percentLabel = v; });
    if (typeof item.valueLabel === 'string') e.text(card, `value-label-${i}`, t('labels.valueText'), item.valueLabel, v => { item.valueLabel = v; });
  }, () => ({ label: t('defaults.item', { v1: c.items.length + 1 }), value: 0 }), 2);
  const center = e.section(t('sections.center'), t('hints.center'));
  const source = c.center || {};
  const set = (key: string, value: string) => { c.center ||= {}; c.center[key] = value; };
  e.text(center, 'center-eyebrow', t('labels.centerEyebrow'), source.eyebrow, v => set('eyebrow', v));
  e.text(center, 'center-value', t('labels.centerValue'), source.value, v => set('value', v));
  e.text(center, 'center-subtitle', t('labels.centerDescription'), Array.isArray(source.subtitle) ? source.subtitle.join('\n') : source.subtitle, v => set('subtitle', v), false, true);
  if (source.title !== undefined) e.text(center, 'center-title', t('labels.centerTitle'), source.title, v => set('title', v));
  units(e, c);
  const display = e.section(t('sections.donutDisplay'));
  e.number(display, 'hole-ratio', t('labels.innerRatio'), c.holeRatio ?? (c.variant === 'hero' ? .42 : c.variant === 'compact' ? .34 : .5), v => { c.holeRatio = v; }, { min: .18, max: .72 });
  e.toggle(display, t('labels.showLegend'), c.showLegend !== false, v => { c.showLegend = v; });
  e.validate(() => { const total = c.items.reduce((sum: number, item: any) => sum + Number(item.value), 0); if (!(total > 0) || !Number.isFinite(total)) return t('errors.positiveTotal'); });
  return e.form;
}

