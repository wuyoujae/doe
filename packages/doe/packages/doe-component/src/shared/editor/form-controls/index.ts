import { t } from "../i18n/index.ts";
import type { UnknownRecord } from "../types/index.ts";
import type { ContentForm } from "../types/index.ts";

export type Draft = Record<string, any>;
type NumberRules = { min?: number; max?: number; optional?: boolean; integer?: boolean };

/** Shared controls only; component modules own their schema and validation. */
export function editorForm(base: UnknownRecord, onChange: () => void) {
  const draft: Draft = structuredClone(base);
  draft.content ||= {};
  const element = document.createElement('form'); element.className = 'chart-content-form';
  let dirty = false;
  const checks = new Map<HTMLInputElement | HTMLTextAreaElement, () => string>();
  const validators: (() => string | undefined)[] = [];
  const changed = () => { dirty = true; onChange(); };
  const section = (title: string, hint = '') => {
    const node = document.createElement('section');
    const h = document.createElement('h3'); h.textContent = title; node.append(h);
    if (hint) { const p = document.createElement('p'); p.className = 'chart-content-hint'; p.textContent = hint; node.append(p); }
    element.append(node); return node;
  };
  const wrap = (parent: HTMLElement, label: string, input: HTMLElement) => {
    const field = document.createElement('label'); field.className = 'chart-content-field';
    const caption = document.createElement('span'); caption.textContent = label;
    field.append(caption, input); parent.append(field);
  };
  const text = (parent: HTMLElement, name: string, label: string, value: unknown, set: (value: string) => void, required = false, multiline = false) => {
    const input = document.createElement(multiline ? 'textarea' : 'input');
    input.name = name; input.setAttribute('aria-label', label); input.value = String(value ?? '');
    input.addEventListener('input', () => { set(input.value); changed(); });
    checks.set(input, () => required && !input.value.trim() ? t('errors.required', { v1: label }) : '');
    wrap(parent, label, input); return input;
  };
  const number = (parent: HTMLElement, name: string, label: string, value: unknown, set: (value: any) => void, rules: NumberRules = {}) => {
    const input = document.createElement('input'); input.type = 'number'; input.step = rules.integer ? '1' : 'any';
    input.name = name; input.setAttribute('aria-label', label); input.value = value == null ? '' : String(value);
    if (rules.min !== undefined) input.min = String(rules.min);
    if (rules.max !== undefined) input.max = String(rules.max);
    input.addEventListener('input', () => { set(input.value); changed(); });
    checks.set(input, () => {
      if (!input.value && rules.optional && !input.validity.badInput) { set(undefined); return ''; }
      const n = Number(input.value);
      if (!input.value.trim() || input.validity.badInput || !Number.isFinite(n)
        || n < (rules.min ?? -Infinity) || n > (rules.max ?? Infinity) || (rules.integer && !Number.isInteger(n))) return t('errors.numberBounds', { v1: label, v2: rules.min !== undefined ? t('errors.minimum', { v1: rules.min }) : '', v3: rules.max !== undefined ? t('errors.maximum', { v1: rules.max }) : '' });
      set(n); return '';
    });
    wrap(parent, label, input); return input;
  };
  const select = (parent: HTMLElement, name: string, label: string, value: unknown, choices: [string, string][], set: (value: string) => void) => {
    const input = document.createElement('select'); input.name = name; input.setAttribute('aria-label', label);
    choices.forEach(([value, label]) => { const option = document.createElement('option'); option.value = value; option.textContent = label; input.append(option); });
    input.value = String(value ?? choices[0][0]); input.addEventListener('change', () => { set(input.value); changed(); });
    wrap(parent, label, input); return input;
  };
  const toggle = (parent: HTMLElement, label: string, value: boolean, set: (value: boolean) => void) => {
    const input = document.createElement('input'); input.type = 'checkbox'; input.checked = value;
    const field = document.createElement('label'); field.className = 'chart-content-toggle';
    field.append(input, document.createTextNode(label)); parent.append(field);
    input.addEventListener('change', () => { set(input.checked); changed(); });
  };
  const button = (parent: HTMLElement, label: string, action: () => void, disabled = false) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.disabled = disabled;
    b.addEventListener('click', () => { action(); changed(); }); parent.append(b); return b;
  };
  const row = (parent: HTMLElement) => { const node = document.createElement('div'); node.className = 'chart-content-options'; parent.append(node); return node; };
  const clear = (parent: HTMLElement) => { for (const input of checks.keys()) if (parent.contains(input)) checks.delete(input); parent.replaceChildren(); };
  const collection = (parent: HTMLElement, label: string, items: any[], render: (item: any, index: number, node: HTMLElement) => void,
    create?: () => any, minimum = 1, removed?: (index: number) => void,
    options: { maximum?: number; reorderable?: boolean } = {}) => {
    const list = document.createElement('div'); list.className = 'chart-content-records'; parent.append(list);
    let add: HTMLButtonElement | undefined;
    const draw = () => {
      for (const input of checks.keys()) if (list.contains(input)) checks.delete(input);
      list.replaceChildren();
      items.forEach((item, i) => {
        const card = document.createElement('div'); card.className = 'chart-content-record';
        const heading = document.createElement('div'); heading.className = 'chart-content-record-heading';
        if (options.reorderable) heading.classList.add('chart-content-record-heading--reorderable');
        const caption = document.createElement('strong'); caption.textContent = `${label} ${i + 1}`; heading.append(caption);
        if (options.reorderable) {
          for (const direction of [-1, 1]) button(heading, t(direction < 0 ? 'collection.moveUp' : 'collection.moveDown'), () => {
            [items[i], items[i + direction]] = [items[i + direction], items[i]]; draw();
          }, i + direction < 0 || i + direction >= items.length);
        }
        if (create) button(heading, t('actions.removeItem', { v1: label, v2: i + 1 }), () => { items.splice(i, 1); removed?.(i); draw(); }, items.length <= minimum);
        card.append(heading); list.append(card); render(item, i, card);
      });
      if (add) add.disabled = items.length >= (options.maximum ?? Infinity);
    };
    if (create) add = button(parent, t('actions.addItem', { v1: label }), () => { items.push(create()); draw(); });
    draw(); return draw;
  };
  const form: ContentForm = { element, read() {
    if (!dirty) return { props: structuredClone(base) };
    let error = '';
    checks.forEach((check, field) => {
      if (!element.contains(field)) return;
      const message = check(); field.setAttribute('aria-invalid', String(Boolean(message))); field.setCustomValidity(message); error ||= message;
    });
    if (!error) for (const validate of validators) { error = validate() || ''; if (error) break; }
    return error ? { error } : { props: structuredClone(draft) };
  } };
  return { draft, form, element, section, text, number, select, toggle, button, row, collection, changed, clear,
    validate: (check: () => string | undefined) => validators.push(check) };
}

export function units(editor: ReturnType<typeof editorForm>, content: Draft) {
  const node = editor.section(t('sections.units'));
  const row = editor.row(node);
  editor.text(row, 'prefix', t('labels.prefix'), content.valuePrefix, value => { content.valuePrefix = value; });
  editor.text(row, 'suffix', t('labels.suffix'), content.valueSuffix, value => { content.valueSuffix = value; });
}

export function removeCategoryReferences(content: Draft, index: number) {
  if (content.annotation) {
    for (const key of ['from', 'to']) if (content.annotation[key] >= index) content.annotation[key] = Math.max(0, content.annotation[key] - 1);
  }
  if (content.callouts) content.callouts = content.callouts.filter((item: Draft) => item.index !== index)
    .map((item: Draft) => ({ ...item, index: item.index > index ? item.index - 1 : item.index }));
  if (content.comparisons) content.comparisons = content.comparisons.filter((item: Draft) => item.from !== index && item.to !== index)
    .map((item: Draft) => ({ ...item, from: item.from > index ? item.from - 1 : item.from, to: item.to > index ? item.to - 1 : item.to }));
}
