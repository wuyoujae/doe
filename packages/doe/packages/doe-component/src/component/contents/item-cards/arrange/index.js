// Origin: public/yrkie-doe/components/item-cards/item-cards.js:26


import { arrangeConnectors } from '../connectors/index.js';
import { balancedRows } from '../../../../layout/collection/balanced-rows/index.js';
import { flowRows } from '../../../../layout/flow/rows.js';

export function arrange(root, columns) {
    const items = root.__items;
    const flow = root.dataset.flowCollection === 'true';
    const equal = Boolean(root.dataset.equalColumns) && !flow;
    const key = `${items.length}:${columns}:${equal}:${flow}`;
    if (root.__arrangementKey === key) return;
    root.__arrangementKey = key;
    const sizes = equal ? balancedRows(items.length, columns)
      : flowRows(items.length, columns);
    if (equal) columns = sizes[0] || 1;
    root.dataset.columns = String(columns);
    const grid = root.querySelector(".item-cards__grid");
    const rows = sizes.length;
    const fragments = document.createDocumentFragment();
    let offset = 0;
    for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
      const row = document.createElement("div"); row.className = "item-cards__row";
      const cells = items.slice(offset, offset + sizes[rowIndex]);
      offset += cells.length;
      row.style.setProperty("--item-row-columns", String(cells.length));
      if (equal) {
        row.style.width = `calc((100% + var(--item-cards-gap)) * ${cells.length / columns} - var(--item-cards-gap))`;
        row.style.justifySelf = 'center';
      }
      cells.forEach((item, index) => {
        if (flow) {
          item.dataset.flowSlot = 'true';
          const surface = item.querySelector('.item-cards__surface');
          if (surface) surface.dataset.flowSurface = root.dataset.contentsPresentation === 'metrics' ? 'intrinsic' : 'fill';
        }
        if (root.dataset.equalColumns) item.style.setProperty("--process-rise", String(columns - index - 1));
        item.dataset.rowFirst = String(index === 0);
        item.dataset.topRow = String(rowIndex === 0);
        item.dataset.topLeft = String(rowIndex === 0 && index === 0);
        item.dataset.topRight = String(rowIndex === 0 && index === cells.length - 1);
        item.dataset.bottomLeft = String(rowIndex === rows - 1 && index === 0);
        item.dataset.bottomRight = String(rowIndex === rows - 1 && index === cells.length - 1);
        item.dataset.connector = index > 0 ? "left" : rowIndex > 0 ? "top" : "none";
        row.append(item);
      });
      fragments.append(row);
    }
    grid.replaceChildren(fragments);
    arrangeConnectors(root, columns);
  }
