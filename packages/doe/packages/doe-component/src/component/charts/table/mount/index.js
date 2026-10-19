import { targetOf as __doeFn_targetOf } from '../target-of/index.js';
import { semanticOptions as __doeFn_semanticOptions } from '../semantic-options/index.js';
import { normalizeBorderStyle as __doeFn_normalizeBorderStyle } from '../normalize-border-style/index.js';
import { normalizeColumnSizing as __doeFn_normalizeColumnSizing } from '../normalize-column-sizing/index.js';
import { normalizeCell as __doeFn_normalizeCell } from '../normalize-cell/index.js';
import { applyTypographyStyle as __doeFn_applyTypographyStyle } from '../apply-typography-style/index.js';
import { applyCellStyle as __doeFn_applyCellStyle } from '../apply-cell-style/index.js';
import { prepareSemanticCell as __doeFn_prepareSemanticCell } from '../prepare-semantic-cell/index.js';
import { responsiveColumnSizing as __doeFn_responsiveColumnSizing } from '../responsive-column-sizing/index.js';
import { fitCellSpacing as __doeFn_fitCellSpacing } from '../fit-cell-spacing/index.js';
import { reboundTypographyToAvailableHeight as __doeFn_reboundTypographyToAvailableHeight } from '../rebound-typography-to-available-height/index.js';
import { growToIntrinsicHeight as __doeFn_growToIntrinsicHeight } from '../grow-to-intrinsic-height/index.js';
import { installResponsiveSizing as __doeFn_installResponsiveSizing } from '../install-responsive-sizing/index.js';
import { applySemanticCells } from '../apply-semantic-cells/index.js';
// Origin: public/yrkie-doe/components/data-table/data-table.js:614


export function mount(target, config = {}) {
    const host = (0, __doeFn_targetOf)(target);
    const retainAdaptive = host.dataset.columnSizingRequested === "auto" &&
      host.dataset.columnSizingResolved === "adaptive";
    host.__pptDataTableResizeObserver?.disconnect?.();
    const content = config.content || {};
    const semantic = (0, __doeFn_semanticOptions)(config, content);
    const columns = Array.isArray(content.columns) ? content.columns : [];
    const rows = Array.isArray(content.rows) ? content.rows : [];
    if (!columns.length) throw new Error("DataTable: content.columns is required.");
    if (!rows.length) throw new Error("DataTable: content.rows is required.");

    const width = Number(config.size?.width) || 960;
    const height = Number(config.size?.height) || 320;
    const naturalFlow = config.__flowLayout === true;
    host.replaceChildren();
    host.className = "ppt-data-table";
    host.style.width = `${width}px`;
    host.style.height = naturalFlow ? 'auto' : `${height}px`;
    host.dataset.lines = (0, __doeFn_normalizeBorderStyle)(config);
    host.dataset.columnSizingRequested = (0, __doeFn_normalizeColumnSizing)(config, content);

    const table = document.createElement("table");
    table.className = "ppt-data-table__table";
    if (naturalFlow) table.style.minHeight = '0';
    table.setAttribute("aria-label", config.ariaLabel || "数据表格");

    const colgroup = document.createElement("colgroup");
    columns.forEach(() => colgroup.append(document.createElement("col")));

    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    columns.forEach((column) => {
      const normalizedColumn = column && typeof column === "object"
        ? column
        : { header: column };
      const cell = (0, __doeFn_normalizeCell)(normalizedColumn.header);
      const th = document.createElement("th");
      (0, __doeFn_applyTypographyStyle)(th, "normal");
      th.scope = "col";
      th.textContent = cell.text;
      (0, __doeFn_applyCellStyle)(th, { ...cell, bold: true }, normalizedColumn.align);
      (0, __doeFn_prepareSemanticCell)(th, semantic, normalizedColumn, "header");
      headRow.append(th);
    });
    head.append(headRow);

    const body = document.createElement("tbody");
    rows.forEach((row, rowIndex) => {
      const values = Array.isArray(row) ? row : row?.cells;
      const tr = document.createElement("tr");
      tr.dataset.collectionItemIndex = String(rowIndex);
      columns.forEach((column, columnIndex) => {
        const normalizedColumn = column && typeof column === "object" ? column : {};
        const cell = (0, __doeFn_normalizeCell)(values?.[columnIndex]);
        const td = document.createElement("td");
        (0, __doeFn_applyTypographyStyle)(td, "normal");
        td.textContent = cell.text;
        (0, __doeFn_applyCellStyle)(td, cell, normalizedColumn.align);
        (0, __doeFn_prepareSemanticCell)(td, semantic, normalizedColumn, "body");
        tr.append(td);
      });
      body.append(tr);
    });

    table.append(colgroup, head, body);
    host.append(table);
    let columnSizing = (0, __doeFn_responsiveColumnSizing)(
      host,
      table,
      colgroup,
      columns,
      host.dataset.columnSizingRequested,
      semantic.locale,
      { retainAdaptive },
    );
    // Flow owns the page budget. Keep cell decoration, but let actual wrapped
    // content determine height instead of reserving 58px per row.
    if (naturalFlow) host.dataset.spaceDensity = 'comfortable';
    const spacing = naturalFlow ? { density: 'comfortable', semantic: applySemanticCells(table) }
      : (0, __doeFn_fitCellSpacing)(host, table);
    columnSizing = (0, __doeFn_responsiveColumnSizing)(
      host,
      table,
      colgroup,
      columns,
      host.dataset.columnSizingRequested,
      semantic.locale,
      { retainAdaptive },
    );
    const rebound = naturalFlow ? null : (0, __doeFn_reboundTypographyToAvailableHeight)(
      host,
      table,
      colgroup,
      columns,
      host.dataset.columnSizingRequested,
      semantic.locale,
      height,
      config.__layoutAvailableHeight,
    );
    const resolvedHeight = naturalFlow ? host.offsetHeight
      : rebound?.height || (0, __doeFn_growToIntrinsicHeight)(host, table, height);
    (0, __doeFn_installResponsiveSizing)(
      host,
      table,
      colgroup,
      columns,
      host.dataset.columnSizingRequested,
      semantic.locale,
      {
        authoredHeight: height,
        availableHeight: config.__layoutAvailableHeight,
        naturalFlow,
      },
    );
    return {
      element: host,
      size: { width, height: resolvedHeight },
      spacing,
      columnSizing,
      rebound,
    };
  }
