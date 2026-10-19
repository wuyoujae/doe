from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity
from doe_export.ir.model.text.TextLayoutSoftBreak import TextLayoutSoftBreak

@dataclass
@preserve_identity
class TextLayoutSnapshot:
    """Versioned, hash-bound derived line layout used only during export."""

    version: int = 1
    provider: str = "chromium"
    source_sha256: str = ""
    metrics_sha256: str = ""
    soft_breaks: list[TextLayoutSoftBreak] = field(default_factory=list)
