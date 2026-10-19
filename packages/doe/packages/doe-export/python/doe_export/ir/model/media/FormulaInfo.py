from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity


@dataclass
@preserve_identity
class FormulaInfo:
    """Formula metadata for editable/renderable fallback math."""

    source: str = ""
    source_type: str = "latex"
    fallback_text: Optional[str] = None
