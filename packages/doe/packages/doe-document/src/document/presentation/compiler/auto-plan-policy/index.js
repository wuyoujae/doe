import { planRootAdaptiveComposition as __doeFn_planRootAdaptiveComposition } from '../plan-root-adaptive-composition/index.js';
import { autoPlanNode as __doeFn_autoPlanNode } from '../auto-plan-node/index.js';
import { replanAllocatedDescendants as __doeFn_replanAllocatedDescendants } from '../replan-allocated-descendants/index.js';
import { packOverCapacity as __doeFn_packOverCapacity } from '../pack-over-capacity/index.js';
import { flattenSameAxis as __doeFn_flattenSameAxis } from '../flatten-same-axis/index.js';
import { limitDepth as __doeFn_limitDepth } from '../limit-depth/index.js';
import { ensureUniqueIds as __doeFn_ensureUniqueIds } from '../ensure-unique-ids/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:2065
import { scope as __doeScope } from "../runtime/context/index.js";

export function autoPlanPolicy(schema, context) {
    const slide = schema.slide;
    // The explicit flow model preserves authored containers and document order.
    if (context.options.flowLayout?.version === 'flow-v1') {
      (0, __doeFn_ensureUniqueIds)(slide, context.diagnostics);
      return schema;
    }
    (0, __doeFn_planRootAdaptiveComposition)(slide, context.diagnostics);
    const pagePadding =
      __doeScope.engine.SPACING_TOKENS[slide.layout?.spacing?.pagePadding] ||
      __doeScope.engine.SPACING_TOKENS["36pt"];
    const innerWidth = Math.max(
      1,
      __doeScope.engine.CANVAS.renderWidth - pagePadding * 2 || __doeScope.DEFAULT_INNER_WIDTH,
    );
    slide.blocks = slide.blocks.map((block) =>
      (0, __doeFn_autoPlanNode)(block, context.diagnostics, innerWidth),
    );
    slide.blocks = slide.blocks.map((block) =>
      (0, __doeFn_replanAllocatedDescendants)(block, context.diagnostics, innerWidth),
    );
    slide.blocks = slide.blocks
      .map((block) => (0, __doeFn_packOverCapacity)(block, context.diagnostics))
      .map((block) => (0, __doeFn_flattenSameAxis)(block, context.diagnostics))
      .filter(Boolean)
      .map((block) => (0, __doeFn_limitDepth)(block, 0, context.diagnostics));
    // Planning may create support stacks. Run ID normalization again so the
    // compiler is deterministic even when an AI reused a generated-looking ID.
    (0, __doeFn_ensureUniqueIds)(slide, context.diagnostics);
    return schema;
  }
