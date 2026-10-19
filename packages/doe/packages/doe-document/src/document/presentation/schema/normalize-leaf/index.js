import { normalizeCollectionProps as __doeFn_normalizeCollectionProps } from '../normalize-collection-props/index.js';
import { normalizeOverrides } from '../../../../../../doe-core/src/text/inline-format/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:790
import { scope as __doeScope } from "../../runtime/context/index.js";

export function normalizeLeaf(item, path, warnings) {
    const requestedType = item.type;
    const type = requestedType === "metric" ? "stat" : requestedType;
    const sourceProps =
      item.props && typeof item.props === "object" ? item.props : {};
    let props =
      requestedType === "metric"
        ? {
            value: sourceProps.value,
            label: sourceProps.label,
            description: sourceProps.description ?? sourceProps.delta,
          }
        : sourceProps;
    props = (0, __doeFn_normalizeCollectionProps)(type, props);
    if (type === "text" && Object.hasOwn(props, "textRole")) {
      props = { ...props };
      delete props.textRole;
    }
    if (__doeScope.TRANSPARENT_TEXT_COMPONENT_TYPES.has(type)) {
      const blockedProps = __doeScope.BLOCKED_TEXT_BACKGROUND_PROPS.filter(
        (property) => sourceProps[property] !== undefined,
      );
      if (blockedProps.length) {
        props = { ...props };
        blockedProps.forEach((property) => delete props[property]);
        warnings.push(
          `${item.id || type} 是透明文字组件；已忽略 ${blockedProps.join(", ")}。`,
        );
      }
    }
    if (type === "media") {
      const blockedProps = __doeScope.BLOCKED_MEDIA_DECORATION_PROPS.filter(
        (property) => sourceProps[property] !== undefined,
      );
      if (blockedProps.length) {
        props = { ...props };
        blockedProps.forEach((property) => delete props[property]);
        warnings.push(
          `${item.id || type} is image-only; ignored ${blockedProps.join(", ")}. Use a separate text or heading component.`,
        );
      }
    }
    if (requestedType === "metric") {
      warnings.push(`${item.id || "metric"} 已从旧 metric 自动迁移为 stat。`);
    }
    const definition = __doeScope.components.get(type);
    if (!definition) throw new Error(`未知组件类型: '${requestedType}'。`);
    definition.validate?.(props, warnings, item);
    const textOverrides=normalizeOverrides(item.textOverrides,props);
    return {
      id: item.id || `${item.type}-${path.join("-")}`,
      type,
      props,
      ...(textOverrides.length?{textOverrides}:{}),
      layout: {
        // `auto` keeps the author's intent distinct from an explicit
        // `span: "full"`. Inside a homogeneous grid/collection, auto means
        // one visual cell; in a mixed grid it can still use the component's
        // default span (for example a heading spanning the full row).
        span: item.layout?.span ?? "auto",
        priority: Number(item.layout?.priority) || 50,
        region: item.layout?.region || null,
        lock: item.layout?.lock || null,
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
        slotSpace: {
          ...definition.slotSpace,
          ...(item.layout?.slotSpace || {}),
        },
      },
    };
  }
