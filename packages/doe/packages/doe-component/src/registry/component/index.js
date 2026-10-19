import { STYLE_FIRST, collectionColumnOrder } from '../../layout/compression/style-first/index.js';
import { componentFlowContract } from '../../layout/flow/contract.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:457
import { scope as __doeScope } from '../runtime/context/index.js';

export function registerComponent(type, definition) {
    if (!type || typeof type !== "string") {
      throw new Error("SlideEngine.registerComponent: type 必须是字符串。");
    }
    if (!definition || typeof definition.render !== "function") {
      throw new Error(`SlideEngine.registerComponent: '${type}' 缺少 render()。`);
    }
    const normalized = {
      category: "base",
      defaultSpan: 1,
      minWidth: 260,
      family: "content",
      supportsBleed: false,
      slotSpace: {
        top: "6pt",
        right: 0,
        bottom: "6pt",
        left: 0,
      },
      ...definition,
    };
    normalized.slotSpace = {
      top: "6pt",
      right: 0,
      bottom: "6pt",
      left: 0,
      ...(definition.slotSpace || {}),
    };
    normalized.flowLayout = componentFlowContract(type, definition);
    normalized.composition = {
      enabled: definition.composition !== false,
      family: normalized.family,
      allowedWith: [],
      minWidth: normalized.minWidth,
      preferredWidth: normalized.minWidth * 1.35,
      weight: 1,
      fontFloorToken: "body",
      minFontPt: __doeScope.MIN_READABLE_FONT_PT,
      orientations: ["row", "stack"],
      shrinkMode: "reflow",
      allowMicroText: ["content", "narrative"].includes(normalized.family),
      ...(definition.compression || {}),
      ...(definition.composition && typeof definition.composition === "object"
        ? definition.composition
        : {}),
    };
    normalized.compression = {
      ...normalized.composition,
      ...(definition.compression || {}),
      ...STYLE_FIRST,
    };
    const defaultRole = {
      metric: "compact",
      narrative: "flow",
      data: "wide",
      media: "media",
      content: "flow",
    }[normalized.family] || "flow";
    normalized.layoutContract = {
      role: defaultRole,
      minWidth: normalized.composition.minWidth,
      preferredWidth: normalized.composition.preferredWidth,
      maxWidth: Infinity,
      minHeight: Number(definition.minHeight) || 0,
      preferredAxes:
        defaultRole === "wide" || defaultRole === "media"
          ? ["row", "stack"]
          : ["stack", "row"],
      text: {
        reflow: ["flow", "compact"].includes(defaultRole),
        minPt: __doeScope.MIN_READABLE_FONT_PT,
        optionalMinPt:
          normalized.composition.allowMicroText === true
            ? __doeScope.MIN_MICRO_FONT_PT
            : __doeScope.MIN_READABLE_FONT_PT,
      },
      preserveAspect:
        defaultRole === "media" ||
        /preserve/.test(normalized.composition.shrinkMode || ""),
      canSplit: false,
      canBleed: normalized.supportsBleed === true,
      priority: 50,
      ...definition.layoutContract,
    };
    normalized.layoutContract.text = {
      reflow: ["flow", "compact"].includes(defaultRole),
      minPt: __doeScope.MIN_READABLE_FONT_PT,
      optionalMinPt:
        normalized.composition.allowMicroText === true
          ? __doeScope.MIN_MICRO_FONT_PT
          : __doeScope.MIN_READABLE_FONT_PT,
      ...(definition.layoutContract?.text || {}),
    };
    const defaultCollectionColumns =
      normalized.category === "contents" ? 4 : defaultRole === "compact" ? 4 : defaultRole === "flow" ? 2 : 2;
    normalized.collection = {
      enabled: definition.collection !== false,
      key: type,
      minItemWidth: normalized.layoutContract.minWidth,
      preferredItemWidth: normalized.layoutContract.preferredWidth,
      maxColumns: defaultCollectionColumns,
      maxItems: __doeScope.MAX_COLLECTION_ITEMS,
      allowedLayouts: ["stack", "grid", "auto-grid"],
      ...(definition.collection && typeof definition.collection === "object"
        ? definition.collection
        : {}),
    };
    if (normalized.category === "contents") {
      normalized.collection.maxColumns = 4;
      if (normalized.itemCollection && !normalized.itemCollection.fixedLayout && !["shape-contents"].includes(type)) {
        normalized.itemCollection = { ...normalized.itemCollection, maxColumns: type === "contents" ? definition.itemCollection.maxColumns : 4, autoColumnOrder: normalized.itemCollection.autoColumnOrder || (count => collectionColumnOrder(count)) };
      }
    }
    __doeScope.components.set(type, normalized);
  }
