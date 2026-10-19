// Origin: public/yrkie-doe/components/data-table/data-table.js:24


export function normalizeCell(cell) {
    if (cell && typeof cell === "object" && !Array.isArray(cell)) {
      return {
        text: cell.text == null ? "" : String(cell.text),
        bold: cell.bold === true,
        emphasis: ["muted", "highlight"].includes(cell.emphasis)
          ? cell.emphasis
          : "",
        background: typeof cell.background === "string" ? cell.background : "",
        color: typeof cell.color === "string" ? cell.color : "",
      };
    }
    return {
      text: cell == null ? "" : String(cell),
      bold: false,
      emphasis: "",
      background: "",
      color: "",
    };
  }
