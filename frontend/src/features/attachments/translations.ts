import { appI18n } from '../../i18n/i18n';
import { uploadResources } from '../../i18n/resources/uploads';

for (const [locale, resources] of Object.entries(uploadResources)) {
  appI18n.addResourceBundle(locale, 'uploads', resources, true, true);
}
