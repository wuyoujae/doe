// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7171
import { scope as __doeScope } from "../../runtime/context/index.js";

export function componentCategory(node) {
    if ((typeof node === "string" ? node : node?.type) === "layout-group") return "contents";
    const definition = __doeScope.components.get(typeof node === "string" ? node : node?.type);
    return (typeof node === "object" && definition?.resolveCategory?.(node.props)) || definition?.category || "base";
  }
