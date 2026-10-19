// Origin: public/yrkie-doe/layout-engine/components.js:277
import { scope as __doeScope } from "../../runtime/base/context/index.js";

export function codeTokenClass(token) {
    if (token.startsWith("#") || token.startsWith("//")) return "comment";
    if (/^["']/.test(token)) return "string";
    if (/^\d/.test(token)) return "number";
    if (__doeScope.CODE_KEYWORDS.has(token)) return "keyword";
    if (__doeScope.CODE_BUILTINS.has(token)) return "builtin";
    if (/^(?:==|!=|<=|>=|=>|[-+*/%=<>])$/.test(token)) return "operator";
    return "identifier";
  }
