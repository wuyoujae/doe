// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1764
import { scope as __doeScope } from "../../runtime/context/index.js";

export function compositionProfile(node) {
    if (!node || node.type === "layout-group") return null;
    const definition = __doeScope.components.get(node.type);
    if (!definition) return null;
    const contract = { ...definition.layoutContract, ...definition.resolveLayoutContract?.(node.props || {}) };
    return {
      ...definition.composition,
      role: contract.role,
      minWidth: contract.minWidth ?? definition.composition.minWidth,
      preferredWidth:
        contract.preferredWidth ?? definition.composition.preferredWidth,
      minHeight: contract.minHeight || 0,
      preferredAxes: contract.preferredAxes || ["row", "stack"],
      allowMicroText:
        Number(contract.text?.optionalMinPt) <= __doeScope.MIN_MICRO_FONT_PT,
      preserveAspect: contract.preserveAspect === true,
      canSplit: contract.canSplit === true,
      priority: Number(contract.priority) || 50,
    };
  }
