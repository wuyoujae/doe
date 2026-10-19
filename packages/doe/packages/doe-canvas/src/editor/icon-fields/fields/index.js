// Origin: public/yrkie-doe/layout-engine/icon-fields.js:4
import { scope as __doeScope } from "../runtime/context/index.js";

export function fields(root, node) {
    const custom = __doeScope.global.SlideEngine?.components.get(node.type)?.iconFields;
    if (custom) return custom(root, node);
    const result = [];
    const add = (target, path) => { if (target) result.push({ target, path }); };
    const many = (itemSelector, iconSelector, path) => {
      root.querySelectorAll(itemSelector).forEach((item, index) => {
        add(item.querySelector(iconSelector), [...path, index, "icon"]);
      });
    };
    switch (node.type) {
      case "question-card": add(root.querySelector('[data-question-icon] svg'), ["icon"]); break;
      case "icon-text": add(root.querySelector(".base-media__icon svg"), ["icon"]); break;
      case "hero": add(root.querySelector(".component-hero__eyebrow-icon"), ["icon"]); break;
      case "notice": add(root.querySelector(".component-notice__icon"), ["icon"]); break;
      case "item-cards":
        root.querySelectorAll(".item-cards__item").forEach((item, index) => {
          item.querySelectorAll(".item-cards__icon svg").forEach(target => {
            const ownerIndex = Number(target.closest(".item-cards__icon").dataset.connectorIconIndex ?? index);
            add(target, ["items", ownerIndex, "icon"]);
          });
        });
        break;
      case "capability-cards": many(".ppt-capability-cards__card", ".ppt-capability-cards__icon svg", ["content", "items"]); break;
      case "numbered-icon-cards": many(".ppt-numbered-icon-cards__item", ".ppt-numbered-icon-cards__badge svg", ["content", "items"]); break;
    }
    return result;
  }
