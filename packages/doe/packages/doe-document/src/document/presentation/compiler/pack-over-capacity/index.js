import { isGroup as __doeFn_isGroup } from '../is-group/index.js';
import { isCollection as __doeFn_isCollection } from '../is-collection/index.js';
import { isLocalCluster as __doeFn_isLocalCluster } from '../is-local-cluster/index.js';
import { semanticLeafCount as __doeFn_semanticLeafCount } from '../semantic-leaf-count/index.js';
import { chunkBySemanticLeafCount as __doeFn_chunkBySemanticLeafCount } from '../chunk-by-semantic-leaf-count/index.js';
import { collection as __doeFn_collection } from '../collection/index.js';
import { isComposition as __doeFn_isComposition } from '../is-composition/index.js';
import { collectionMembershipKey as __doeFn_collectionMembershipKey } from '../collection-membership-key/index.js';
import { collectionContractFor as __doeFn_collectionContractFor } from '../collection-contract-for/index.js';
import { collectionKeyFor as __doeFn_collectionKeyFor } from '../collection-key-for/index.js';
import { directionOf as __doeFn_directionOf } from '../direction-of/index.js';
import { container as __doeFn_container } from '../container/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:1086
import { scope as __doeScope } from "../runtime/context/index.js";

export function packOverCapacity(node, diagnostics) {
    if (!(0, __doeFn_isGroup)(node)) return node;
    node.children = (node.children || []).map((child) =>
      (0, packOverCapacity)(child, diagnostics),
    );
    if (
      (0, __doeFn_isCollection)(node) &&
      !(0, __doeFn_isLocalCluster)(node) &&
      node.layout?.lock !== "structure" &&
      (0, __doeFn_semanticLeafCount)(node) >
        Math.max(
          2,
          Math.min(
            __doeScope.MAX_COLLECTION_ITEMS,
            Number(node.layout?.maxItems) || __doeScope.MAX_COLLECTION_ITEMS,
          ),
        )
    ) {
      const collectionKey = node.layout.collectionKey || "collection";
      const maximum = Math.max(
        2,
        Math.min(
          __doeScope.MAX_COLLECTION_ITEMS,
          Number(node.layout.maxItems) || __doeScope.MAX_COLLECTION_ITEMS,
        ),
      );
      const semanticChunks = (0, __doeFn_chunkBySemanticLeafCount)(node.children, maximum);
      const chunks = semanticChunks.map((children, index) =>
        (0, __doeFn_collection)(`${node.id}-collection-${index + 1}`, children, {
          collectionKey,
          maxColumns: Number(node.layout.maxColumns) || 4,
          maxItems: maximum,
          gap: node.layout.gap || "18pt",
          // Capacity chunks are stable safety boundaries. They remain
          // individually editable, but are not collapsed merely because
          // the final chunk currently contains one item.
          origin: "explicit",
        }),
      );
      node.kind = "container";
      node.layout = {
        ...node.layout,
        variant: "composition",
        direction: "stack",
        columns: 1,
        collectionKey: null,
        maxColumns: __doeScope.MAX_ITEMS,
        maxItems: __doeScope.MAX_ITEMS,
        keepGroup: true,
      };
      node.children = chunks;
      diagnostics.push({
        code: "collection-capacity-chunked",
        level: "repair",
        nodeId: node.id,
        message: `${node.id} 超过单集合保护上限，已拆为 ${chunks.length} 个连续集合`,
      });
    }
    if (!(0, __doeFn_isComposition)(node) || node.children.length <= __doeScope.MAX_ITEMS) return node;

    const collectionKeys = node.children.map((child) =>
      (0, __doeFn_collectionMembershipKey)(child),
    );
    const sameLeafType =
      collectionKeys.every(Boolean) &&
      new Set(collectionKeys).size === 1;
    if (sameLeafType && !(0, __doeFn_isLocalCluster)(node)) {
      const contract = (0, __doeFn_collectionContractFor)(node.children[0]) || {};
      node.layout.variant = "auto-grid";
      node.layout.direction = "row";
      node.layout.columns = "auto";
      node.layout.maxColumns = Math.max(
        1,
        Math.min(6, Number(contract.maxColumns) || 4),
      );
      node.layout.maxItems = Math.max(
        2,
        Math.min(
          __doeScope.MAX_COLLECTION_ITEMS,
          Number(contract.maxItems) || __doeScope.MAX_COLLECTION_ITEMS,
        ),
      );
      node.layout.collectionKey = (0, __doeFn_collectionKeyFor)(node.children[0]);
      node.layout.origin = node.layout.origin || "implicit";
      node.kind = "collection";
      diagnostics.push({
        code: "same-type-collection-normalized",
        level: "repair",
        nodeId: node.id,
        message: `${node.id} 是同类型集合，已转换为可换序网格而不是继续嵌套组合`,
      });
      return node;
    }

    const originalDirection =
      (0, __doeFn_directionOf)(node) === "auto" ? "row" : (0, __doeFn_directionOf)(node);
    let current = node.children;
    let generation = 1;
    while (current.length > __doeScope.MAX_ITEMS) {
      const packed = [];
      for (let index = 0; index < current.length; index += __doeScope.MAX_ITEMS) {
        const chunk = current.slice(index, index + __doeScope.MAX_ITEMS);
        packed.push(
          chunk.length === 1
            ? chunk[0]
            : (0, __doeFn_container)(
                `${node.id}-pack-${generation}-${packed.length + 1}`,
                originalDirection,
                chunk,
                { keepGroup: true, gap: node.layout?.gap || "18pt" },
              ),
        );
      }
      current = packed;
      generation += 1;
    }
    node.children = current;
    node.layout.direction = "stack";
    node.layout.columns = 1;
    node.layout.keepGroup = true;
    diagnostics.push({
      code: "capacity-packed",
      level: "repair",
      nodeId: node.id,
      message: `${node.id} 超过 ${__doeScope.MAX_ITEMS} 个直接子项，已分包为多行容器`,
    });
    return node;
  }
