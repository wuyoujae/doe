import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { normalizeLocale, supportedLocales } from './locales';
import { commonResources } from './resources/common';
import { workResources } from './resources/work';
import { editorResources } from './resources/editor';
import { doeEditorResources } from './resources/doeEditor';
import { doeToolbarResources } from './resources/doeToolbar';
import { doeInteractionResources } from './resources/doeInteraction';
import { uiResources } from './resources/ui';
import { settingsResources } from './resources/settings';
import { doeSettingsResources } from './resources/doeSettings';
import { createTranslations } from '../pages/create/translations';
import { generationResources } from './resources/generation';
import { presentationResources } from '../features/presentation/resources';

const resources = Object.fromEntries(supportedLocales.map(locale => [locale, {
  common: commonResources[locale], generation: generationResources[locale], presentation: presentationResources[locale], work: workResources[locale], editor: editorResources[locale],
  doeEditor: doeEditorResources[locale], doeToolbar: doeToolbarResources[locale],
  doeInteraction: doeInteractionResources[locale], ui: uiResources[locale], settings: settingsResources[locale], doeSettings: doeSettingsResources[locale], ...createTranslations[locale],
}]));
let locale = normalizeLocale(navigator.language) || 'en';
try { locale = normalizeLocale(localStorage.getItem('yrkie.locale')) || locale; } catch { /* Language still works in memory. */ }
export const appI18n = createInstance();
void appI18n.use(initReactI18next).init({
  resources, lng: locale, fallbackLng: 'en', supportedLngs: supportedLocales,
  defaultNS: 'common', fallbackNS: 'common', initAsync: false,
  interpolation: { escapeValue: false }, returnEmptyString: false, returnNull: false,
});
document.documentElement.lang = locale;
appI18n.on('languageChanged', language => {
  document.documentElement.lang = language;
  try { localStorage.setItem('yrkie.locale', language); } catch { /* Keep the chosen in-memory language. */ }
});
