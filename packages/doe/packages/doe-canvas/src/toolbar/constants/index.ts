import type { ToolbarAnchorRecord } from "../contracts/index.ts";

export const WORK_EDITOR_PATH = '/yrkie-doe/work-editor/index.html';

export const TOOLBAR_PREVIEW_VERSION = 'v1';

export const COLLECTION_LABELS: Record<string, string> = {
  'unordered-list-item': '列表项目',
  'ordered-list-item': '有序列表项目',
  'item-card': '卡片项目',
  'todo-list-item': '待办列表项目',
  'progress-item': '进度项目',
  'capability-item': '能力卡片',
  'numbered-icon-card-item': '编号图标卡片',
  'table-row': '表格行',
  'circular-step': '循环步骤',
  'supply-stage': '供应链阶段',
  'chevron-item': '箭头阶段',
  'fishbone-branch': '鱼骨分支',
};

export const MEDIA_GROUPS: Record<string, { icon: string; layout: string }> = {
  项目布局: { icon: 'LayoutGrid', layout: 'compact' },
  图片大小: { icon: 'Expand', layout: 'list' },
  卡片底色: { icon: 'PanelsTopLeft', layout: 'list' },
  图片位置: { icon: 'GalleryHorizontalEnd', layout: 'positions' },
  格式: { icon: 'FileImage', layout: 'compact' },
  填充: { icon: 'Scan', layout: 'list' },
  比例: { icon: 'Ratio', layout: 'grid' },
  焦点: { icon: 'Focus', layout: 'focal' },
};

export const toolbarAnchors = new WeakMap<HTMLElement, ToolbarAnchorRecord>();

export const TOOLBAR_LAYER_CLASS = 'doe-toolbar-preview-layer';
