// Origin: layout-engine/components.js; preserves definition evaluation and property order.
import { scope as __doeScope } from "../../../../registry/runtime/base/context/index.js";
import { createItemCollection } from '../layout/item-collection/index.js';
import { validate } from '../schema/validate/index.js';

export function createDefinition() {
  return {
    ...__doeScope.listDefinition,
    collection: { ...__doeScope.listDefinition.collection, key: "todo-list" },
    itemCollection: createItemCollection(),
    validate,
  };
}
