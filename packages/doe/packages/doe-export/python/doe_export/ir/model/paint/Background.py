from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity
from doe_export.ir.model.paint.Fill import Fill

@dataclass
@preserve_identity
class Background:
    """Slide background."""

    fill: Optional[Fill] = None
