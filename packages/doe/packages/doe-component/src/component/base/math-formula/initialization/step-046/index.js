import { mount as __doeFn_mount } from '../../mount/index.js';
import { parseFormula as __doeFn_parseFormula } from '../../parse-formula/index.js';
import { estimateHeight as __doeFn_estimateHeight } from '../../estimate-height/index.js';
import { tokenize as __doeFn_tokenize } from '../../tokenize/index.js';
import { stretchyDelimiterPath as __doeFn_stretchyDelimiterPath } from '../../stretchy-delimiter-path/index.js';
// Origin: public/yrkie-doe/components/math-formula/math-formula.js:1245
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.library.mathFormula = {
    mount: __doeFn_mount,
    dispose(host) { __doeScope.fitObservers.get(host)?.disconnect(); __doeScope.fitObservers.delete(host); },
    parseFormula: __doeFn_parseFormula,
    estimateHeight: __doeFn_estimateHeight,
    __testing: { tokenize: __doeFn_tokenize, stretchyDelimiterPath: __doeFn_stretchyDelimiterPath, GREEK_MAP: __doeScope.GREEK_MAP, OPERATOR_MAP: __doeScope.OPERATOR_MAP, ACCENT_MARK: __doeScope.ACCENT_MARK },
  };
}
