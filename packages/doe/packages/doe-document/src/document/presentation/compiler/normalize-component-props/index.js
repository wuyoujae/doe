import { stripUnknownKeys as __doeFn_stripUnknownKeys } from '../strip-unknown-keys/index.js';
import { integerOrDefault as __doeFn_integerOrDefault } from '../integer-or-default/index.js';
import { enumOrDefault as __doeFn_enumOrDefault } from '../enum-or-default/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:152
import { scope as __doeScope } from "../runtime/context/index.js";

export function normalizeComponentProps(type, source, diagnostics, nodeId) {
    const allowed = new Set(__doeScope.PUBLIC_COMPONENT_PROPS[type] || []);
    const props = (0, __doeFn_stripUnknownKeys)(__doeScope.engine.normalizeCollectionProps(type, source), allowed, diagnostics, nodeId, "props");

    if (type === "contents" || type === "image-text") {
      const imageOptionsAllowed = type === "image-text" || props.presentation === "image-text";
      for (const [key, values] of Object.entries({ imageSize: ["compact", "full"], imageFit: ["contain", "cover"], imageAspectRatio: ["1:1", "4:3", "3:4", "16:9"], surface: ["none", "soft"] })) {
        if (!Object.hasOwn(props, key)) continue;
        if (imageOptionsAllowed && values.includes(props[key])) continue;
        delete props[key];
        diagnostics.push({ code: "invalid-image-option-ignored", level: "repair", nodeId: nodeId || null, message: `Unsupported ${type}.${key} was ignored.` });
      }
    }

    if (type === "heading") {
      props.level = (0, __doeFn_integerOrDefault)(props.level, 1, 3, 1);
      if (props.variant !== undefined && !["section", "plain", "display"].includes(props.variant)) delete props.variant;
    }
    if (type === "item-cards") {
      props.itemLayout = (0, __doeFn_enumOrDefault)(props.itemLayout, ["auto", "stack", "grid"], "auto");
      props.itemColumns = (0, __doeFn_integerOrDefault)(props.itemColumns, 1, 3, 3);
      props.variant = (0, __doeFn_enumOrDefault)(props.variant, ["filled", "filled-icon", "outline", "side-rule", "top-rule", "top-icon", "connected", "connected-icon", "leaf", "quote", "bubble"], "filled");
    }
    if (["list", "ordered-list", "todo-list"].includes(type)) {
      props.itemLayout = (0, __doeFn_enumOrDefault)(props.itemLayout, ["auto", "stack", "grid"], "auto");
      props.itemColumns = (0, __doeFn_integerOrDefault)(props.itemColumns, 1, 2, 2);
    }
    if (type === "media") {
      props.format = (0, __doeFn_enumOrDefault)(props.format, ["auto", "gif"], "auto");
      props.fit = (0, __doeFn_enumOrDefault)(
        props.fit,
        ["auto", "natural", "contain", "cover", "fill"],
        "auto",
      );
      props.aspectRatio = (0, __doeFn_enumOrDefault)(
        props.aspectRatio,
        ["auto", "1:1", "4:3", "3:4", "16:9", "9:16"],
        "auto",
      );
      props.position = typeof props.position === "string" && props.position.trim()
        ? props.position.trim()
        : "50% 50%";
    }
    if (type === "code-block") {
      props.language = (0, __doeFn_enumOrDefault)(
        props.language,
        ["python", "javascript", "typescript", "json", "html", "css", "sql", "shell", "text"],
        "text",
      );
      props.wrap = typeof props.wrap === "boolean" ? props.wrap : true;
    }

    if (["capability-cards", "numbered-icon-cards"].includes(type)) {
      props.itemLayout = (0, __doeFn_enumOrDefault)(props.itemLayout, ["auto", "stack", "grid"], "auto");
      props.itemColumns = (0, __doeFn_integerOrDefault)(props.itemColumns, 1, 3, 3);
    }
    if (type === "table") {
      props.borderStyle = (0, __doeFn_enumOrDefault)(props.borderStyle, ["grid", "none", "three-line"], "grid");
      props.columnSizing = (0, __doeFn_enumOrDefault)(props.columnSizing, ["auto", "equal", "adaptive"], "auto");
      if (
        props.semanticWrap !== undefined &&
        props.semanticWrap !== false &&
        (!props.semanticWrap || typeof props.semanticWrap !== "object" || Array.isArray(props.semanticWrap))
      ) {
        delete props.semanticWrap;
      }
    }
    if (["grouped-bar-chart", "stacked-bar-chart", "radar-chart"].includes(type)) {
      props.showLegend = typeof props.showLegend === "boolean" ? props.showLegend : true;
    }
    if (type === "line-chart") {
      props.showLegend = typeof props.showLegend === "boolean" ? props.showLegend : true;
      props.smooth = typeof props.smooth === "boolean" ? props.smooth : true;
    }
    return props;
  }
