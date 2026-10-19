from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity


@dataclass
@preserve_identity
class EmbeddedFont:
    """Browser-loadable font extracted from a presentation embedded font part."""

    typeface: str
    content_type: str
    data: str
    style: str = "regular"
