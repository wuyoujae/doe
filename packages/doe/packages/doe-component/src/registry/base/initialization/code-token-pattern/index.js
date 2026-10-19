// Origin: public/yrkie-doe/layout-engine/components.js:270
import { scope as __doeScope } from "../../../runtime/base/context/index.js";

export function initialize() {
__doeScope.CODE_TOKEN_PATTERN = /(#[^\n]*|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b[A-Za-z_$][\w$]*\b|\b\d+(?:\.\d+)?\b|==|!=|<=|>=|=>|[-+*/%=<>])/g;
}
