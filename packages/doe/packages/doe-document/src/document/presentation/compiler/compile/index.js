import { clone as __doeFn_clone } from '../clone/index.js';
import { resolveFlowLayout } from '../../../../../../doe-component/src/layout/flow/contract.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:2108
import { scope as __doeScope } from "../runtime/context/index.js";

export function compile(input, options = {}) {
    if (!input || typeof input !== "object") {
      return { schema: input, diagnostics: [] };
    }
    let schema = (0, __doeFn_clone)(input);
    const context = {
      diagnostics: [],
      components: __doeScope.engine.components,
      options: { ...options, flowLayout: resolveFlowLayout(options.flowLayout) },
    };
    if (!schema.slide || typeof schema.slide !== "object") {
      schema.slide = {
        id: "invalid-slide-diagnostic",
        layout: { preset: "flow" },
        blocks: [],
      };
      context.diagnostics.push({
        code: "invalid-slide-replaced",
        level: "repair",
        message: "slide 不是有效对象，已替换为可渲染诊断页",
      });
    }
    [...__doeScope.engine.layoutPolicies.values()]
      .filter((policy) => policy.phase === "compile" && policy.apply)
      .sort((a, b) => a.priority - b.priority)
      .forEach((policy) => {
        try {
          schema = policy.apply(schema, context) || schema;
        } catch (error) {
          context.diagnostics.push({
            code: "compile-policy-failed",
            level: "error",
            policy: policy.id,
            message: error.message,
          });
        }
      });
    return { schema, diagnostics: context.diagnostics };
  }
