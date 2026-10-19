import { editorForm } from "../../../../../shared/editor/form-controls/index.ts";
import { t } from "../../../../../shared/editor/i18n/index.ts";
import type { UnknownRecord } from "../../../../../shared/editor/types/index.ts";

/** Deliberately read-only until project image sources are connected. */
export function createImageForm(base: UnknownRecord, onChange: () => void) {
  const editor = editorForm(base, onChange);
  for (const key of ['upload', 'ai', 'history'] as const) {
    const section = editor.section(t(`source.${key}`), t(`source.${key}Pending`));
    editor.button(section, t(`source.${key}`), () => {}, true);
  }
  return editor.form;
}
