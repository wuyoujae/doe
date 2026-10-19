# Origin: pptx2html/ir/builder.py::PresentationBuilder._table_cell_margins
from __future__ import annotations
from doe_export.ir.importer.shared import ET, Optional, emu_to_pt

@staticmethod
def _table_cell_margins(tc_pr: Optional[ET.Element]) -> Optional[dict[str, Optional[float]]]:
    if tc_pr is None:
        return None
    values = {
        "left": emu_to_pt(tc_pr.get("marL")),
        "right": emu_to_pt(tc_pr.get("marR")),
        "top": emu_to_pt(tc_pr.get("marT")),
        "bottom": emu_to_pt(tc_pr.get("marB")),
    }
    return values if any(value is not None for value in values.values()) else None

_table_cell_margins.__func__.__module__ = 'pptx2html.ir.builder'
_table_cell_margins.__func__.__qualname__ = 'PresentationBuilder._table_cell_margins'
