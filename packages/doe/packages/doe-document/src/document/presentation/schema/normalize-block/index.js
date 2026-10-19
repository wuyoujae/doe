import { normalizeLeaf as __doeFn_normalizeLeaf } from '../normalize-leaf/index.js';
import { normalizeEdgeMediaRatio as __doeFn_normalizeEdgeMediaRatio } from '../normalize-edge-media-ratio/index.js';
import { nodeLayoutProfile as __doeFn_nodeLayoutProfile } from '../../layout/node-layout-profile/index.js';
import { edgeMediaAxis as __doeFn_edgeMediaAxis } from '../../layout/edge-media-axis/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:867
import { scope as __doeScope } from "../../runtime/context/index.js";

export function normalizeBlock(item, path, warnings, compositionDepth = 0) {
    if (!item || typeof item !== "object" || !item.type) {
      throw new Error(`blocks[${path.join(".")}] 缺少 type。`);
    }

    if (item.type !== "layout-group") {
      return (0, __doeFn_normalizeLeaf)(item, path, warnings);
    }

    const children = Array.isArray(item.children) ? item.children : [];
    if (!children.length) warnings.push(`${item.id || "layout-group"} 没有 children。`);
    const requestedVariant = item.layout?.variant;
    let variant = [
      "auto-grid",
      "grid",
      "columns",
      "row",
      "stack",
      "composition",
      "compressed",
      "edge-media",
      "split-right-bleed",
    ].includes(requestedVariant)
      ? requestedVariant === "compressed"
        ? "composition"
        : requestedVariant === "split-right-bleed"
          ? "edge-media"
          : requestedVariant
      : "auto-grid";
    const requestedColumns = Number(item.layout?.columns);
    const nextCompositionDepth =
      compositionDepth + 1;
    if (
      nextCompositionDepth > __doeScope.MAX_COMPOSITION_DEPTH
    ) {
      throw new Error(
        `${item.id || "composition group"} 超过 ${__doeScope.MAX_COMPOSITION_DEPTH} 层嵌套上限。`,
      );
    }
    const normalizedChildren = children.map((child, index) =>
      (0, normalizeBlock)(
        child,
        [...path, index + 1],
        warnings,
        nextCompositionDepth,
      ),
    );
    const mediaIndex = normalizedChildren.findIndex(
      (child) => child.layout?.region === "media",
    );
    const requestedMediaPosition = item.layout?.mediaPosition;
    const mediaPosition = __doeScope.EDGE_MEDIA_POSITIONS.includes(requestedMediaPosition)
      ? requestedMediaPosition
      : requestedVariant === "split-right-bleed"
        ? mediaIndex === 0
          ? "left"
          : "right"
        : "right";
    if (
      requestedMediaPosition !== undefined &&
      !__doeScope.EDGE_MEDIA_POSITIONS.includes(requestedMediaPosition)
    ) {
      warnings.push(
        `${item.id || "edge-media"} 的 mediaPosition 无效，已回退为 right。`,
      );
    }
    const mediaRatio = (0, __doeFn_normalizeEdgeMediaRatio)(
      item.layout?.mediaRatio,
      mediaPosition,
    );
    const requestedMediaShape = item.layout?.mediaShape;
    const mediaShape = __doeScope.EDGE_MEDIA_SHAPES.includes(requestedMediaShape)
      ? requestedMediaShape
      : "straight";
    if (
      requestedMediaShape !== undefined &&
      !__doeScope.EDGE_MEDIA_SHAPES.includes(requestedMediaShape)
    ) {
      warnings.push(
        `${item.id || "edge-media"} 的 mediaShape 无效，已回退为 straight。`,
      );
    }
    if (
      item.layout?.mediaRatio !== undefined &&
      Number(item.layout.mediaRatio) !== mediaRatio
    ) {
      warnings.push(
        `${item.id || "edge-media"} 的 mediaRatio 已按 ${mediaPosition} 方向安全范围收敛为 ${mediaRatio}。`,
      );
    }
    if (variant === "edge-media") {
      const regions = normalizedChildren.map((child) => child.layout?.region);
      const mediaChild = normalizedChildren.find(
        (child) => child.layout?.region === "media",
      );
      const validRegions =
        normalizedChildren.length === 2 &&
        regions.filter((region) => region === "content").length === 1 &&
        regions.filter((region) => region === "media").length === 1 &&
        mediaChild?.type !== "layout-group" &&
        __doeScope.components.get(mediaChild?.type)?.supportsBleed === true;
      if (!validRegions) {
        warnings.push(
          `${item.id || "edge-media"} 不是合法的 content/media 二分结构，已退化为普通自适应组合。`,
        );
        variant = "composition";
      }
    }
    if (variant === "composition") {
      normalizedChildren.forEach((child) => {
        if (!(0, __doeFn_nodeLayoutProfile)(child)?.enabled) {
          throw new Error(`${child.type} 不支持 composition layout-group。`);
        }
      });
    }
    return {
      id: item.id || `layout-group-${path.join("-")}`,
      type: "layout-group",
      kind:
        item.kind === "cluster" || item.layout?.cluster === true
          ? "cluster"
          : variant === "composition"
            ? "container"
            : item.kind === "collection"
              ? "collection"
              : item.kind || "layout",
      layout: {
        variant,
        direction: __doeScope.COMPOSITION_DIRECTIONS.includes(item.layout?.direction)
          ? item.layout.direction
          : variant === "composition"
            ? "auto"
            : variant === "edge-media"
              ? (0, __doeFn_edgeMediaAxis)(mediaPosition)
              : null,
        ratio: Object.prototype.hasOwnProperty.call(
          __doeScope.COMPOSITION_RATIOS,
          item.layout?.ratio,
        )
          ? item.layout.ratio
          : "auto",
        preset: item.layout?.preset || "auto",
        columns:
          Number.isFinite(requestedColumns) && requestedColumns > 0
            ? Math.max(1, Math.min(6, Math.round(requestedColumns)))
            : "auto",
        maxColumns: Math.max(1, Math.min(6, Number(item.layout?.maxColumns) || 4)),
        gap:
          item.layout?.gap ??
          (variant === "edge-media"
            ? 0
            : variant === "composition" || variant === "columns"
              ? "18pt"
              : "24pt"),
        align:
          item.layout?.align ||
          (["columns", "composition", "grid"].includes(variant) ? "center" : "stretch"),
        region: item.layout?.region || null,
        lock: item.layout?.lock || null,
        origin:
          variant === "edge-media" || item.layout?.origin === "explicit"
            ? "explicit"
            : "implicit",
        intent: item.layout?.intent || null,
        mediaPosition,
        mediaRatio,
        mediaShape,
        ...(variant === "edge-media"
          ? {
              contentAlign: "center",
            }
          : {}),
        collectionKey: item.layout?.collectionKey || null,
        cluster: item.kind === "cluster" || item.layout?.cluster === true,
        maxItems: Math.max(
          2,
          Math.min(
            __doeScope.MAX_COLLECTION_ITEMS,
            Number(item.layout?.maxItems) || __doeScope.MAX_COLLECTION_ITEMS,
          ),
        ),
        keepGroup: item.layout?.keepGroup === true,
        autoGenerated: item.layout?.autoGenerated === true,
        textFit: {
          mode: item.layout?.textFit?.mode === "micro" ? "micro" : "readable",
          minBodyPt:
            Number(item.layout?.textFit?.minBodyPt) <= __doeScope.MIN_MICRO_FONT_PT
              ? __doeScope.MIN_MICRO_FONT_PT
              : __doeScope.MIN_READABLE_FONT_PT,
          optionalMinBodyPt:
            Number(item.layout?.textFit?.optionalMinBodyPt) <=
            __doeScope.MIN_MICRO_FONT_PT
              ? __doeScope.MIN_MICRO_FONT_PT
              : __doeScope.MIN_READABLE_FONT_PT,
        },
      },
      children: normalizedChildren,
    };
  }
