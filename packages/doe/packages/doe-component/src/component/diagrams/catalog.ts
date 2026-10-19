export const diagramDefinitions = ([
  { type: 'serpentine-process', label: '折返弯道流程', summary: '半圆折返流程，独立内容区域与主题枚举色。' },
  { type: 'recycling-arrows', label: '三箭头折叠循环', summary: '三向折叠循环，独立内容区域与主题枚举色。' },
  { type: 'vertical-progress', label: '竖向百分比进度条', summary: '竖向百分比进度，独立内容区域与主题枚举色。' },
  { type: 'icon-columns', label: '大图标说明组', summary: '大图标说明，独立内容区域与主题枚举色。' },
  { type: 'badge-cards', label: '交错箭头流程卡', summary: '交错徽章卡片，独立内容区域与主题枚举色。' },

  { type: 'concentric-circles', label: '同心圆靶心图', summary: '分层靶心与右侧图标说明，1–4 项。' },
  { type: 'layered-funnel', label: '竖向立体漏斗', summary: '圆弧衔接的立体层，每层右侧对应独立文字，1–4 项。' },
  { type: 'folded-arrow', label: '折纸上升箭头', summary: '折叠箭头沿右上递进，右侧独立文字，1–4 项。' },
  { type: 'wave-arrow', label: '波浪上升箭头', summary: '连续上升波浪与左侧独立说明，固定 3 项。' },
  { type: 'layered-cube', label: '分层立体方柱', summary: '中央分层立体柱与左右说明，1–4 项，支持单数。' },
  { type: 'double-ring', label: '立体交叠双环', summary: '固定双环与左右独立内容，每侧 1–3 项。' },
  { type: 'droplet-process', label: '水滴箭头流程', summary: '横向图标水滴箭头，下方独立标题和描述，1–5 项。' },
] as const).map(entry => ({ ...entry, category: 'diagrams' as const }));
