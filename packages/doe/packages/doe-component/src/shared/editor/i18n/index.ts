export type EditorTranslator = (key: string, values?: Record<string, unknown>) => string;
let translate: EditorTranslator;

export function configureEditorTranslations(translator: EditorTranslator): void {
  translate = translator;
}

/** Resolve on use, so opening a panel follows the current application locale. */
export function t(key: string, values?: Record<string, unknown>): string {
  return translate(key, values);
}
