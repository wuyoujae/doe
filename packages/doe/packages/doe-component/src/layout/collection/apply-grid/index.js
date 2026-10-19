import { gridPlan as __doeFn_gridPlan } from '../grid-plan/index.js';
// Origin: public/yrkie-doe/core/contents-layout.js:29


export function applyGrid(grid, items, columns) {
    const plan = (0, __doeFn_gridPlan)(items.length, columns);
    grid.dataset.columns = String(columns);
    grid.style.gridTemplateColumns = `repeat(${plan.tracks}, minmax(0, 1fr))`;
    items.forEach((item, index) => { item.style.gridColumn = `span ${plan.spans[index]}`; });
  }
