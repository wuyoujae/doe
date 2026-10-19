from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity


@dataclass
@preserve_identity
class ChartSeries:
    """A chart data series."""

    name: str = ""
    categories: list[str] = field(default_factory=list)
    values: list[str] = field(default_factory=list)
    color: Optional[str] = None
    value_format: Optional[str] = None
    show_value_labels: Optional[bool] = None
