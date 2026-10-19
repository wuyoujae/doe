// Origin: public/yrkie-doe/layout-engine/layout-engine.js:6713
import { scope as __doeScope } from "../../runtime/context/index.js";

export function resolveAssetRequest(sourceUrl, purpose) {
    const fallback = Object.freeze({ url: String(sourceUrl || ""), crossOrigin: null });
    if (typeof __doeScope.assetUrlResolver !== "function") return fallback;

    let resolved;
    try {
      resolved = (0, __doeScope.assetUrlResolver)(fallback.url, Object.freeze({ purpose }));
    } catch (_error) {
      return fallback;
    }
    if (typeof resolved === "string") {
      return Object.freeze({ url: resolved || fallback.url, crossOrigin: null });
    }
    if (!resolved || typeof resolved !== "object") return fallback;

    const url = typeof resolved.url === "string" && resolved.url
      ? resolved.url
      : fallback.url;
    // Background sampling never sends credentials. An embedding page may opt
    // into anonymous CORS only when its resolver points at a CORS-capable URL.
    const crossOrigin = resolved.crossOrigin === "anonymous" ? "anonymous" : null;
    return Object.freeze({ url, crossOrigin });
  }
