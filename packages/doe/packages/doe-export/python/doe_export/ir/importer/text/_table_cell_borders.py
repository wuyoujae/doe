# Origin: pptx2html/ir/builder.py::PresentationBuilder._table_cell_borders
from __future__ import annotations
from doe_export.ir.importer.shared import Border, ET, NAMESPACE, Optional

def _table_cell_borders(self, tc_pr: Optional[ET.Element]) -> dict[str, Optional[Border]]:
    if tc_pr is None:
        return {}
    _A = NAMESPACE.DML_MAIN
    mapping = {
        "left": "lnL",
        "right": "lnR",
        "top": "lnT",
        "bottom": "lnB",
    }
    borders: dict[str, Optional[Border]] = {}
    for side, tag in mapping.items():
        border = self._border_from_line(tc_pr.find(f"{{{_A}}}{tag}"))
        if border is not None:
            self._apply_default_border_width(border)
        borders[side] = border
    return borders

_table_cell_borders.__module__ = 'pptx2html.ir.builder'
_table_cell_borders.__qualname__ = 'PresentationBuilder._table_cell_borders'
