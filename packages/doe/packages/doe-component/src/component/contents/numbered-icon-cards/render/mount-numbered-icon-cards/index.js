import { targetOf as __doeFn_targetOf } from '../../../../../shared/process-diagrams/target-of/index.js';
import { numberedIconCardColumns as __doeFn_numberedIconCardColumns } from '../numbered-icon-card-columns/index.js';
import { setHost as __doeFn_setHost } from '../../../../../shared/process-diagrams/set-host/index.js';
import { applyTypographyStyle as __doeFn_applyTypographyStyle } from '../../../../../shared/process-diagrams/apply-typography-style/index.js';
import { numberedCardIcon as __doeFn_numberedCardIcon } from '../../../../../shared/process-diagrams/numbered-card-icon/index.js';
// Origin: public/yrkie-doe/components/process-diagrams/process-diagrams.js:1080
import { scope as __doeScope } from "../../../../../shared/process-diagrams/runtime/context/index.js";

export function mountNumberedIconCards(target, config) {
    const host = (0, __doeFn_targetOf)(target, "NumberedIconCards");
    const items = config?.content?.items;
    if (!Array.isArray(items) || items.length < 2 || items.length > 6) {
      throw new Error("NumberedIconCards: content.items requires two to six items.");
    }
    const width = Number(config.size?.width) || 960;
    const columns = (0, __doeFn_numberedIconCardColumns)(config, items.length);
    const rows = Math.max(1, Math.ceil(items.length / columns));
    const cardHeight = rows === 1 ? 330 : rows === 2 ? 260 : 170;
    const rowGap = rows === 1 ? 0 : 18;
    const height = Number(config.size?.height)
      || Math.max(220, rows * cardHeight + Math.max(0, rows - 1) * rowGap);
    (0, __doeFn_setHost)(host, "ppt-numbered-icon-cards", width, height, "Bottom-right badge cards");
    const list = __doeScope.utils.element("div", "ppt-numbered-icon-cards__list");
    list.dataset.columns = String(columns);
    list.dataset.rows = String(rows);
    list.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
    // Every card in the same row uses the tallest card's natural height. The
    // max-content floor is deliberate: minmax(0, 1fr) allowed long copy to be
    // silently clipped inside a visually equal but undersized row.
    list.style.gridTemplateRows = `repeat(${rows}, max-content)`;
    items.forEach((item, index) => {
      const node = __doeScope.utils.element("article", "ppt-numbered-icon-cards__item");
      node.dataset.collectionItemIndex = String(index);
      const surface = __doeScope.utils.element("div", "ppt-numbered-icon-cards__surface");
      surface.append(
        (0, __doeFn_applyTypographyStyle)(
          __doeScope.utils.element("h3", "ppt-numbered-icon-cards__heading", item.title),
          "h3",
        ),
        (0, __doeFn_applyTypographyStyle)(
          __doeScope.utils.element("p", "ppt-numbered-icon-cards__text", item.text),
          "large",
        ),
      );
      const badge = __doeScope.utils.element("div", "ppt-numbered-icon-cards__badge");
      badge.append((0, __doeFn_numberedCardIcon)(item));
      node.append(surface, badge);
      list.append(node);
    });
    __doeScope.global.DOEContentsLayout.applyGrid(list, [...list.children], columns);
    host.append(list);
    // Content length, semantic wrapping and the circular badge jointly decide
    // the real card height.  Never crop those internals to the pre-estimated
    // component slot; expose the natural equal-row height to the page solver.
    host.style.height = "auto";
    void list.offsetHeight;
    const resolvedHeight = Math.max(
      1,
      Math.ceil(host.scrollHeight),
      Math.ceil(list.scrollHeight),
    );
    host.dataset.resolvedHeight = String(resolvedHeight);
    return { element: host, size: { width, height: resolvedHeight } };
  }
