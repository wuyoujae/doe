import { appI18n } from '../../../../i18n/i18n';
import { doeQuestionsResources } from './question-resources';

for (const [locale, resources] of Object.entries(doeQuestionsResources)) {
  appI18n.addResourceBundle(locale, 'doeQuestions', resources, true, true);
}
