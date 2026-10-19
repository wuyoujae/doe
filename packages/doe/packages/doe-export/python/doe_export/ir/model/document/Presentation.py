from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity
from doe_export.ir.model.text.EmbeddedFont import EmbeddedFont
from doe_export.ir.model.document.Slide import Slide

@dataclass
@preserve_identity
class Presentation:
    """Top‑level IR object representing a complete .pptx."""

    width: float = 0.0
    """Slide width in points."""

    height: float = 0.0
    """Slide height in points."""

    slides: list[Slide] = field(default_factory=list)

    embedded_fonts: list[EmbeddedFont] = field(default_factory=list)
