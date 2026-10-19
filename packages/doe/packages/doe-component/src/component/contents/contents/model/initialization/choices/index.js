import names from '../../../../../../catalog/names.json' with { type: 'json' };
import { shapeItemLimits } from '../../../../shape-contents/limits/index.js';
// Origin: public/yrkie-doe/core/contents-model.js:10
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.CHOICES = [
        { id: 'metrics', label: '指标', group: '卡片', type: 'stat', min: 1, max: 12, fields: ['title', 'label', 'text'], required: ['title'], columns: 12 },
        ...__doeScope.cards.map(([variant, label]) => ({ id: `cards:${variant}`, label, group: '卡片', type: 'item-cards', variant, min: 1, max: 12, fields: __doeScope.common, required: [], columns: 4, icons: variant.includes('icon') })),
        ...[['unordered', '无序列表', 'list'], ['ordered', '有序列表', 'ordered-list']].map(([variant, label, type]) => ({ id: `list:${variant}`, label, group: '列表', type, category: 'base', min: 1, max: 12, fields: __doeScope.common, required: [], columns: 2, icons: false })),
        { id: 'icon-text', label: '上图标下文', group: '卡片', type: 'icon-text', min: 1, max: 12, fields: __doeScope.common, required: [], columns: 4, icons: true },
        { id: 'dot-card', label: '圆点背景卡', group: '卡片', type: 'item-cards', min: 1, max: 12, fields: __doeScope.common, required: [], columns: 4 },
        { id: 'dot-list', label: '圆点无底卡', group: '卡片', type: 'item-cards', min: 1, max: 12, fields: __doeScope.common, required: [], columns: 4 },
        { id: 'numbered-parallelogram', label: '平行四边形编号', group: '卡片', type: 'item-cards', min: 1, max: 12, fields: __doeScope.common, required: [], columns: 4, icons: true },
        { id: 'numbered-pill', label: '胶囊编号', group: '卡片', type: 'item-cards', min: 1, max: 12, fields: __doeScope.common, required: [], columns: 4, icons: true },
        { id: 'numbered-chevron', label: '燕尾箭头编号', group: '卡片', type: 'item-cards', min: 1, max: 12, fields: __doeScope.common, required: [], columns: 4, icons: true },
        { id: 'ascending-bar', label: '上升横条', group: '卡片', type: 'item-cards', min: 1, max: 12, fields: __doeScope.common, required: [], columns: 5 },
        { id: 'ascending-arrow', label: '上升箭头', group: '卡片', type: 'item-cards', min: 1, max: 12, fields: __doeScope.common, required: [], columns: 5 },
        { id: 'ascending-numbered', label: '上升编号横条', group: '卡片', type: 'item-cards', min: 1, max: 12, fields: __doeScope.common, required: [], columns: 5, icons: true },
        { id: 'numbered-top-rule', label: '顶部编号横线卡', group: '卡片', type: 'item-cards', min: 1, max: 12, fields: __doeScope.common, required: [], columns: 4, icons: true },
        { id: 'numbered-inline', label: '左侧编号卡', group: '卡片', type: 'item-cards', min: 1, max: 12, fields: __doeScope.common, required: [], columns: 4, icons: true },
        { id: 'timeline-numbered', label: '编号交错时间线', group: '卡片', type: 'item-cards', min: 1, max: 12, fields: __doeScope.common, required: [], columns: 1, icons: true },
        { id: 'timeline-dots', label: '圆点交错时间线', group: '卡片', type: 'item-cards', min: 1, max: 12, fields: __doeScope.common, required: [], columns: 1 },
        { id: 'timeline-dot-cards', label: '圆点背景卡时间线', group: '卡片', type: 'item-cards', min: 1, max: 12, fields: __doeScope.common, required: [], columns: 1 },
        { id: 'alternating', label: '左右交错索引', group: '卡片', type: 'item-cards', min: 1, max: 12, fields: __doeScope.common, required: [], columns: 1 },
        { id: 'icon-horizontal', label: '左图标右正文', group: '卡片', type: 'item-cards', min: 1, max: 12, fields: __doeScope.common, required: ['icon'], columns: 4, icons: true },
        { id: 'image-text', label: '上图下文', group: '卡片', type: 'image-text', min: 1, max: 12, fields: [...__doeScope.common, 'src', 'alt'], required: ['src'], columns: 4 },
        ...[['semicircle', '半圆'], ['petals', '花瓣'], ['cycle-arrows', '旋转箭头'], ['full-circle', '全圆'], ['ring', '圆环'], ['stairs', '阶梯'], ['pyramid', '三角形'], ['inverted-pyramid', '倒三角形']].map(([variant, label]) => ({ id: `shape:${variant}`, label, group: '图形', type: 'shape-contents', variant, ...shapeItemLimits(variant), fields: __doeScope.common, required: ['title', 'text'], columns: 1, icons: true })),
        { id: 'capability', label: '能力卡片', group: '卡片', type: 'capability-cards', min: 1, max: 12, fields: [...__doeScope.common, 'bullets'], required: ['title', 'icon'], columns: 4, icons: true },
        { id: 'numbered', label: '编号图标卡片', group: '卡片', type: 'numbered-icon-cards', min: 2, max: 6, fields: [...__doeScope.common], required: ['title', 'text', 'icon'], columns: 4, icons: true },
        { id: 'question', label: '问答卡片', group: '卡片', type: 'question-card', min: 1, max: 12, fields: [...__doeScope.common, 'label'], required: ['title'], columns: 4, icons: true },
        { id: 'quotation', label: '引用', group: '基础', category: 'base', type: 'quote', min: 1, max: 12, fields: ['text', 'source', 'icon'], required: ['text'], columns: 4 },
        { id: 'columns', label: '内容分栏', group: '列表', type: 'columns', min: 1, max: 12, fields: __doeScope.common, required: [], columns: 4 },
    ].map(choice => ({ ...choice, label: names.find(entry => entry.presentation === choice.id)?.zh ?? choice.label }));
}
