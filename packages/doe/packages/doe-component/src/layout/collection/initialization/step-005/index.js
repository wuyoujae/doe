import { resolveColumns as __doeFn_resolveColumns } from '../../resolve-columns/index.js';
import { itemColumns as __doeFn_itemColumns } from '../../item-columns/index.js';
import { rowSize as __doeFn_rowSize } from '../../row-size/index.js';
import { gridPlan as __doeFn_gridPlan } from '../../grid-plan/index.js';
import { applyGrid as __doeFn_applyGrid } from '../../apply-grid/index.js';
// Origin: public/yrkie-doe/core/contents-layout.js:36
import { scope as __doeScope } from "../../../../component/contents/shared/layout/runtime/context/index.js";

export function initialize() {
__doeScope.global.DOEContentsLayout = Object.freeze({ resolveColumns: __doeFn_resolveColumns, itemColumns: __doeFn_itemColumns, rowSize: __doeFn_rowSize, gridPlan: __doeFn_gridPlan, applyGrid: __doeFn_applyGrid });
}
