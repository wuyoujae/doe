import { appI18n } from '@yrkie/application/i18n/i18n.ts';
import { configureEditorTranslations } from '../../../packages/doe-component/src/shared/editor/i18n/index.ts';

// Resolve at call time so the original application language-change behavior is retained.
configureEditorTranslations((key, values) => appI18n.t(key, { ns: 'doeEditor', ...values }));
