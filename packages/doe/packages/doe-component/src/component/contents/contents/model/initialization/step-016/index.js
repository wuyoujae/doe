import { eligible as __doeFn_eligible } from '../../eligible/index.js';
import { candidates as __doeFn_candidates } from '../../candidates/index.js';
import { currentChoice as __doeFn_currentChoice } from '../../current-choice/index.js';
import { extract as __doeFn_extract } from '../../extract/index.js';
import { replace as __doeFn_replace } from '../../replace/index.js';
import { findNode as __doeFn_findNode } from '../../find-node/index.js';
import { replaceInSchema as __doeFn_replaceInSchema } from '../../replace-in-schema/index.js';
// Origin: public/yrkie-doe/core/contents-model.js:193
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.global.DOEContentsModel = Object.freeze({ CONTENTS_TYPE: __doeScope.CONTENTS_TYPE, CHOICES: __doeScope.CHOICES, clone: __doeScope.clone, eligible: __doeFn_eligible, candidates: __doeFn_candidates, currentChoice: __doeFn_currentChoice, extract: __doeFn_extract, replace: __doeFn_replace, findNode: __doeFn_findNode, replaceInSchema: __doeFn_replaceInSchema });
}
