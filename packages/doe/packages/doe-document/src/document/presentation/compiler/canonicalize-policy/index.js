import { groupRootHeadingSupport as __doeFn_groupRootHeadingSupport } from '../group-root-heading-support/index.js';
import { flattenSameAxis as __doeFn_flattenSameAxis } from '../flatten-same-axis/index.js';
import { flattenImplicitPlanningGroups as __doeFn_flattenImplicitPlanningGroups } from '../flatten-implicit-planning-groups/index.js';
import { limitDepth as __doeFn_limitDepth } from '../limit-depth/index.js';
import { ensureUniqueIds as __doeFn_ensureUniqueIds } from '../ensure-unique-ids/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:1886


export function canonicalizePolicy(schema, context) {
    const slide = schema.slide;
    if (context.options.flowLayout?.version === 'flow-v1') {
      (0, __doeFn_ensureUniqueIds)(slide, context.diagnostics);
      return schema;
    }
    // Content semantics belong to the author. A long text node, two paragraphs
    // in one text node must remain one editable node;
    // tolerance here means rendering the authored result, not rewriting it.
    (0, __doeFn_groupRootHeadingSupport)(slide, context.diagnostics);
    slide.blocks = slide.blocks
      .map((block) => (0, __doeFn_flattenSameAxis)(block, context.diagnostics))
      .map((block) =>
        (0, __doeFn_flattenImplicitPlanningGroups)(block, context.diagnostics),
      )
      .filter(Boolean)
      .map((block) => (0, __doeFn_limitDepth)(block, 0, context.diagnostics));
    (0, __doeFn_ensureUniqueIds)(slide, context.diagnostics);
    return schema;
  }
