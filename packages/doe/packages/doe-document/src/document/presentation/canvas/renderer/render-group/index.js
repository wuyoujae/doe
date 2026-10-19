import { element as __doeFn_element } from "../../../../../../../doe-core/src/runtime/element/index.js";
import { appendDeleteButton } from '../../editor/delete-content/index.js';
import { isCompositionGroup as __doeFn_isCompositionGroup } from "../../../layout/is-composition-group/index.js";
import { isCollectionGroup as __doeFn_isCollectionGroup } from "../../../layout/is-collection-group/index.js";
import { isLocalCluster as __doeFn_isLocalCluster } from "../../../layout/is-local-cluster/index.js";
import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from "../../../layout/is-edge-split-group/index.js";
import { attachEditor as __doeFn_attachEditor } from "../../editor/attach-editor/index.js";
import { layoutOptions as __doeFn_layoutOptions } from "../../editor/layout-options/index.js";
import { componentCategory as __doeFn_componentCategory } from "../../../layout/component-category/index.js";
import { renderLeaf as __doeFn_renderLeaf } from "../render-leaf/index.js";
import { subtreeUsesOnlyComponentType as __doeFn_subtreeUsesOnlyComponentType } from "../../../layout/subtree-uses-only-component-type/index.js";
import { attachEdgeMediaDivider as __doeFn_attachEdgeMediaDivider } from "../../editor/attach-edge-media-divider/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:6533


export function renderGroup(node, state, level) {
    const shell = (0, __doeFn_element)("section", level === 0 ? "flow-block layout-group" : "group-item layout-group");
    if (node.layout.region) shell.dataset.layoutRegion = node.layout.region;
    shell.dataset.compressionGroup = String((0, __doeFn_isCompositionGroup)(node));
    shell.dataset.compositionGroup = String((0, __doeFn_isCompositionGroup)(node));
    shell.dataset.collectionGroup = String((0, __doeFn_isCollectionGroup)(node));
    shell.dataset.localCluster = String((0, __doeFn_isLocalCluster)(node));
    shell.dataset.edgeSplitRoot = String((0, __doeFn_isEdgeSplitGroup)(node));
    (0, __doeFn_attachEditor)(shell, node, state);
    if ((0, __doeFn_isLocalCluster)(node) && state.slide.editor) {
      const badge = (0, __doeFn_element)(
        "span",
        "local-cluster-badge",
        node.layout.direction === "stack" ? "局部纵列" : "局部横组",
      );
      badge.setAttribute("aria-hidden", "true");
      shell.append(badge);
    }
    if ((0, __doeFn_isEdgeSplitGroup)(node)) {
      const handle = shell.querySelector(".block-handle");
      if (handle) {
        shell.draggable = false;
        handle.classList.add("block-handle--layout");
        handle.textContent = "";
        handle.setAttribute("aria-label", `调整 ${node.id} 左右布局`);
      }
    }
    if (state.slide.editor) shell.append((0, __doeFn_layoutOptions)(node, state));
    const content = (0, __doeFn_element)("div", "layout-group__content");
    content.dataset.groupId = node.id;
    content.dataset.layoutVariant = node.layout.variant;
    content.dataset.componentCategory = (0, __doeFn_componentCategory)(node);
    if ((0, __doeFn_isCompositionGroup)(node)) {
      content.dataset.compositionDirection = node.layout.direction || "auto";
      content.dataset.compositionRatio = node.layout.ratio || "auto";
    }
    const record = {
      node,
      shell,
      content,
      childShells: [],
      divider: null,
      level,
    };
    state.groupRecords.push(record);
    const childShells = node.children.map((child) =>
      child.type === "layout-group"
        ? (0, renderGroup)(child, state, level + 1)
        : (0, __doeFn_renderLeaf)(child, state, level + 1),
    );
    childShells.forEach((child) => content.append(child));
    if (
      node.children.length >= 2 &&
      node.children.every((child) =>
        (0, __doeFn_subtreeUsesOnlyComponentType)(child, "question-card"),
      )
    ) {
      content.dataset.equalHeightCohort = "question-card";
    }
    appendDeleteButton(shell, node, state);
    shell.append(content);
    record.childShells = childShells;
    record.divider = (0, __doeFn_attachEdgeMediaDivider)(shell, node, state, record);
    state.siblingSets.push(childShells);
    return shell;
  }
