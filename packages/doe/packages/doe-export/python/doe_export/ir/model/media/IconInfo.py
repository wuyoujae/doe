from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity


@dataclass
@preserve_identity
class IconInfo:
    """Icon metadata for generated/editable icon geometry."""

    source: str = "geometry"
    name: Optional[str] = None
    variant: Optional[str] = None
