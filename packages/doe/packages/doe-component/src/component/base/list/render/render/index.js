import { typographyText as __doeFn_typographyText } from '../../../../../registry/base/typography-text/index.js';
// Origin: layout-engine/components.js; list.render
import { scope as __doeScope } from "../../../../../registry/runtime/base/context/index.js";

export function render(component, { element, slide }) {
      const root = element("article", "component-list");
      const todo = component.type === "todo-list";
      if (component.props.title) {
        root.append(
          (0, __doeFn_typographyText)(
            element("h2", "component-title", component.props.title),
            "h3",
            { mode: "title", maxLines: 4 },
          ),
        );
      }
      const ordered = component.type === "ordered-list";
      const list = element(ordered ? "ol" : "ul", "component-list__items");
      if (todo) list.classList.add("component-list__items--todo");
      if (ordered) {
        list.classList.add("component-list__items--ordered");
        list.style.setProperty("--list-number-width", `${String(component.props.items?.length || 1).length + 0.6}ch`);
      }
      (component.props.items || []).forEach((item, index) => {
        const listItem = (0, __doeFn_typographyText)(
          element("span", "component-list__text", todo ? item.text : item),
          "large",
          { mode: "list-item", maxLines: 4 },
        );
        if (todo) {
          const row = element("li", "");
          __doeScope.engine.applyTypographyStyle(row, "large");
          row.dataset.collectionItemIndex = String(index);
          row.dataset.checked = String(item.checked === true);
          const toggle = element("button", "component-todo__toggle");
          toggle.type = "button"; toggle.disabled = slide?.editor !== true;
          toggle.setAttribute("role", "checkbox"); toggle.setAttribute("aria-checked", String(item.checked === true));
          toggle.setAttribute("aria-label", item.text || " "); toggle.setAttribute("contenteditable", "false");
          toggle.dataset.todoIndex = String(index);
          const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttribute("viewBox", "0 0 20 20"); svg.setAttribute("aria-hidden", "true");
          const rect = document.createElementNS(svg.namespaceURI, "rect");
          rect.setAttribute("x", "1"); rect.setAttribute("y", "1"); rect.setAttribute("width", "18"); rect.setAttribute("height", "18"); rect.setAttribute("rx", "5");
          svg.append(rect);
          if (item.checked === true) {
            const check = document.createElementNS(svg.namespaceURI, "path");
            check.setAttribute("d", "M5 10l3 3 7-7"); svg.append(check);
          }
          toggle.append(svg); row.append(toggle, listItem); list.append(row);
        } else if (ordered) {
          const row = element("li", "");
          __doeScope.engine.applyTypographyStyle(row, "large");
          row.dataset.collectionItemIndex = String(index);
          const number = element("span", "component-list__number", `${index + 1}.`);
          number.setAttribute("contenteditable", "false");
          number.setAttribute("aria-hidden", "true");
          row.append(number, listItem); list.append(row);
        } else {
          const row = element("li", "");
          __doeScope.engine.applyTypographyStyle(row, "large");
          row.dataset.collectionItemIndex = String(index);
          row.append(listItem);
          list.append(row);
        }
      });
      root.append(list);
      return root;
    }
