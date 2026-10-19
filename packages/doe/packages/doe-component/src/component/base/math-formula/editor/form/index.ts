import { editorForm } from "../../../../../shared/editor/form-controls/index.ts";
import { t } from "../../../../../shared/editor/i18n/index.ts";
import type { UnknownRecord } from "../../../../../shared/editor/types/index.ts";

const formulas = [
  ['quadratic', 'x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}'],
  ['pythagorean', 'a^2+b^2=c^2'],
  ['fraction', '\\frac{a}{b}'],
  ['sum', '\\sum_{i=1}^{n} x_i'],
  ['integral', '\\int_a^b f(x)\\,dx'],
  ['limit', '\\lim_{x\\to 0}\\frac{\\sin x}{x}=1'],
] as const;

export function createFormulaForm(base: UnknownRecord, onChange: () => void) {
  const editor = editorForm(base, onChange);
  const section = editor.section(t('source.math'), t('source.mathHint'));
  const source = editor.text(section, 'formula', 'LaTeX', editor.draft.content.formula,
    value => { editor.draft.content.formula = value; }, true, true);
  source.classList.add('content-source-input'); source.spellcheck = false;
  const quick = editor.section(t('source.quick'));
  const search = document.createElement('input'); search.type = 'search';
  search.setAttribute('aria-label', t('source.search')); search.placeholder = t('source.search');
  const list = document.createElement('div'); list.className = 'content-formula-list';
  quick.append(search, list);
  const draw = () => {
    list.replaceChildren();
    const query = search.value.toLocaleLowerCase().trim();
    for (const [key, formula] of formulas) {
      const label = t(`source.${key}`);
      if (!`${label} ${formula}`.toLocaleLowerCase().includes(query)) continue;
      editor.button(list, label, () => { source.value = formula; editor.draft.content.formula = formula; });
    }
    if (!list.childElementCount) { const empty = document.createElement('p'); empty.textContent = t('source.noResults'); list.append(empty); }
  };
  search.addEventListener('input', draw); draw();
  const ai = editor.section(t('source.ai'), t('source.aiPending'));
  editor.button(ai, t('source.ai'), () => {}, true);
  return editor.form;
}
