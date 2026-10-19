import { useTranslation } from 'react-i18next';
import { Select } from '../ui/Select';
import { defaultLocale, localeDefinitions, normalizeLocale } from '../../i18n/locales';
import './LanguageSelector.css';

// i18n-ignore: English is the product's current accessibility default.
const LANGUAGE_SELECTOR_LABEL = 'Choose display language';

type LanguageSelectorProps = {
  className?: string;
};

export function LanguageSelector({ className = '' }: LanguageSelectorProps) {
  const { i18n } = useTranslation();
  const locale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language) ?? defaultLocale;
  return <Select className={'language-selector ' + className} label={LANGUAGE_SELECTOR_LABEL}
    placement={className.includes('account-menu') || className.includes('footer') ? 'up' : 'down'}
    value={locale} onChange={value => { void i18n.changeLanguage(value); }}
    options={localeDefinitions.map(definition => ({ value: definition.code, label: definition.nativeName }))} />;
}
