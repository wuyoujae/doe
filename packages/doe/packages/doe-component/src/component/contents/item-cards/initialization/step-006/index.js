import { collectionColumns, collectionColumnOrder } from '../../../../../layout/compression/style-first/index.js';
import { icon as __doeFn_icon } from '../../icon/index.js';
import { text as __doeFn_text } from '../../text/index.js';
import { arrange as __doeFn_arrange } from '../../arrange/index.js';
// Origin: public/yrkie-doe/components/item-cards/item-cards.js:52
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.engine.registerComponent("item-cards", {
    category: "contents",
    flowLayout: { contentGrid: { grid: '.item-cards__grid', item: '.item-cards__item', surface: '.item-cards__surface' } },
    defaultSpan: "full", minWidth: 240, columnMinWidth: 240, family: "narrative",
    composition: { enabled: true, family: "narrative", minWidth: 240, preferredWidth: 960, allowedWith: ["narrative", "data", "media"] },
    layoutContract: { role: "flow", minWidth: 240, preferredWidth: 960, minHeight: 96, text: { reflow: true, minPt: __doeScope.engine.TYPOGRAPHY.styles.normal.sizes.compact }, canSplit: false },
    itemCollection: { path: "items", key: "item-card", reorderable: true, layouts: ["stack", "grid", "auto-grid"], maxColumns: 4, autoColumnOrder: count => collectionColumnOrder(count) },
    validate(props, warnings) {
      if (!Array.isArray(props.items) || !props.items.length || props.items.length > 12 || props.items.some(item => typeof item?.title !== "string" || typeof item?.text !== "string")) warnings.push("item-cards.items requires 1–12 title/text items.");
      if (props.variant && !__doeScope.variants.includes(props.variant)) warnings.push("Unsupported item-cards variant.");
    },
    render(component, { element }) {
      const variant = __doeScope.variants.includes(component.props.variant) ? component.props.variant : "filled";
      const root = element("article", "item-cards"); root.dataset.variant = variant;
      root.dataset.connected = String((0, __doeScope.connected)(variant));
      const grid = element("div", "item-cards__grid"); root.append(grid);
      root.__connectorIcons = (component.props.items || []).map(item => item.icon || 'Sparkles');
      root.__items = (component.props.items || []).map((item, index) => {
        const card = element("section", "item-cards__item"); card.dataset.collectionItemIndex = String(index);
        const surface = element("div", "item-cards__surface"); card.append(surface);
        if (variant === "quote") {
          for (const corner of ["open", "close"]) {
            const mark = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            mark.setAttribute("viewBox", "0 0 32 24"); mark.setAttribute("class", `item-cards__quote item-cards__quote--${corner}`); mark.setAttribute("aria-hidden", "true");
            const glyph = document.createElementNS(mark.namespaceURI, "path");
            glyph.setAttribute("d", "M13 2C5 3 2 9 2 17V22H13V11H8C8 7 10 5 13 4Z M29 2C21 3 18 9 18 17V22H29V11H24C24 7 26 5 29 4Z");
            if (corner === "close") glyph.setAttribute("transform", "rotate(180 16 12)");
            mark.append(glyph); surface.append(mark);
          }
        }
        if (variant === "bubble") {
          const tail = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          tail.setAttribute("viewBox", "0 0 26 20"); tail.setAttribute("class", "item-cards__tail"); tail.setAttribute("aria-hidden", "true");
          const fill = document.createElementNS(tail.namespaceURI, "path"); fill.setAttribute("d", "M0 0H25V19Z");
          const edge = document.createElementNS(tail.namespaceURI, "path"); edge.setAttribute("d", "M0 0 25 19V0"); edge.setAttribute("class", "item-cards__tail-edge");
          tail.append(fill, edge); surface.append(tail);
        }
        if (["filled-icon", "top-icon"].includes(variant)) {
          const badge = element("span", "item-cards__icon"); badge.setAttribute("contenteditable", "false");
          badge.append((0, __doeFn_icon)(item.icon || "Sparkles")); surface.append(badge);
        }
        surface.append((0, __doeFn_text)(element, "h4", "item-cards__title", item.title, "h4", "title"), (0, __doeFn_text)(element, "p", "item-cards__text", item.text, "large", "paragraph"));
        return card;
      });
      (0, __doeFn_arrange)(root, Math.min(3, root.__items.length) || 1);
      return root;
    },
    adapt(root, component, context) {
      const gap = (0, __doeScope.connected)(root.dataset.variant) ? 0 : (Number(context.gap) || 24);
      root.style.setProperty("--item-cards-gap", `${gap}px`);
      const requested = context.flowLayout && Number(context.autoItemColumns) > 0 ? Number(context.autoItemColumns)
        : component.props.itemLayout === "stack" ? 1 : Number(context.autoItemColumns ?? component.props.itemColumns) || 3;
      (0, __doeFn_arrange)(root, context.flowLayout ? Math.max(1, Math.min(root.__items.length, requested)) : collectionColumns(context.width, requested, root.__items.length, gap));
    },
  });
}
