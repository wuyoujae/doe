// Origin: layout-engine/components.js; ordered-list.itemCollection
import { scope as __doeScope } from "../../../../../registry/runtime/base/context/index.js";

export function createItemCollection() {
  return { ...__doeScope.listDefinition.itemCollection, key: "ordered-list-item" };
}
