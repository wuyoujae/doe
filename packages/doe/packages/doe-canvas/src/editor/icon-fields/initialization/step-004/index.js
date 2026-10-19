import { fields as __doeFn_fields } from '../../fields/index.js';
import { bind as __doeFn_bind } from '../../bind/index.js';
import { write as __doeFn_write } from '../../write/index.js';
// Origin: public/yrkie-doe/layout-engine/icon-fields.js:42
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.global.DOEIconFields = Object.freeze({ fields: __doeFn_fields, bind: __doeFn_bind, read: __doeScope.read, write: __doeFn_write });
}
