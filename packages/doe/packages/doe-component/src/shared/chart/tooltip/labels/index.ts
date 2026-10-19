import locale0 from './locales/en/index.json';
import locale1 from './locales/zh-CN/index.json';
import locale2 from './locales/zh-TW/index.json';
import locale3 from './locales/es/index.json';
import locale4 from './locales/pt-BR/index.json';
import locale5 from './locales/fr/index.json';
import locale6 from './locales/de/index.json';
import locale7 from './locales/ja/index.json';
import locale8 from './locales/ko/index.json';
const locales = { 'en': locale0, 'zh-CN': locale1, 'zh-TW': locale2, 'es': locale3, 'pt-BR': locale4, 'fr': locale5, 'de': locale6, 'ja': locale7, 'ko': locale8 };
export function chartLocale(doc: Document = document): keyof typeof locales {
  let language = doc.documentElement.lang || 'en';
  try { language = doc.defaultView?.parent.document.documentElement.lang || language; } catch { /* Cross-origin embeds retain their own locale. */ }
  const code = language.toLowerCase();
  if (code.startsWith('zh')) return /tw|hk|hant/.test(code) ? 'zh-TW' : 'zh-CN';
  if (code.startsWith('pt')) return 'pt-BR';
  const base = code.split('-')[0];
  return base in locales ? base as keyof typeof locales : 'en';
}
export function chartLabels(doc: Document = document) { return locales[chartLocale(doc)]; }
