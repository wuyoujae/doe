import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from '../../layout/is-edge-split-group/index.js';
import { inferRootEdgeMediaGroup as __doeFn_inferRootEdgeMediaGroup } from '../infer-root-edge-media-group/index.js';
import { mergeRootBlocksIntoEdgeContent as __doeFn_mergeRootBlocksIntoEdgeContent } from '../merge-root-blocks-into-edge-content/index.js';
import { downgradeEdgeMediaGroups as __doeFn_downgradeEdgeMediaGroups } from '../downgrade-edge-media-groups/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1196
import { scope as __doeScope } from "../../runtime/context/index.js";

export function prepareEdgeMediaRoot(blocks, requestedPresetId, warnings) {
    let presetId = requestedPresetId;
    let resolvedBlocks = blocks;
    const requestedPreset = __doeScope.layouts.get(requestedPresetId);
    const edgeGroups = resolvedBlocks.filter((block) =>
      (0, __doeFn_isEdgeSplitGroup)(block),
    );

    if (!edgeGroups.length && requestedPreset?.allowsBleed) {
      const inferredGroup = (0, __doeFn_inferRootEdgeMediaGroup)(resolvedBlocks, warnings);
      if (inferredGroup) {
        return { blocks: [inferredGroup], presetId };
      }
    }

    if (edgeGroups.length === 1) {
      resolvedBlocks = (0, __doeFn_mergeRootBlocksIntoEdgeContent)(
        resolvedBlocks,
        edgeGroups[0],
        warnings,
      );
      if (!requestedPreset?.allowsBleed) {
        presetId = "edge-media";
        warnings.push(
          "检测到合法的 edge-media 根组，slide.layout.preset 已自动升级为 edge-media。",
        );
      }
      return { blocks: resolvedBlocks, presetId };
    }

    if (requestedPreset?.allowsBleed) {
      resolvedBlocks.forEach(__doeFn_downgradeEdgeMediaGroups);
      presetId = "flow";
      warnings.push(
        edgeGroups.length
          ? "检测到多个贴边根组，已全部退化为普通组合并回退到 flow。"
          : "贴边 preset 缺少合法 edge-media 根组，已安全回退到 flow。",
      );
    }
    return { blocks: resolvedBlocks, presetId };
  }
