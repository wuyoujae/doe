from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity
from doe_export.ir.model.paint.Border import Border
from doe_export.ir.model.paint.Fill import Fill
from doe_export.ir.model.text.TextFrame import TextFrame

@dataclass
@preserve_identity
class TableCell:
    """A single table cell."""

    text: str = ""
    colspan: int = 1
    rowspan: int = 1
    h_merge: bool = False
    v_merge: bool = False
    text_frame: Optional[TextFrame] = None
    # FIXME: cell fill, border, margins — see FIXME.md


    fill: Optional[Fill] = None
    margins: Optional[dict[str, Optional[float]]] = None
    vertical_align: Optional[str] = None
    border_left: Optional[Border] = None
    border_right: Optional[Border] = None
    border_top: Optional[Border] = None
    border_bottom: Optional[Border] = None
