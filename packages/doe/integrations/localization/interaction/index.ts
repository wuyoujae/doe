import { appI18n } from '@yrkie/application/i18n/i18n.ts';
import { supportedLocales } from '@yrkie/application/i18n/locales.ts';
import { translateComponentLabel } from '../catalog/index.ts';

// These are renderer-owned UI contracts, never authored slide content.
export const interactionLabelKeys: Record<string, string> = {
  '按落点插入': 'drag.reorder', '合为两列': 'drag.compose', '移出此组': 'drag.detach',
  '适配目标样式并合入': 'drag.transfer', '松开：仅换序': 'drag.release',
  '拖动整个组合': 'drag.group', '拖动当前元素': 'drag.element',
  '新增内容项': 'addItem', '删除': 'delete', '删除幻灯片': 'deleteSlide',
  '已达到最少内容项数': 'minimumItems', '本页至少保留一个组件': 'minimumBlocks',
  '调整贴边图片占比': 'edgeRatio', '内容已达安全边界': 'safeBoundary', '内容当前无法安全排版': 'unsafeLayout',
  '贴边图片区与安全区边界不参与拆合': 'errors.edge', '贴边图片不参与拆合': 'errors.edge',
  '此组件或父组已锁定结构': 'errors.locked', '只能操作安全区内部的内容': 'errors.safeArea',
  '不能跨越贴边布局的安全区边界': 'errors.safeArea', '内容项已变化，请重新拖动': 'errors.changed',
  '拖动对象已变化，请重新拖动': 'errors.changed', '目标已经不在页面中': 'errors.changed',
  '内容项已变化，请重新打开': 'errors.changed', '内容已变化，请重新选择样式。': 'errors.changed',
  '组件标识重复': 'errors.duplicate', '内容项标识重复': 'errors.duplicate', '页面组件数量超过上限': 'insert.limit',
  '组合最多嵌套 3 层': 'errors.depth', '组合超过最多 24 个成员': 'errors.members',
  '无效拖动落点': 'errors.drop', '不能把组合放进自身的子项': 'errors.self',
  '这里只接纳 Contents 内容项': 'errors.contentsOnly', '此组件不支持拆分内容项': 'errors.noSplit',
  '内容不能为空': 'errors.empty', '请输入有效数字': 'errors.number',
  '空间不足：已保留原内容，修改未应用。': 'errors.space',
  '空间不足：完整内容在 small 字号下仍超出页面或图形文字区域，修改未应用。': 'errors.space',
  '空间不足，提交时将保留原内容。': 'errors.space',
  '切换后无法完整显示原文，修改未应用。': 'errors.space',
  '空间不足：已尝试自动排版和压缩，无法添加新内容项。': 'insert.overflow',
  '空间不足：已尝试自动排版和压缩，无法添加新内容项': 'insert.overflow',
  '组合后出现低于当前文字下限的内容': 'errors.space', '组合后组件宽度低于安全阈值': 'errors.space',
  '组合后发生溢出或重叠': 'errors.space',
  '幻灯片渲染失败': 'errors.render', '无法载入 Deck': 'errors.load', 'Yrkie-doe 初始化失败': 'errors.initialize',
  '无法解析 Deck JSON': 'errors.deck', 'Deck 至少需要一张幻灯片': 'errors.deck', 'Deck revision 无效': 'errors.deck',
  '幻灯片编辑器': 'editorAria', 'Yrkie 幻灯片编辑器': 'editorAria', '页面设置': 'slideSettings', '当前幻灯片属性': 'slideProperties',
  '新建': 'newSlide', '添加幻灯片': 'newSlide', '新幻灯片': 'newSlide',
  '标题': 'fields.title', '描述': 'fields.description', '正文': 'fields.body', '图标': 'fields.icon',
  '底部数值': 'fields.bottomValue', '思维导图': 'catalog.tree-mind-map', '百分比进度': 'catalog.vertical-percentage-bars',
  '交错徽章卡片': 'catalog.staggered-arrow-cards',
  '需要 1–40 个节点': 'mind.nodeRange', '第一个节点必须是 level=0 的根节点': 'mind.rootError',
  '层级需连续，子节点紧跟父节点，最多六层': 'mind.levelError', '根节点下最多六个分支': 'mind.branchError',
  '每个节点都需要标题和描述': 'mind.contentError',
  '选中文字格式': 'format.selection', '字号': 'format.size', '组件默认': 'format.default', '混合字号': 'format.mixed',
  '标记': 'format.mark', '恢复默认样式': 'format.reset', '文字颜色': 'format.color', '选择文字颜色': 'format.chooseColor',
  '主题颜色': 'format.themeColors', '系统颜色': 'format.systemColors', '主题主色': 'format.primary', '主题辅色': 'format.secondary',
  '正文色': 'format.bodyColor', '标题色': 'format.headingColor', '浅色': 'format.light', '恢复默认颜色': 'format.resetColor',
  '空间不足：重排、压缩及降列后仍无法完整容纳内容': 'errors.space',
  '排版空间分配尚未稳定：本次结果未被接受，请重新排版': 'unsafeLayout',
  '内容空间不足：继续缩放会低于可读字号，拒绝本次修改': 'errors.space',
  '内容空间不足：最小文字与省略号仍无法容纳，拒绝本次修改': 'errors.space',
  '组件空间不足：调整列数、弹性高度和可读字号后仍无法容纳，拒绝本次修改': 'errors.space',
  '贴边区域未对齐安全画布': 'unsafeLayout', '内容超出安全区域': 'errors.space', '图形空间不足，无法安全容纳完整内容': 'errors.space',
  '组件宽度低于安全阈值': 'unsafeLayout', '文字无法在语义边界内安全换行': 'unsafeLayout',
  '字体仍在变化，排版计划尚未稳定': 'unsafeLayout', '内容在最终排版后超出安全区域': 'errors.space',
  '文字低于最小字号': 'unsafeLayout', '组件发生重叠': 'unsafeLayout', '内容无法安全排版': 'unsafeLayout',
};

export const interactionT = (key: string, values?: Record<string, unknown>) => appI18n.t(key, { ns: 'doeInteraction', ...values });

// Cloned loading controls and pending errors may already carry a prior locale.
const localizedKeys = new Map<string, string>();
function remember(values: Record<string, unknown>, prefix = '') {
  for (const [name, value] of Object.entries(values)) {
    const key = prefix ? `${prefix}.${name}` : name;
    if (typeof value === 'string' && !value.includes('{{')) localizedKeys.set(value, key);
    else if (value && typeof value === 'object') remember(value as Record<string, unknown>, key);
  }
}
for (const locale of supportedLocales) remember(appI18n.getResourceBundle(locale, 'doeInteraction'));

export function translateInteractionLabel(source: string, translate: (source: string) => string): string | undefined {
  const key = interactionLabelKeys[source] ?? localizedKeys.get(source);
  if (key) return interactionT(key);
  const catalog = translateComponentLabel(source);
  if (catalog) return catalog;
  const existing: Record<string, [string, string]> = {
    '关闭': ['work', 'settings.close'], '正在准备幻灯片…': ['work', 'studio.loading'],
    '上一页': ['work', 'visual.previous'], '下一页': ['work', 'visual.next'], '幻灯片缩略图': ['work', 'visual.filmstripAria'],
    '封面': ['doeInteraction', 'catalog.title-group'], '替换图片': ['doeEditor', 'images.replace'],
    'Schema Deck changed.': ['work', 'studio.revisionConflict'],
  };
  const known = existing[source];
  if (known) return appI18n.t(known[1], { ns: known[0] });
  if (/^schema-deck-(?:editor-|flush-|sync-|save-|not-ready)/.test(source)) return appI18n.t('toolbar.saveFailed', { ns: 'work' });
  for (const key of ['studio.loading', 'studio.loadFailed', 'studio.revisionConflict', 'toolbar.saveFailed']) {
    if (supportedLocales.some(locale => appI18n.getResource(locale, 'work', key) === source)) return appI18n.t(key, { ns: 'work' });
  }
  let match;
  if ((match = /^删除第 (\d+) 页$/.exec(source))) return `${interactionT('deleteSlide')} ${match[1]}`;
  if ((match = /^第 (\d+) 页$/.exec(source))) return `${appI18n.t('canvasView.page', { ns: 'work' })} ${match[1]}`;
  if ((match = /^图片(最小|最大) (\d+)%$/.exec(source))) return interactionT(match[1] === '最小' ? 'edgeMinimum' : 'edgeMaximum', { value: match[2] });
  if ((match = /^(拖动整个组合|拖动元素) (.+)$/.exec(source))) return `${interactionT(match[1] === '拖动整个组合' ? 'drag.group' : 'drag.element')} ${match[2]}`;
  if ((match = /^内容项 (\d+)，拖动换序、拆分或合入$/.exec(source))) return interactionT('drag.item', { number: match[1] });
  if ((match = /^内部项目 (\d+)，可拖动换序$/.exec(source))) return interactionT('drag.itemReorder', { number: match[1] });
  if ((match = /^内容项 (\d+)$/.exec(source))) return interactionT('item', { number: match[1] });
  if ((match = /^最多支持 (\d+) 个内容项$/.exec(source))) return interactionT('maximumItems', { max: match[1] });
  if ((match = /^请输入 (.+) 到 (.+) 之间的数字$/.exec(source))) return interactionT('errors.numberRange', { min: match[1], max: match[2] });
  if ((match = /^(.+)需要 (\d+)–(\d+) 个内容项$/.exec(source))) return interactionT('errors.itemRange', { name: translate(match[1]), min: match[2], max: match[3] });
  if ((match = /^(.+)需要(.+)，请先补充内容$/.exec(source))) return interactionT('errors.requiredField', { name: translate(match[1]), field: translate(match[2]) });
  if ((match = /^(.+)最少需要 (\d+) 项，不能拆成单项组件$/.exec(source))) return interactionT('errors.minimumSplit', { name: translate(match[1]), min: match[2] });
  if ((match = /^(.+)（当前自动适配为(竖排|横排)）$/.exec(source))) return interactionT('autoDirection', { action: translate(match[1]), direction: interactionT(match[2] === '竖排' ? 'vertical' : 'horizontal') });
  if ((match = /^(组合|集合|内部集合) · (.+)$/.exec(source))) return `${translate(match[1] === '组合' ? '组合布局' : '集合')} · ${match[2]}`;
  if ((match = /^第\s*\d+\s*张幻灯片缺少 blocks$/.exec(source))) return interactionT('errors.deck');
  if ((match = /^(Slide|幻灯片) (\d+)$/.exec(source))) return `${appI18n.t('canvasView.page', { ns: 'work' })} ${match[2]}`;
  return undefined;
}
