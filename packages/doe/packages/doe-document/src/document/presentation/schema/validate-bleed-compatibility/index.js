// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1238
import { scope as __doeScope } from "../../runtime/context/index.js";

export function validateBleedCompatibility(node, bleedRegion, insideBleed = false) {
    const isBleedRegion = insideBleed || node.layout?.region === bleedRegion;
    if (node.type === "layout-group") {
      node.children.forEach((child) =>
        (0, validateBleedCompatibility)(child, bleedRegion, isBleedRegion),
      );
      return;
    }
    if (isBleedRegion && !__doeScope.components.get(node.type)?.supportsBleed) {
      throw new Error(
        `组件 '${node.type}' 未声明 supportsBleed，不能放入 '${bleedRegion}' 贴边区域。`,
      );
    }
  }
