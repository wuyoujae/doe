import { t } from "../../../../../shared/editor/i18n/index.ts";
import type { UnknownRecord } from "../../../../../shared/editor/types/index.ts";
import { seriesForm } from "../../../../../shared/editor/series-form/index.ts";

export function createStackedBarForm(base: UnknownRecord, onChange: () => void) {
  const e = seriesForm(base, onChange, true); const c = e.draft.content;
  const options = e.section(t('sections.stackedLabels'));
  e.toggle(options, t('labels.showValues'), c.showValues !== false, value => { c.showValues = value; });
  e.toggle(options, t('labels.showYAxis'), c.showYAxis === true, value => { c.showYAxis = value; });
  return e.form;
}

