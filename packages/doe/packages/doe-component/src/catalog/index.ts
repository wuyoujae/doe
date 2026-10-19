import { componentName } from './names.ts';
import { definition as component0 } from '../component/contents/contents/catalog/index.ts';
import { definition as funnel3d } from '../component/diagrams/3d-funnel/catalog.ts';
import { definition as mindMap } from '../component/charts/mind-map/catalog.ts';
import { diagramDefinitions } from '../component/diagrams/catalog.ts';
import { definition as component2 } from '../component/contents/image-text/catalog/index.ts';
import { definition as component3 } from '../component/contents/icon-text/catalog/index.ts';
import { definition as component4 } from '../component/contents/shape-contents/catalog/index.ts';
import { definition as component5 } from '../component/contents/item-cards/catalog/index.ts';
import { definition as component6 } from '../component/base/hero/catalog/index.ts';
import { definition as component7 } from '../component/base/heading/catalog/index.ts';
import { definition as component8 } from '../component/base/text/catalog/index.ts';
import { definition as component9 } from '../component/base/code-block/catalog/index.ts';
import { definition as component10 } from '../component/base/list/catalog/index.ts';
import { definition as component11 } from '../component/base/ordered-list/catalog/index.ts';
import { definition as component12 } from '../component/base/todo-list/catalog/index.ts';
import { definition as component13 } from '../component/base/notice/catalog/index.ts';
import { definition as component14 } from '../component/contents/question-card/catalog/index.ts';
import { definition as component15 } from '../component/contents/quote/catalog/index.ts';
import { definition as component16 } from '../component/base/media/catalog/index.ts';
import { definition as component17 } from '../component/base/stat/catalog/index.ts';
import { definition as component18 } from '../component/charts/table/catalog/index.ts';
import { definition as component19 } from '../component/charts/grouped-bar-chart/catalog/index.ts';
import { definition as component20 } from '../component/charts/line-chart/catalog/index.ts';
import { definition as component21 } from '../component/charts/stacked-bar-chart/catalog/index.ts';
import { definition as component22 } from '../component/charts/risk-matrix/catalog/index.ts';
import { definition as component23 } from '../component/charts/waterfall-chart/catalog/index.ts';
import { definition as component25 } from '../component/charts/radar-chart/catalog/index.ts';
import { definition as component26 } from '../component/charts/donut-chart/catalog/index.ts';
import { definition as component35 } from '../component/contents/capability-cards/catalog/index.ts';
import { definition as component36 } from '../component/contents/numbered-icon-cards/catalog/index.ts';
import { definition as component38 } from '../component/base/math-formula/catalog/index.ts';
export const COMPONENT_CATEGORIES = [
  { id: 'base', label: 'Base（基础组件）', en: 'Base' },
  { id: 'contents', label: 'Contents（内容组件）', en: 'Contents' },
  { id: 'diagrams', label: 'Diagrams（图形组件）', en: 'Diagrams' },
  { id: 'charts', label: 'Charts（图表组件）', en: 'Charts' },
] as const;

export type ComponentCategory = typeof COMPONENT_CATEGORIES[number]['id'];

import { definition as textPanel } from '../component/base/text-panel/catalog.ts';

export const COMPONENT_DEFINITIONS = [
  textPanel,
  mindMap,
  funnel3d,
  ...diagramDefinitions,
  component0,
  component2,
  component3,
  component4,
  component5,
  component6,
  component7,
  component8,
  component9,
  component10,
  component11,
  component12,
  component13,
  component14,
  component15,
  component16,
  component17,
  component18,
  component19,
  component20,
  component21,
  component22,
  component23,
  component25,
  component26,
  component35,
  component36,
  component38,
] as const satisfies ReadonlyArray<{
  type: string;
  label: string;
  category: ComponentCategory;
  summary: string;
}>;

export type PublicComponentType = typeof COMPONENT_DEFINITIONS[number]['type'];


export const COLUMN_PRESETS = ([2, 3, 4] as const).map(columns => ({
  type: `columns-${columns}` as const,
  componentType: 'layout-group' as const,
  label: `${{ 2: '两', 3: '三', 4: '四' }[columns]}栏布局`,
  category: 'contents' as const,
  summary: '透明分列容器；每列容纳独立组件，按内容最小宽度压缩和换行。',
  layout: { variant: 'columns' as const, columns },
}));

export const ITEM_CARD_PRESETS = [
  ['filled-icon', '左上图标卡片'], ['outline', '描边卡片'], ['side-rule', '左侧色条卡片'],
  ['top-rule', '顶部色条卡片'], ['top-icon', '顶置圆章卡片'], ['connected', '连体分格卡片'],
  ['connected-icon', '图标连接卡片'], ['leaf', '对角圆角卡片'],
  ['quote', '引号边框卡片'], ['bubble', '对话气泡卡片'],
] as const;

export const SHAPE_CONTENT_PRESETS = [
  ['petals', '花瓣关系图'], ['cycle-arrows', '环形箭头循环图'], ['full-circle', '圆形分区图'], ['ring', '圆环节点图'], ['stairs', '逐层加宽阶梯图'], ['pyramid', '分层正三角图'], ['inverted-pyramid', '分层倒三角图'],
] as const;

export const CONTENTS_PRESENTATION_PRESETS = [
  ['numbered-parallelogram', '斜角编号流程'],
  ['numbered-pill', '胶囊编号流程'],
  ['numbered-chevron', '燕尾箭头流程'],
  ['ascending-bar', '阶梯横条流程'],
  ['ascending-arrow', '阶梯箭头流程'],
  ['ascending-numbered', '编号阶梯横条流程'],

  ['alternating', '无标记卡片时间线'],
  ['icon-horizontal', '左图标右文字'],
  ['dot-card', '圆点浅底卡片'],
  ['dot-list', '圆点要点组'],
  ['numbered-top-rule', '顶部编号横线卡片'],
  ['numbered-inline', '左侧编号卡片'],
  ['timeline-numbered', '编号节点时间线'],
  ['timeline-dots', '圆点节点时间线'],
  ['timeline-dot-cards', '圆点卡片时间线'],
] as const;

export const COMPONENT_PRESETS = [
  ...CONTENTS_PRESENTATION_PRESETS.map(([presentation, label]) => ({
    type: `contents-${presentation}` as const, componentType: 'contents' as const,
    label,
    category: 'contents' as const, summary: '完整内容、同排等宽、所有条目等高，优先重排再缩字。', props: { presentation },
  })),
  ...COLUMN_PRESETS,
  ...SHAPE_CONTENT_PRESETS.map(([variant, label]) => ({
    type: `shape-contents-${variant}` as const, componentType: 'shape-contents' as const,
    label, category: 'contents' as const, summary: '图形与标题、正文关联展示，保留文字宽度并随内容增高。', props: { variant },
  })),
  ...ITEM_CARD_PRESETS.map(([variant, label]) => ({
    type: `item-cards-${variant}` as const,
    componentType: 'item-cards' as const,
    label, category: 'contents' as const,
    summary: '标题与正文独立编辑，卡片按最小列宽自动换行。',
    props: { variant },
  })),
];

export type ComponentPresetType = typeof COMPONENT_PRESETS[number]['type'];
export type ComponentCatalogEntry = {
  type: PublicComponentType | ComponentPresetType | 'layout-group';
  componentType: PublicComponentType | 'layout-group';
  label: string;
  category: ComponentCategory;
  summary: string;
  kind: 'component' | 'preset' | 'structure';
  authorable: boolean;
  props?: { presentation: typeof CONTENTS_PRESENTATION_PRESETS[number][0] } | { variant: typeof ITEM_CARD_PRESETS[number][0] | typeof SHAPE_CONTENT_PRESETS[number][0] };
  layout?: { variant: 'columns'; columns: 2 | 3 | 4 };
};

/** All released leaf types are authorable; structural entries remain separate. */
export const COMPONENT_CATALOG: readonly ComponentCatalogEntry[] = Object.freeze([
  ...COMPONENT_DEFINITIONS.map(definition => ({
    ...definition, componentType: definition.type, kind: 'component' as const,
    authorable: true,
  })),
  ...COMPONENT_PRESETS.map(preset => ({ ...preset, kind: 'preset' as const, authorable: true })),
  { type: 'layout-group' as const, componentType: 'layout-group' as const, label: '自动布局组', category: 'contents' as const,
    summary: '控制行列、集合、局部簇与自动重排，不属于公开叶子组件。', kind: 'structure' as const, authorable: false },
].map(entry => Object.freeze({ ...entry, label: componentName(entry.type)?.zh ?? entry.label })));

const definitionsByType = new Map<string, ComponentCatalogEntry>(COMPONENT_CATALOG.map(entry => [entry.type, entry]));
export function getComponentDefinition(type: string): ComponentCatalogEntry | undefined {
  return definitionsByType.get(type);
}
export function listAuthorableComponents(category?: ComponentCategory): readonly ComponentCatalogEntry[] {
  return COMPONENT_CATALOG.filter(entry => entry.authorable && (!category || entry.category === category));
}

export const DOE_COMPONENT_LIBRARY = Object.freeze({
  categories: COMPONENT_CATEGORIES,
  components: Object.freeze(listAuthorableComponents()),
});

type CategorizedNode = { type?: string; layout?: { variant?: string }; children?: CategorizedNode[] };
/** Match SlideEngine.componentCategory, including nested content groups. */
export function getComponentCategory(node: string | CategorizedNode): ComponentCategory {
  const type = typeof node === 'string' ? node : node.type || '';
  return getComponentDefinition(type)?.category || 'base';
}
