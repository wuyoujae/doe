import { t } from "../../../../../shared/editor/i18n/index.ts";
import type { UnknownRecord } from "../../../../../shared/editor/types/index.ts";
import type { ContentForm } from "../../../../../shared/editor/types/index.ts";
import { barDraft, parseBarDraft } from '../model/index.ts';

export function createGroupedBarForm(base: UnknownRecord, onChange: () => void): ContentForm {
  const draft = barDraft(base);
  const form = document.createElement('form');
  form.className = 'chart-content-form';
  let dirty = false;
  const changed = () => { dirty = true; onChange(); };
  const input = (key: string, label: string, value: string, update: (value: string) => void, numeric = false) => {
    const field = document.createElement('input');
    field.name = key; field.setAttribute('aria-label', label); field.value = value;
    field.type = numeric ? 'number' : 'text';
    if (numeric) { field.step = 'any'; field.min = '0'; }
    field.addEventListener('input', () => { update(field.value); changed(); });
    return field;
  };
  const button = (label: string, action: () => void, accessible = label) => {
    const result = document.createElement('button'); result.type = 'button'; result.textContent = label;
    result.setAttribute('aria-label', accessible); result.addEventListener('click', action); return result;
  };
  const section = (title: string, description: string) => {
    const result = document.createElement('section');
    const heading = document.createElement('h3'); heading.textContent = title;
    const hint = document.createElement('p'); hint.className = 'chart-content-hint'; hint.textContent = description;
    result.append(heading, hint); form.append(result); return result;
  };
  const labelInput = (host: HTMLElement, label: string, field: HTMLInputElement) => {
    const wrap = document.createElement('label'); wrap.className = 'chart-content-field';
    const text = document.createElement('span'); text.textContent = label; wrap.append(text, field); host.append(wrap);
  };
  const data = section(t('sections.chartData'), t('hints.matrix'));
  const actions = document.createElement('div'); actions.className = 'chart-content-data-actions';
  actions.append(button(t('actions.addCategory'), () => {
    draft.categories.push(t('defaults.category', { v1: draft.categories.length + 1 })); draft.series.forEach(series => series.data.push('0'));
    renderData(); changed(); grid.querySelector<HTMLInputElement>(`[name="category-${draft.categories.length - 1}"]`)?.focus();
  }), button(t('actions.addSeries'), () => {
    draft.series.push({ name: t('defaults.series', { v1: draft.series.length + 1 }), data: draft.categories.map(() => '0'), original: {} });
    renderData(); changed(); grid.querySelector<HTMLInputElement>(`[name="series-${draft.series.length - 1}"]`)?.focus();
  }));
  const grid = document.createElement('div'); grid.className = 'chart-content-data-grid';
  data.append(actions, grid);
  function renderData() {
    const table = document.createElement('table');
    table.setAttribute('aria-label', t('labels.barData'));
    const head = table.createTHead().insertRow();
    const categoryHead = document.createElement('th'); categoryHead.scope = 'col'; categoryHead.textContent = t('labels.category'); head.append(categoryHead);
    draft.series.forEach((series, s) => {
      const cell = document.createElement('th'); cell.scope = 'col';
      const group = document.createElement('div'); group.className = 'chart-content-series';
      const dot = document.createElement('span'); dot.className = 'chart-content-series-dot'; dot.style.setProperty('--series-color', `var(--chart-series-${s % 5})`);
      const remove = button('×', () => { draft.series.splice(s, 1); renderData(); changed(); }, t('actions.removeSeries', { v1: s + 1 }));
      remove.disabled = draft.series.length === 1; remove.className = 'chart-content-remove';
      group.append(dot, input(`series-${s}`, t('labels.seriesNameAt', { v1: s + 1 }), series.name, value => { series.name = value; }), remove);
      cell.append(group); head.append(cell);
    });
    const actionHead = document.createElement('th'); actionHead.scope = 'col'; actionHead.textContent = t('labels.actions'); head.append(actionHead);
    const body = table.createTBody();
    draft.categories.forEach((name, c) => {
      const row = body.insertRow();
      row.insertCell().append(input(`category-${c}`, t('defaults.category', { v1: c + 1 }), name, value => { draft.categories[c] = value; }));
      draft.series.forEach((series, s) => row.insertCell().append(input(`value-${s}-${c}`, t('labels.matrixValue', { v1: c + 1, v2: s + 1 }), series.data[c], value => { series.data[c] = value; }, true)));
      const remove = button('×', () => { draft.categories.splice(c, 1); draft.series.forEach(series => series.data.splice(c, 1)); renderData(); changed(); }, t('actions.removeCategory', { v1: c + 1 }));
      remove.disabled = draft.categories.length === 1; remove.className = 'chart-content-remove'; row.insertCell().append(remove);
    });
    grid.replaceChildren(table);
  }
  renderData();
  const format = section(t('sections.valueDisplay'), t('hints.units'));
  const options = document.createElement('div'); options.className = 'chart-content-options'; format.append(options);
  labelInput(options, t('labels.prefix'), input('prefix', t('labels.prefix'), draft.prefix, value => { draft.prefix = value; }));
  labelInput(options, t('labels.suffix'), input('suffix', t('labels.suffix'), draft.suffix, value => { draft.suffix = value; }));
  labelInput(options, t('labels.axisMax'), input('maximum', t('labels.axisMax'), draft.maximum, value => { draft.maximum = value; }, true));
  labelInput(options, t('labels.tickInterval'), input('interval', t('labels.tickInterval'), draft.interval, value => { draft.interval = value; }, true));
  const legend = document.createElement('input'); legend.type = 'checkbox'; legend.checked = draft.legend;
  legend.addEventListener('change', () => { draft.legend = legend.checked; changed(); });
  const toggle = document.createElement('label'); toggle.className = 'chart-content-toggle'; toggle.append(legend, document.createTextNode(t('labels.showLegend'))); format.append(toggle);
  return {
    element: form,
    read() {
      if (!dirty) return { props: structuredClone(base) };
      if ([...form.querySelectorAll<HTMLInputElement>('input[type="number"]')].some(field => field.validity.badInput)) {
        return { error: t('errors.validNumber') };
      }
      const result = parseBarDraft(base, draft);
      form.querySelectorAll<HTMLInputElement>('input[name]').forEach(field => {
        field.setCustomValidity(result.errors[field.name] || '');
        field.setAttribute('aria-invalid', String(Boolean(result.errors[field.name])));
      });
      return result.props ? { props: result.props } : { error: Object.values(result.errors)[0] };
    },
  };
}
