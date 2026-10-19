export const localeDefinitions = [
  { code: 'en', htmlLang: 'en', pathSegment: '', ogLocale: 'en_US', nativeName: 'English' },
  { code: 'zh-CN', htmlLang: 'zh-CN', pathSegment: 'zh-hans', ogLocale: 'zh_CN', nativeName: '简体中文' },
  { code: 'zh-TW', htmlLang: 'zh-TW', pathSegment: 'zh-hant', ogLocale: 'zh_TW', nativeName: '繁體中文' },
  { code: 'es', htmlLang: 'es', pathSegment: 'es', ogLocale: 'es_ES', nativeName: 'Español' },
  { code: 'ja', htmlLang: 'ja', pathSegment: 'ja', ogLocale: 'ja_JP', nativeName: '日本語' },
  { code: 'ko', htmlLang: 'ko', pathSegment: 'ko', ogLocale: 'ko_KR', nativeName: '한국어' },
  { code: 'fr', htmlLang: 'fr', pathSegment: 'fr', ogLocale: 'fr_FR', nativeName: 'Français' },
  { code: 'de', htmlLang: 'de', pathSegment: 'de', ogLocale: 'de_DE', nativeName: 'Deutsch' },
  { code: 'pt-BR', htmlLang: 'pt-BR', pathSegment: 'pt-br', ogLocale: 'pt_BR', nativeName: 'Português (Brasil)' },
] as const;

export type SupportedLocale = (typeof localeDefinitions)[number]['code'];

export const defaultLocale: SupportedLocale = 'en';
export const supportedLocales = localeDefinitions.map(({ code }) => code) as SupportedLocale[];

const definitionByCode = new Map<SupportedLocale, (typeof localeDefinitions)[number]>(
  localeDefinitions.map((definition) => [definition.code, definition]),
);

const localeAliases = new Map<string, SupportedLocale>([
  ['en', 'en'],
  ['en-us', 'en'],
  ['zh-cn', 'zh-CN'],
  ['zh-hans', 'zh-CN'],
  ['zh-tw', 'zh-TW'],
  ['zh-hant', 'zh-TW'],
  ['es', 'es'],
  ['ja', 'ja'],
  ['ko', 'ko'],
  ['fr', 'fr'],
  ['de', 'de'],
  ['pt', 'pt-BR'],
  ['pt-br', 'pt-BR'],
]);

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && definitionByCode.has(value as SupportedLocale);
}

export function normalizeLocale(value: unknown): SupportedLocale | null {
  if (typeof value !== 'string') return null;
  return localeAliases.get(value.trim().replace('_', '-').toLowerCase()) ?? null;
}

export function getLocaleDefinition(locale: SupportedLocale) {
  return definitionByCode.get(locale) ?? definitionByCode.get(defaultLocale)!;
}

export function localeFromPathSegment(segment: string) {
  const normalized = segment.trim().toLowerCase();
  if (normalized === 'en') return defaultLocale;
  return localeDefinitions.find((definition) => definition.pathSegment === normalized)?.code ?? null;
}
