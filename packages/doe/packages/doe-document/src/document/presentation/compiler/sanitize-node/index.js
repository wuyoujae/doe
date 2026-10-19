import { retainKnownKeys as __doeFn_retainKnownKeys } from '../retain-known-keys/index.js';
import { normalizeGroupLayout as __doeFn_normalizeGroupLayout } from '../normalize-group-layout/index.js';
import { normalizeLeafLayout as __doeFn_normalizeLeafLayout } from '../normalize-leaf-layout/index.js';
import { looksLikeCodeText as __doeFn_looksLikeCodeText } from '../looks-like-code-text/index.js';
import { inferCodeLanguage as __doeFn_inferCodeLanguage } from '../infer-code-language/index.js';
import { normalizeComponentProps as __doeFn_normalizeComponentProps } from '../normalize-component-props/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:1594
import { scope as __doeScope } from "../runtime/context/index.js";

export function sanitizeNode(node, path, diagnostics) {
    if (!node || typeof node !== "object") {
      diagnostics.push({
        code: "invalid-node-replaced",
        level: "repair",
        nodeId: null,
        message: `slide.blocks.${path.join(".")} 不是有效节点，已替换为诊断组件`,
      });
      return {
        id: `unsupported-${path.join("-")}`,
        type: "unsupported",
        props: { requestedType: "missing-node", originalProps: { value: node } },
      };
    }
    (0, __doeFn_retainKnownKeys)(
      node,
      node.type === "layout-group" ? __doeScope.PUBLIC_GROUP_NODE_PROPS : __doeScope.PUBLIC_NODE_PROPS,
      diagnostics,
      node.id || `node-${path.join("-")}`,
      "node",
    );
    if (node.type === "layout-group") {
      node.kind = ["layout", "container", "collection", "cluster"].includes(node.kind)
        ? node.kind
        : "layout";
      node.layout = (0, __doeFn_normalizeGroupLayout)(
        node.layout,
        diagnostics,
        node.id || `layout-group-${path.join("-")}`,
      );
      if (node.kind === "cluster" || node.layout.cluster === true) {
        // Canonicalize both markers. The renderer recognizes either form, but
        // retaining both makes round trips and AI-authored diffs unambiguous.
        node.kind = "cluster";
        node.layout.cluster = true;
      }
      if (!Array.isArray(node.children)) {
        diagnostics.push({
          code: "children-normalized",
          level: "repair",
          nodeId: node.id || null,
          message: `${node.id || "layout-group"}.children 已规范化为空数组`,
        });
        node.children = [];
      }
      node.children = node.children.map((child, index) =>
        (0, sanitizeNode)(child, [...path, index + 1], diagnostics),
      );
      if (!node.children.length) {
        diagnostics.push({
          code: "empty-group-replaced",
          level: "repair",
          nodeId: node.id || null,
          message: `${node.id || "layout-group"} 没有可渲染子项，已替换为诊断占位并继续渲染。`,
        });
        return {
          id: node.id || `empty-group-${path.join("-")}`,
          type: "unsupported",
          props: {
            requestedType: "empty-layout-group",
            originalProps: {},
            originalLayout: node.layout,
          },
          layout: (0, __doeFn_normalizeLeafLayout)(
            node.layout,
            diagnostics,
            node.id || `empty-group-${path.join("-")}`,
          ),
        };
      }
      return node;
    }
    // The former `steps` card is no longer public. Saved decks migrate to the
    // neutral list primitive instead of rendering an unknown dark card.
    if (node.type === "steps") {
      const legacyProps =
        node.props && typeof node.props === "object" ? node.props : {};
      node.type = "list";
      node.props = {
        ...(legacyProps.title ? { title: legacyProps.title } : {}),
        itemLayout: "stack",
        items: (Array.isArray(legacyProps.items) ? legacyProps.items : [])
          .map((item) => {
            if (typeof item === "string") return item;
            const title = String(item?.title || "").trim();
            const text = String(item?.text || "").trim();
            return [title, text].filter(Boolean).join("：");
          })
          .filter(Boolean),
      };
      diagnostics.push({
        code: "legacy-steps-migrated",
        level: "repair",
        nodeId: node.id || null,
        message: `${node.id || "steps"} was migrated from removed steps to list.`,
      });
    }
    // `metric` was an early, presentation-specific KPI card. It is no longer
    // part of the public component registry; migrate old decks before the
    // unknown-component guard so saved schemas remain editable and render as
    // the neutral `stat` primitive.
    if (node.type === "metric") {
      const legacyProps =
        node.props && typeof node.props === "object" ? node.props : {};
      node.type = "stat";
      node.props = {
        ...legacyProps,
        description: legacyProps.description ?? legacyProps.delta,
      };
      delete node.props.delta;
      diagnostics.push({
        code: "legacy-metric-migrated",
        level: "repair",
        nodeId: node.id || null,
        message: `${node.id || "metric"} was migrated from legacy metric to stat.`,
      });
    }
    if (node.type === "text" && (0, __doeFn_looksLikeCodeText)(node.props?.text)) {
      const legacyProps =
        node.props && typeof node.props === "object" ? node.props : {};
      node.type = "code-block";
      node.props = {
        code: legacyProps.text,
        language: (0, __doeFn_inferCodeLanguage)(legacyProps.text),
        ...(legacyProps.title ? { title: legacyProps.title } : {}),
        wrap: true,
      };
      diagnostics.push({
        code: "multiline-code-text-migrated",
        level: "repair",
        nodeId: node.id || null,
        message: `${node.id || "text"} was migrated from multiline text to code-block.`,
      });
    }
    // Component subtitles are intentionally not part of line/donut chart
    // grammar.  Drop the legacy field during schema normalization so it is
    // absent from editor state and exports, rather than merely hidden by CSS.
    if (
      (node.type === "line-chart" || node.type === "donut-chart") &&
      node.props &&
      typeof node.props === "object" &&
      Object.prototype.hasOwnProperty.call(node.props, "subtitle")
    ) {
      delete node.props.subtitle;
      diagnostics.push({
        code: "legacy-chart-subtitle-removed",
        level: "repair",
        nodeId: node.id || null,
        message: `${node.id || node.type}.subtitle is not supported and was removed.`,
      });
    }
    if (!node.type || !__doeScope.engine.components.has(node.type)) {
      const requestedType = node.type || "missing-type";
      diagnostics.push({
        code: "unknown-component-preserved",
        level: "repair",
        nodeId: node.id || null,
        message: `${requestedType} 尚未注册；原始属性已保留在 unsupported 诊断组件中`,
      });
      return {
        id: node.id || `unsupported-${path.join("-")}`,
        type: "unsupported",
        props: {
          requestedType,
          originalProps: node.props || {},
          originalLayout: node.layout || {},
        },
        layout: node.layout || {},
      };
    }
    node.props = (0, __doeFn_normalizeComponentProps)(
      node.type,
      node.props,
      diagnostics,
      node.id || node.type,
    );
    node.layout = (0, __doeFn_normalizeLeafLayout)(
      node.layout,
      diagnostics,
      node.id || node.type,
    );
    return node;
  }
