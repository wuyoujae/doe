// Origin: layout-engine/library-components.js; numbered-icon-cards.itemCollection
import { collectionColumnOrder } from '../../../../../layout/compression/style-first/index.js';


export function createItemCollection() {
  return {
      path: "content.items",
      key: "numbered-icon-card-item",
      toolbarLabel: "编号图标卡片",
      toolbarAriaLabel: "调整编号图标卡片布局",
      reorderable: true,
      layouts: ["stack", "grid", "auto-grid"],
      minColumns: 1,
      maxColumns: 4,
      autoColumnOrder: count => collectionColumnOrder(count),
      layoutProp: "itemLayout",
      columnsProp: "itemColumns",
    };
}
