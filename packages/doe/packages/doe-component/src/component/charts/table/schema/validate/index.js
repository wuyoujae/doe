// Origin: layout-engine/library-components.js; table.validate


export function validate(props, warnings) {
      const columns = props.content?.columns;
      const rows = props.content?.rows;
      const semanticWrap = props.semanticWrap;
      if (
        props.borderStyle !== undefined &&
        !["grid", "none", "three-line"].includes(props.borderStyle)
      ) {
        warnings.push("table.borderStyle must be grid, none, or three-line.");
      }
      if (
        props.columnSizing !== undefined &&
        !["auto", "equal", "adaptive"].includes(props.columnSizing)
      ) {
        warnings.push("table.columnSizing must be auto, equal, or adaptive.");
      }
      if (
        semanticWrap !== undefined &&
        semanticWrap !== false &&
        (!semanticWrap || typeof semanticWrap !== "object" || Array.isArray(semanticWrap))
      ) {
        warnings.push("table.semanticWrap must be false or an object.");
      }
      if (
        semanticWrap?.protectedTerms !== undefined &&
        !Array.isArray(semanticWrap.protectedTerms)
      ) {
        warnings.push("table.semanticWrap.protectedTerms must be an array.");
      }
      if (!Array.isArray(columns) || columns.length < 1 || columns.length > 12) {
        warnings.push("table.content.columns requires 1 to 12 columns.");
      }
      if (!Array.isArray(rows) || !rows.length) {
        warnings.push("table.content.rows must contain data.");
      }
      (columns || []).forEach((column, index) => {
        const header = column && typeof column === "object" ? column.header : column;
        if (header == null || (typeof header === "object" && header.text == null)) {
          warnings.push(`table.content.columns[${index}].header is required.`);
        }
        if (column?.align && !["left", "center", "right"].includes(column.align)) {
          warnings.push(`table.content.columns[${index}].align is invalid.`);
        }
        if (
          column?.protectedTerms !== undefined &&
          !Array.isArray(column.protectedTerms)
        ) {
          warnings.push(
            `table.content.columns[${index}].protectedTerms must be an array.`,
          );
        }
      });
      (rows || []).forEach((row, index) => {
        const cells = Array.isArray(row) ? row : row?.cells;
        if (!Array.isArray(cells) || cells.length !== (columns || []).length) {
          warnings.push(`table.content.rows[${index}].cells must match the column count.`);
        }
      });
    }
