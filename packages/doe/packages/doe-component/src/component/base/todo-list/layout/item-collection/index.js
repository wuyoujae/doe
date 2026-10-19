// Origin: layout-engine/components.js; todo-list.itemCollection
import { scope as __doeScope } from "../../../../../registry/runtime/base/context/index.js";

export function createItemCollection() {
  return { ...__doeScope.listDefinition.itemCollection, key: "todo-list-item" };
}
