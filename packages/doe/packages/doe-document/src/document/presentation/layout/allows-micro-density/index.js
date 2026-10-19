import { isCompositionGroup as __doeFn_isCompositionGroup } from '../is-composition-group/index.js';
import { nodeLayoutProfile as __doeFn_nodeLayoutProfile } from '../node-layout-profile/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:8651
import { scope as __doeScope } from "../../runtime/context/index.js";

export function allowsMicroDensity(state) {
    return state.groupRecords.some(
      (group) =>
        (0, __doeFn_isCompositionGroup)(group.node) &&
        Number(group.node.layout.textFit?.minBodyPt) <= __doeScope.MIN_MICRO_FONT_PT &&
        group.node.children.some(
          (child) => (0, __doeFn_nodeLayoutProfile)(child)?.allowMicroText === true,
        ),
    );
  }
