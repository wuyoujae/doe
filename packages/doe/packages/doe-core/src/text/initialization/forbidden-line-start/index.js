// Origin: public/yrkie-doe/core/semantic-text-layout.js:19
import { scope as __doeScope } from "../../layout/runtime/context/index.js";

export function initialize() {
__doeScope.FORBIDDEN_LINE_START = /^[，。！？；：、,.!?;:）】》〉」』”’%％]/u;
}
