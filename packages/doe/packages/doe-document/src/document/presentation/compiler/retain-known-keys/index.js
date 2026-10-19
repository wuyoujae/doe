import { stripUnknownKeys as __doeFn_stripUnknownKeys } from '../strip-unknown-keys/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:267


export function retainKnownKeys(target, allowed, diagnostics, nodeId, scope) {
    const cleaned = (0, __doeFn_stripUnknownKeys)(target, allowed, diagnostics, nodeId, scope);
    Object.keys(target).forEach((key) => delete target[key]);
    Object.assign(target, cleaned);
    return target;
  }
