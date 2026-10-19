// Origin: layout-engine/library-components.js; capability-cards.itemCollection
import { collectionColumnOrder } from '../../../../../layout/compression/style-first/index.js';


export function createItemCollection() {
  return {
      path: "content.items",
      key: "capability-item",
      reorderable: true,
      layouts: ["stack", "grid", "auto-grid"],
      maxColumns: 4,
      autoColumnOrder: count => collectionColumnOrder(count),
      layoutProp: "itemLayout",
      columnsProp: "itemColumns",
    };
}
