import { appI18n } from '@yrkie/application/i18n/i18n';

const codes = new Set(['overflow', 'stale', 'busy', 'media-required', 'locked', 'limit', 'timeout', 'unsaved', 'not-ready']);
export function insertionError(code: string, locale = appI18n.resolvedLanguage || appI18n.language): string {
  const key = code === 'insert-readonly' ? 'not-ready' : code.replace(/^insert-/, '');
  return appI18n.t(`insert.${codes.has(key) ? key : 'failed'}`, { ns: 'doeInteraction', lng: locale });
}
