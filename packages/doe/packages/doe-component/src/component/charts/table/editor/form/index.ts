import { t } from "../../../../../shared/editor/i18n/index.ts";
import type { UnknownRecord } from "../../../../../shared/editor/types/index.ts";
import { editorForm } from "../../../../../shared/editor/form-controls/index.ts";

const valueOf = (cell: any) => cell && typeof cell === 'object' ? cell.text : cell;
export function replaceCellText(cell: any, text: string) {
  if (cell && typeof cell === 'object') return { ...cell, text };
  return typeof cell === 'number' && text.trim() && Number.isFinite(Number(text)) ? Number(text) : text;
}

export function createTableForm(base: UnknownRecord, onChange: () => void) {
  const e = editorForm(base, onChange); const c = e.draft.content;
  const section = e.section(t('sections.tableData'), t('hints.table'));
  const actions = e.row(section); const grid = document.createElement('div'); grid.className = 'chart-content-data-grid'; section.append(grid);
  const cells = (row: any) => Array.isArray(row) ? row : row.cells;
  const draw = () => {
    e.clear(grid); const table = document.createElement('table'); grid.append(table);
    const head = table.createTHead().insertRow();
    c.columns.forEach((column: any, i: number) => {
      const cell = head.insertCell();
      e.text(cell, `header-${i}`, t('labels.columnHeader', { v1: i + 1 }), valueOf(typeof column === 'object' ? column.header : column), text => {
        const current = c.columns[i]; c.columns[i] = typeof current === 'object' ? { ...current, header: replaceCellText(current.header, text) } : text;
      }, false, true);
      e.select(cell, `align-${i}`, t('labels.columnAlign', { v1: i + 1 }), column.align || 'left', [['left', t('align.left')], ['center', t('align.center')], ['right', t('align.right')]], align => {
        const current = c.columns[i]; c.columns[i] = typeof current === 'object' ? { ...current, align } : { header: current, align };
      });
      e.button(cell, t('actions.removeColumn', { v1: i + 1 }), () => { c.columns.splice(i, 1); c.rows.forEach((r: any) => cells(r).splice(i, 1)); draw(); }, c.columns.length === 1);
    });
    const body = table.createTBody();
    c.rows.forEach((record: any, r: number) => {
      const row = body.insertRow();
      c.columns.forEach((_: any, col: number) => e.text(row.insertCell(), `cell-${r}-${col}`, t('labels.cell', { v1: r + 1, v2: col + 1 }), valueOf(cells(record)[col]), text => {
        cells(record)[col] = replaceCellText(cells(record)[col], text);
      }, false, true));
      e.button(row.insertCell(), t('actions.removeRow', { v1: r + 1 }), () => { c.rows.splice(r, 1); draw(); }, c.rows.length === 1);
    });
  };
  e.button(actions, t('actions.addRow'), () => { c.rows.push({ cells: c.columns.map(() => '') }); draw(); });
  e.button(actions, t('actions.addColumn'), () => { c.columns.push({ header: t('defaults.column', { v1: c.columns.length + 1 }) }); c.rows.forEach((row: any) => cells(row).push('')); draw(); });
  draw();
  const options = e.section(t('sections.tableDisplay'));
  e.select(options, 'column-sizing', t('labels.columnWidths'), e.draft.columnSizing || c.columnSizing || 'auto', [['auto', t('widths.auto')], ['adaptive', t('widths.content')], ['equal', t('widths.equal')]], v => { e.draft.columnSizing = v; });
  e.select(options, 'border-style', t('labels.borders'), e.draft.borderStyle || (e.draft.showLines === false ? 'none' : 'grid'), [['grid', t('borders.grid')], ['three-line', t('borders.threeLines')], ['none', t('borders.none')]], v => { e.draft.borderStyle = v; });
  return e.form;
}

