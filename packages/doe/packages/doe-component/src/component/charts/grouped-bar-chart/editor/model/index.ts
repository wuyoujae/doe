import { t } from "../../../../../shared/editor/i18n/index.ts";
import type { UnknownRecord } from "../../../../../shared/editor/types/index.ts";

export interface BarDraft {
  categories: string[];
  series: { name: string; data: string[]; original: UnknownRecord }[];
  prefix: string;
  suffix: string;
  maximum: string;
  interval: string;
  legend: boolean;
}

export function barDraft(props: UnknownRecord): BarDraft {
  const content = props.content as UnknownRecord;
  return {
    categories: (content.categories as unknown[]).map(String),
    series: (content.series as UnknownRecord[]).map(series => ({
      name: String(series.name ?? ''), data: (series.data as unknown[]).map(String), original: structuredClone(series),
    })),
    prefix: String(content.valuePrefix ?? ''), suffix: String(content.valueSuffix ?? ''),
    maximum: String(content.maxValue ?? ''), interval: String(content.tickInterval ?? ''), legend: props.showLegend !== false,
  };
}

export function parseBarDraft(base: UnknownRecord, draft: BarDraft) {
  const errors: Record<string, string> = {};
  const required = (key: string, text: string) => { if (!text.trim()) errors[key] = t('errors.nameRequired'); };
  draft.categories.forEach((name, i) => required(`category-${i}`, name));
  draft.series.forEach((series, s) => {
    required(`series-${s}`, series.name);
    series.data.forEach((value, c) => {
      if (!value.trim() || !Number.isFinite(Number(value)) || Number(value) < 0) errors[`value-${s}-${c}`] = t('errors.nonnegative');
    });
  });
  if (!draft.categories.length || !draft.series.length || draft.series.some(series => series.data.length !== draft.categories.length)) {
    errors.data = t('errors.matrixShape');
  }
  const dataMax = Math.max(0, ...draft.series.flatMap(series => series.data.map(Number)));
  const maximum = draft.maximum.trim() ? Number(draft.maximum) : undefined;
  const interval = draft.interval.trim() ? Number(draft.interval) : undefined;
  if (maximum !== undefined && (!Number.isFinite(maximum) || maximum <= 0 || maximum < dataMax)) errors.maximum = t('errors.positiveAxisMax');
  if (interval !== undefined && (!Number.isFinite(interval) || interval <= 0)) errors.interval = t('errors.positiveInterval');
  if (interval && Math.ceil((maximum || dataMax) / interval) > 100) errors.interval = t('errors.denseTicks');
  if (Object.keys(errors).length) return { errors, props: null };
  const props = structuredClone(base);
  const content = props.content as UnknownRecord;
  props.showLegend = draft.legend;
  content.categories = [...draft.categories];
  content.series = draft.series.map(series => ({ ...series.original, name: series.name, data: series.data.map(Number) }));
  content.valuePrefix = draft.prefix; content.valueSuffix = draft.suffix;
  if (maximum === undefined) delete content.maxValue; else content.maxValue = maximum;
  if (interval === undefined) delete content.tickInterval; else content.tickInterval = interval;
  return { props, errors };
}
