import { element as __doeFn_element } from "../../../../../../../doe-core/src/runtime/element/index.js";
import { contentsReplacementButton as __doeFn_contentsReplacementButton } from "../contents-replacement-button/index.js";
import { isCompositionGroup as __doeFn_isCompositionGroup } from "../../../layout/is-composition-group/index.js";
import { isContentsGroup as __doeFn_isContentsGroup } from "../../../layout/is-contents-group/index.js";
import { queueMutation as __doeFn_queueMutation } from "../transaction/queue-mutation/index.js";
import { updateCompositionLayout as __doeFn_updateCompositionLayout } from "../../../layout/update-composition-layout/index.js";
import { swapCompositionChildren as __doeFn_swapCompositionChildren } from "../../../layout/swap-composition-children/index.js";
import { splitCompositionGroup as __doeFn_splitCompositionGroup } from "../../../layout/split-composition-group/index.js";
import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from "../../../layout/is-edge-split-group/index.js";
import { normalizeEdgeMediaRatio as __doeFn_normalizeEdgeMediaRatio } from "../../../schema/normalize-edge-media-ratio/index.js";
import { edgeMediaPosition as __doeFn_edgeMediaPosition } from "../../../layout/edge-media-position/index.js";
import { setEdgeMediaPosition as __doeFn_setEdgeMediaPosition } from "../../../layout/set-edge-media-position/index.js";
import { edgeMediaShape as __doeFn_edgeMediaShape } from "../../../layout/edge-media-shape/index.js";
import { setEdgeMediaShape as __doeFn_setEdgeMediaShape } from "../../../layout/set-edge-media-shape/index.js";
import { isCollectionGroup as __doeFn_isCollectionGroup } from "../../../layout/is-collection-group/index.js";
import { contentsMaximumColumns as __doeFn_contentsMaximumColumns } from "../../../layout/contents-maximum-columns/index.js";
import { collectionContract as __doeFn_collectionContract } from "../../../layout/collection-contract/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:4207
import { scope as __doeScope } from "../../../runtime/context/index.js";

export function layoutOptions(node, state) {
    const toolbar = (0, __doeFn_element)("div", "block-toolbar");
    const replacement = (0, __doeFn_contentsReplacementButton)(node, state);
    if (replacement) toolbar.append(replacement);
    toolbar.setAttribute("role", "toolbar");
    toolbar.setAttribute("aria-label", "更改布局");
    if ((0, __doeFn_isCompositionGroup)(node) && !(0, __doeFn_isContentsGroup)(node)) {
      toolbar.append(
        (0, __doeFn_element)(
          "span",
          "block-toolbar__label",
          `组合 · ${node.layout.preset || "auto"}`,
        ),
      );
      [
        { label: "左右", direction: "row" },
        { label: "上下", direction: "stack" },
      ].forEach((option) => {
        const button = (0, __doeFn_element)(
          "button",
          "block-toolbar__button",
          option.label,
        );
        button.type = "button";
        button.setAttribute(
          "aria-pressed",
          String(node.layout.direction === option.direction),
        );
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          (0, __doeFn_queueMutation)(state, `组合切换为${option.label}`, () =>
            (0, __doeFn_updateCompositionLayout)(state, node.id, {
              direction: option.direction,
            }),
          );
        });
        toolbar.append(button);
      });
      if (node.layout.direction !== "stack" && node.children.length === 2) {
        [
          { label: "均分", ratio: "balanced" },
          { label: "主左", ratio: "primary-first" },
          { label: "主右", ratio: "primary-second" },
        ].forEach((option) => {
          const button = (0, __doeFn_element)(
            "button",
            "block-toolbar__button",
            option.label,
          );
          button.type = "button";
          button.setAttribute(
            "aria-pressed",
            String(node.layout.ratio === option.ratio),
          );
          button.addEventListener("click", (event) => {
            event.stopPropagation();
            (0, __doeFn_queueMutation)(state, `组合比例${option.label}`, () =>
              (0, __doeFn_updateCompositionLayout)(state, node.id, { ratio: option.ratio }),
            );
          });
          toolbar.append(button);
        });
      }
      if (node.layout.direction !== "stack") {
        toolbar.append((0, __doeFn_element)("span", "block-toolbar__label", "纵向"));
        [
          { label: "上", title: "组合内居上", align: "start" },
          { label: "中", title: "组合内居中", align: "center" },
          { label: "下", title: "组合内居下", align: "end" },
        ].forEach((option) => {
          const button = (0, __doeFn_element)(
            "button",
            "block-toolbar__button",
            option.label,
          );
          button.type = "button";
          button.title = option.title;
          button.setAttribute("aria-label", option.title);
          button.setAttribute(
            "aria-pressed",
            String(
              node.layout.align === option.align ||
                (option.align === "center" && node.layout.align === "stretch"),
            ),
          );
          button.addEventListener("click", (event) => {
            event.stopPropagation();
            (0, __doeFn_queueMutation)(state, option.title, () =>
              (0, __doeFn_updateCompositionLayout)(state, node.id, { align: option.align }),
            );
          });
          toolbar.append(button);
        });
      }
      [
        { label: `正文≥${__doeScope.MIN_READABLE_FONT_PT}pt`, minBodyPt: __doeScope.MIN_READABLE_FONT_PT, mode: "readable" },
        { label: `允许${__doeScope.MIN_MICRO_FONT_PT}pt`, minBodyPt: __doeScope.MIN_MICRO_FONT_PT, mode: "micro" },
      ].forEach((option) => {
        const button = (0, __doeFn_element)(
          "button",
          "block-toolbar__button",
          option.label,
        );
        button.type = "button";
        button.setAttribute(
          "aria-pressed",
          String(
            Number(node.layout.textFit?.minBodyPt) === option.minBodyPt,
          ),
        );
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          (0, __doeFn_queueMutation)(state, `文字下限${option.minBodyPt}pt`, () =>
            (0, __doeFn_updateCompositionLayout)(state, node.id, {
              textFit: {
                mode: option.mode,
                minBodyPt: option.minBodyPt,
              },
            }),
          );
        });
        toolbar.append(button);
      });
      const swapButton = (0, __doeFn_element)(
        "button",
        "block-toolbar__button",
        "交换",
      );
      swapButton.type = "button";
      swapButton.addEventListener("click", (event) => {
        event.stopPropagation();
        (0, __doeFn_queueMutation)(state, "交换组合内容", () =>
          (0, __doeFn_swapCompositionChildren)(state, node.id),
        );
      });
      toolbar.append(swapButton);
      const splitButton = (0, __doeFn_element)(
        "button",
        "block-toolbar__button",
        "拆分",
      );
      splitButton.type = "button";
      splitButton.addEventListener("click", (event) => {
        event.stopPropagation();
        (0, __doeFn_queueMutation)(state, "拆分组合", () =>
          (0, __doeFn_splitCompositionGroup)(state, node.id),
        );
      });
      toolbar.append(splitButton);
      return toolbar;
    }

    if ((0, __doeFn_isEdgeSplitGroup)(node)) {
      toolbar.append((0, __doeFn_element)("span", "block-toolbar__label", "贴边布局"));
      toolbar.append(
        (0, __doeFn_element)(
          "span",
          "edge-media-ratio-readout",
          `图片 ${Math.round(
            (0, __doeFn_normalizeEdgeMediaRatio)(
              node.layout.mediaRatio,
              (0, __doeFn_edgeMediaPosition)(node),
            ) * 100,
          )}%`,
        ),
      );
      [
        { label: "图片在左", position: "left" },
        { label: "图片在右", position: "right" },
        { label: "图片在上", position: "top" },
        { label: "图片在下", position: "bottom" },
      ].forEach((option) => {
        const button = (0, __doeFn_element)(
          "button",
          "block-toolbar__button",
          option.label,
        );
        button.type = "button";
        button.dataset.edgeMediaPosition = option.position;
        button.setAttribute(
          "aria-pressed",
          String((0, __doeFn_edgeMediaPosition)(node) === option.position),
        );
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          if ((0, __doeFn_edgeMediaPosition)(node) === option.position) return;
          state.selectedId = node.id;
          (0, __doeFn_queueMutation)(state, option.label, () =>
            (0, __doeFn_setEdgeMediaPosition)(state, node.id, option.position),
          );
        });
        toolbar.append(button);
      });
      [
        { label: "直线", shape: "straight" },
        { label: "Fade", shape: "fade" },
        { label: "斜线", shape: "diagonal" },
        { label: "圆", shape: "circle" },
        { label: "内圆", shape: "inner-circle" },
      ].forEach((option) => {
        const button = (0, __doeFn_element)(
          "button",
          "block-toolbar__button",
          option.label,
        );
        button.type = "button";
        button.dataset.edgeMediaShape = option.shape;
        button.setAttribute(
          "aria-pressed",
          String((0, __doeFn_edgeMediaShape)(node) === option.shape),
        );
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          if ((0, __doeFn_edgeMediaShape)(node) === option.shape) return;
          state.selectedId = node.id;
          (0, __doeFn_queueMutation)(state, `边界样式：${option.label}`, () =>
            (0, __doeFn_setEdgeMediaShape)(state, node.id, option.shape),
          );
        });
        toolbar.append(button);
      });
      return toolbar;
    }

    toolbar.append(
      (0, __doeFn_element)(
        "span",
        "block-toolbar__label",
        (0, __doeFn_isCollectionGroup)(node)
          ? `集合 · ${node.layout.collectionKey || "items"}`
          : "更改布局",
      ),
    );
    const maximumToolbarColumns = (0, __doeFn_isContentsGroup)(node) ? (0, __doeFn_contentsMaximumColumns)(node) : (0, __doeFn_isCollectionGroup)(node)
      ? Math.max(
          1,
          Number(node.layout.maxColumns) || 1,
          Number((0, __doeFn_collectionContract)(node)?.maxColumns) || 1,
        )
      : 4;
    const options = [
      { label: "自动", variant: "auto-grid", columns: "auto" },
      { label: "单列", variant: "stack", columns: 1 },
      ...Array.from(
        { length: Math.max(0, Math.min(6, maximumToolbarColumns) - 1) },
        (_, index) => ({
          label: `${index + 2}列`,
          variant: "grid",
          columns: index + 2,
        }),
      ),
    ];
    options.forEach((option) => {
      if (node.layout.variant === "columns") option.variant = "columns";
      const button = (0, __doeFn_element)("button", "block-toolbar__button", option.label);
      button.type = "button";
      const selected =
        node.layout.variant === option.variant &&
        (option.columns === "auto" || node.layout.columns === option.columns);
      button.setAttribute("aria-pressed", String(selected));
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        state.selectedId = node.id;
        (0, __doeFn_queueMutation)(state, `切换为${option.label}`, () => {
          node.layout.variant = option.variant;
          node.layout.columns = option.columns;
          if ((0, __doeFn_isCollectionGroup)(node)) {
            node.layout.direction = option.columns === 1 ? "stack" : "row";
            if (Number.isFinite(Number(option.columns))) {
              node.layout.maxColumns = Math.max(
                Number(node.layout.maxColumns) || 1,
                Number(option.columns),
              );
            }
          }
          return true;
        });
      });
      toolbar.append(button);
    });
    if ((0, __doeFn_isCollectionGroup)(node)) {
      const splitButton = (0, __doeFn_element)(
        "button",
        "block-toolbar__button",
        "拆为独立块",
      );
      splitButton.type = "button";
      splitButton.addEventListener("click", (event) => {
        event.stopPropagation();
        (0, __doeFn_queueMutation)(state, "拆分集合", () =>
          (0, __doeFn_splitCompositionGroup)(state, node.id),
        );
      });
      toolbar.append(splitButton);
    }
    return toolbar;
  }
