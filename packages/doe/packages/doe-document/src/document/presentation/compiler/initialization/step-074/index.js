import { compile as __doeFn_compile } from '../../compile/index.js';
import { summarize as __doeFn_summarize } from '../../summarize/index.js';
import { contractFor as __doeFn_contractFor } from '../../contract-for/index.js';
import { collectionMembershipKey as __doeFn_collectionMembershipKey } from '../../collection-membership-key/index.js';
import { semanticLeafCount as __doeFn_semanticLeafCount } from '../../semantic-leaf-count/index.js';
import { collectionContractFor as __doeFn_collectionContractFor } from '../../collection-contract-for/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:2148
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.global.AILayoutCompiler = {
    compile: __doeFn_compile,
    summarize: __doeFn_summarize,
    contractFor: __doeFn_contractFor,
    collectionMembershipKey: __doeFn_collectionMembershipKey,
    semanticLeafCount: __doeFn_semanticLeafCount,
    collectionContractFor: __doeFn_collectionContractFor,
  };
}
