from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity


@dataclass
@preserve_identity
class TextLayoutSoftBreak:
    """A browser-derived visual line boundary inside one semantic text run."""

    paragraph_index: int = 0
    run_index: int = 0
    offset_utf16: int = 0
