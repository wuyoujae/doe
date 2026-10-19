import { t } from "../../../../../shared/editor/i18n/index.ts";
import type { UnknownRecord } from "../../../../../shared/editor/types/index.ts";
import { seriesForm } from "../../../../../shared/editor/series-form/index.ts";

export function createLineForm(base: UnknownRecord, onChange: () => void) {
  const e = seriesForm(base, onChange, false);
  e.toggle(e.section(t('sections.lineStyle')), t('labels.smooth'), e.draft.smooth !== false, value => { e.draft.smooth = value; });
  return e.form;
}

