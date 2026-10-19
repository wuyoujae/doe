import { appI18n } from '@yrkie/application/i18n/i18n.ts';
import { COMPONENT_NAMES, type ComponentName } from '../../../packages/doe-component/src/catalog/names.ts';

export function localizedComponentLabel(entry: ComponentName, locale = appI18n.resolvedLanguage || appI18n.language): string {
  return entry.presentation
    ? appI18n.t(`replacement.names.${entry.presentation.replace(/[:-]/g, '_')}`, { ns: 'doeEditor', lng: locale })
    : appI18n.t(`catalog.${entry.name}`, { ns: 'doeInteraction', lng: locale });
}

export function translateComponentLabel(source: string): string | undefined {
  const entry = COMPONENT_NAMES.find(entry => entry.zh === source || entry.en === source);
  return entry && localizedComponentLabel(entry);
}
