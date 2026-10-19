from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity
from doe_export.ir.model.text.Font import Font

@dataclass
@preserve_identity
class Run:
    """A contiguous run of uniformly formatted text."""

    text: str = ""
    font: Font = field(default_factory=Font)
    kind: str = "text"
    """Run kind: ``"text"``, ``"break"``, or ``"field"``."""

    field_id: Optional[str] = None
    field_type: Optional[str] = None
