// Origin: public/yrkie-doe/layout-engine/text-fields.js:22
import { scope as __doeScope } from "../runtime/context/index.js";

export function fields(root, node) {
    const custom = __doeScope.global.SlideEngine?.components.get(node.type)?.textFields;
    if (custom) return custom(root, node);
    const result = [];
    const props = node.props || {};
    const add = (selector, path, index = 0, options = {}) => {
      const targets = [...(root.matches(selector) ? [root] : []), ...root.querySelectorAll(selector)];
      const target = targets[index];
      if (target) result.push({ target, path: (0, __doeScope.pathOf)(path), label: options.label || "文字", ...options });
    };
    const many = (selector, path, key, options = {}) => {
      ((0, __doeScope.read)(props, path) || []).forEach((value, index) => {
        add(selector, [...(0, __doeScope.pathOf)(path), index, ...(key ? [key] : [])], index, options);
      });
    };
    const simple = (prefix, entries) => entries.forEach(([suffix, path]) => add(`${prefix}${suffix}`, path));
    const content = props.content || {};
    switch (node.type) {
      case "hero": simple(".component-hero__", [["eyebrow", "eyebrow"], ["title", "title"], ["subtitle", "subtitle"]]); break;
      case "heading": add(".component-heading", "text"); add(".component-heading__kicker", "kicker"); break;
      case "text": add(".component-title", "title"); add(".component-text__body", "text"); break;
      case "image-text": case "icon-text":
        add(".base-media__title", "title", 0, { required: true }); add(".base-media__text", "text", 0, { required: true }); break;
      case "stat": simple(".component-stat__", [["value", "value"], ["label", "label"], ["description", "description"]]); break;
      case "quote": add("blockquote", "text"); add("figcaption", "source"); break;
      case "list": add(".component-title", "title"); many(".component-list__text", "items"); break;
      case "ordered-list": add(".component-title", "title"); many(".component-list__text", "items"); break;
      case "item-cards": many(".item-cards__title", "items", "title"); many(".item-cards__text", "items", "text"); break;
      case "shape-contents": many(".shape-contents__title", "items", "title", { required: true }); many(".shape-contents__text", "items", "text", { required: true }); break;
      case "todo-list": add(".component-title", "title"); many(".component-list__text", "items", "text"); break;
      case "notice": add(".component-notice__text", "text"); break;
      case "question-card":
        simple(".component-question-card__", [["title", "title"], ["text", "text"]]);
        if (props.index != null && props.index !== "") add(".component-question-card__index", "index");
        break;
      case "media": add("figcaption", "caption"); break;
      case "capability-cards":
        many(".ppt-capability-cards__label", "content.items", "title");
        many(".ppt-capability-cards__text", "content.items", "text"); break;
      case "numbered-icon-cards":
        many(".ppt-numbered-icon-cards__heading", "content.items", "title");
        many(".ppt-numbered-icon-cards__text", "content.items", "text"); break;
      // Components without an explicit editing contract retain their original DOM.
      default: return result;
    }
    // Native renderers share the title/subtitle convention, when present.
    for (const key of ["title", "subtitle"]) {
      const target = root.querySelector(`.ppt-${node.type}__${key}`);
      if (target && !result.some((field) => field.target === target)) result.push({ target, path: [key], label: "文字" });
    }
    return result;
  }
