import { targetOf as __doeFn_targetOf } from '../../../../../shared/process-diagrams/target-of/index.js';
import { capabilityCardColumns as __doeFn_capabilityCardColumns } from '../capability-card-columns/index.js';
import { setHost as __doeFn_setHost } from '../../../../../shared/process-diagrams/set-host/index.js';
import { applyTypographyStyle as __doeFn_applyTypographyStyle } from '../../../../../shared/process-diagrams/apply-typography-style/index.js';
import { capabilityIcon as __doeFn_capabilityIcon } from '../capability-icon/index.js';
// Origin: public/yrkie-doe/components/process-diagrams/process-diagrams.js:755
import { scope as __doeScope } from "../../../../../shared/process-diagrams/runtime/context/index.js";

export function mountCapabilityCards(target, config) {
    const host = (0, __doeFn_targetOf)(target, "CapabilityCards");
    const items = config?.content?.items;
    if (!Array.isArray(items) || !items.length) {
      throw new Error("CapabilityCards: content.items is required.");
    }
    const width = Number(config.size?.width) || 720;
    const columns = (0, __doeFn_capabilityCardColumns)(config, items.length);
    const rows = Math.max(1, Math.ceil(items.length / columns));
    const height = Math.max(96, Number(config.size?.height) || 96);
    (0, __doeFn_setHost)(host, "ppt-capability-cards", width, height, "Capability cards");
    const list = __doeScope.utils.element("div", "ppt-capability-cards__list");
    list.dataset.columns = String(columns);
    list.dataset.rows = String(rows);
    list.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
    items.forEach((item, index) => {
      const card = __doeScope.utils.element("article", "ppt-capability-cards__card");
      card.dataset.collectionItemIndex = String(index);
      const legacyText = Array.isArray(item.bullets) ? item.bullets.join("；") : "";
      const copy = (0, __doeFn_applyTypographyStyle)(
        __doeScope.utils.element("p", "ppt-capability-cards__text", item.text || legacyText),
        "large",
      );
      const icon = __doeScope.utils.element("div", "ppt-capability-cards__icon");
      icon.append((0, __doeFn_capabilityIcon)(item));
      card.append(
        (0, __doeFn_applyTypographyStyle)(
          __doeScope.utils.element("div", "ppt-capability-cards__label", item.title),
          "large",
        ),
        icon,
        copy
      );
      list.append(card);
    });
    __doeScope.global.DOEContentsLayout.applyGrid(list, [...list.children], columns);
    host.append(list);
    host.style.height = "auto";
    // Each row follows its own tallest item as fonts and wrapping settle.
    list.style.gridTemplateRows = `repeat(${rows}, max-content)`;
    void list.offsetHeight;
    const resolvedHeight = Math.ceil(host.scrollHeight);
    host.dataset.resolvedHeight = String(resolvedHeight);
    return { element: host, size: { width, height: resolvedHeight } };
  }
