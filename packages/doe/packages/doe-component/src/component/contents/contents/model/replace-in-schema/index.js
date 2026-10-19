import { findNode as __doeFn_findNode } from '../find-node/index.js';
// Origin: public/yrkie-doe/core/contents-model.js:185
import { scope as __doeScope } from "../runtime/context/index.js";

export function replaceInSchema(schema, id, next) {
        const copy = (0, __doeScope.clone)(schema), node = (0, __doeFn_findNode)(copy.slide.blocks, id);
        if (!node)
            throw new Error('组件已变化，请重新打开。');
        Object.keys(node).forEach(key => delete node[key]);
        Object.assign(node, (0, __doeScope.clone)(next));
        return copy;
    }
