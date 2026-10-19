from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity
from doe_export.ir.model.table.TableCell import TableCell

@dataclass
@preserve_identity
class TableInfo:
    """Table data from a GraphicFrame."""

    rows: list[list[TableCell]] = field(default_factory=list)
    col_widths: list[float] = field(default_factory=list)
    row_heights: list[float] = field(default_factory=list)
    style_id: Optional[str] = None
    first_row: Optional[bool] = None
    first_col: Optional[bool] = None
    last_row: Optional[bool] = None
    last_col: Optional[bool] = None
    band_row: Optional[bool] = None
    band_col: Optional[bool] = None

    @property
    def num_rows(self) -> int:
        return len(self.rows)

    @property
    def num_cols(self) -> int:
        return max(len(r) for r in self.rows) if self.rows else 0
