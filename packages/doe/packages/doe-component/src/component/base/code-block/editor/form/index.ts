import { editorForm } from "../../../../../shared/editor/form-controls/index.ts";
import { t } from "../../../../../shared/editor/i18n/index.ts";
import type { UnknownRecord } from "../../../../../shared/editor/types/index.ts";

export function createCodeForm(base: UnknownRecord, onChange: () => void) {
  const editor = editorForm(base, onChange);
  if (!Object.hasOwn(base, 'content')) delete editor.draft.content;
  const section = editor.section(t('source.code'), t('source.codeHint'));
  editor.select(section, 'language', t('source.language'), base.language || 'text',
    ['python', 'javascript', 'typescript', 'json', 'html', 'css', 'sql', 'shell', 'text'].map(value => [value, value]),
    value => { editor.draft.language = value; });
  const source = editor.text(section, 'code', t('source.code'), base.code, value => { editor.draft.code = value; }, true, true);
  source.classList.add('content-source-input'); source.spellcheck = false;
  editor.toggle(section, t('source.wrap'), base.wrap !== false, value => { editor.draft.wrap = value; });
  return editor.form;
}
