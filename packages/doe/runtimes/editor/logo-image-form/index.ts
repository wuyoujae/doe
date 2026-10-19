import type { ContentForm, UnknownRecord } from '../../../packages/doe-component/src/shared/editor/types/index.ts';

/** Studio-only file picker. Work uses the authenticated project image catalogue. */
import { t } from '../../../packages/doe-component/src/shared/editor/i18n/index.ts';

export function createLogoImageForm(base: UnknownRecord, onChange: () => void): ContentForm {
  let src = String(base.src || '');
  let error = '';
  let disposed = false;
  let revision = 0;
  const element = document.createElement('form');
  element.className = 'chart-editor-form';
  const label = document.createElement('label');
  // i18n-ignore: Studio-only fixture picker; production Work uses the localized image catalogue.
  label.textContent = t('doeInteraction:logo.file');
  const file = document.createElement('input');
  file.type = 'file'; file.accept = 'image/png,image/jpeg,image/webp';
  label.append(file); element.append(label);
  file.onchange = () => {
    const selected = file.files?.[0];
    const current = ++revision;
    if (!selected) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(selected.type) || !selected.size || selected.size > 20 * 1024 * 1024) {
      error = t('images.invalidFile'); onChange(); return;
    }
    error = t('doeInteraction:logo.reading'); onChange();
    const reader = new FileReader();
    reader.onload = () => {
      if (disposed || current !== revision) return;
      src = String(reader.result); error = ''; onChange();
    };
    reader.onerror = () => { if (!disposed && current === revision) { error = t('doeInteraction:logo.readFailed'); onChange(); } };
    reader.readAsDataURL(selected);
  };
  return { element, read: () => error ? { error } : src ? { props: { src, fit: 'contain' } } : { error: t('work:settings.chooseLogo') }, dispose: () => { disposed = true; } };
}
