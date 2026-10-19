import type { SupportedLocale } from '../locales';

export type TranslationTree = {
  [key: string]: string | TranslationTree;
};

type DeepStringShape<T> = T extends string
  ? string
  : T extends Record<string, unknown>
    ? { [Key in keyof T]: DeepStringShape<T[Key]> }
    : never;

type OtherLocale = Exclude<SupportedLocale, 'en'>;

export function defineNamespace<const EnglishTree extends TranslationTree>(resources: {
  en: EnglishTree;
} & Record<OtherLocale, DeepStringShape<EnglishTree>>) {
  return resources;
}

