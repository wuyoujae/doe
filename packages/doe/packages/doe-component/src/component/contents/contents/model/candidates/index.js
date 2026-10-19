import { eligible as __doeFn_eligible } from '../eligible/index.js';
// Origin: public/yrkie-doe/core/contents-model.js:35
import { scope as __doeScope } from "../runtime/context/index.js";

export function candidates(content) { return content ? __doeScope.CHOICES.filter(choice => (0, __doeFn_eligible)(content, choice)) : []; }
