import { appI18n } from '../../../i18n/i18n';
import { conversationResources } from './resources';
import '../components/generation/translations';

for (const [locale, namespaces] of Object.entries(conversationResources)) {
  for (const [namespace, resources] of Object.entries(namespaces)) {
    appI18n.addResourceBundle(locale, namespace, resources, true, true);
  }
}
