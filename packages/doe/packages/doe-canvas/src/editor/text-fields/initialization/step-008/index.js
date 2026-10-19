import { fields as __doeFn_fields } from '../../fields/index.js';
import { bind as __doeFn_bind } from '../../bind/index.js';
import { write as __doeFn_write } from '../../write/index.js';
import { plainText as __doeFn_plainText } from '../../plain-text/index.js';
import { parseDraft as __doeFn_parseDraft } from '../../parse-draft/index.js';
import { edit as __doeFn_edit } from '../../edit/index.js';
// Origin: public/yrkie-doe/layout-engine/text-fields.js:378
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.global.DOETextFields = Object.freeze({ fields: __doeFn_fields, bind: __doeFn_bind, read: __doeScope.read, write: __doeFn_write, plainText: __doeFn_plainText, parseDraft: __doeFn_parseDraft, edit: __doeFn_edit });
}
