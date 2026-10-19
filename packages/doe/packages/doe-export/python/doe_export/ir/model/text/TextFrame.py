from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity
from doe_export.ir.model.text.Paragraph import Paragraph
from doe_export.ir.model.text.TextLayoutSnapshot import TextLayoutSnapshot

@dataclass
@preserve_identity
class TextFrame:
    """Text body content within a shape."""

    vertical_align: Optional[str] = None
    """Vertical alignment: ``"top"``, ``"mid"``, ``"bot"``, or ``None``."""

    word_wrap: bool = True
    white_space: Optional[str] = None
    """CSS-like white-space policy for authored HTML text, e.g. ``"pre-wrap"``."""

    overflow_wrap: Optional[str] = None
    """CSS overflow-wrap policy, e.g. ``"normal"``, ``"break-word"``, ``"anywhere"``."""

    word_break: Optional[str] = None
    """CSS word-break policy, e.g. ``"normal"``, ``"break-all"``, ``"keep-all"``."""

    margins: Optional[dict[str, Optional[float]]] = None
    """Margins in points: ``{"left": …, "right": …, "top": …, "bottom": …}``."""

    baseline_top_offset: Optional[float] = None
    """PowerPoint top inset needed to preserve a browser baseline-aligned flex item."""

    horizontal_overflow: Optional[str] = None
    vertical_overflow: Optional[str] = None
    vertical_text: Optional[str] = None
    rotation: Optional[float] = None
    anchor_center: Optional[bool] = None
    column_count: Optional[int] = None
    column_spacing: Optional[float] = None
    rtl_columns: Optional[bool] = None
    compatibility_line_spacing: Optional[bool] = None

    autofit_mode: Optional[str] = None
    """Autofit mode: ``"none"``, ``"normal"``, or ``"shape"``."""

    autofit_font_scale: Optional[float] = None
    """Scale applied by ``normAutofit``. ``1.0`` means 100%."""

    autofit_line_spacing_reduction: Optional[float] = None
    """Line spacing reduction from ``normAutofit`` as a fraction."""

    text_warp: Optional[str] = None
    layout_snapshot: Optional[TextLayoutSnapshot] = None
    """Validated HTML visual-line snapshot; ignored when content or metrics change."""

    layout_snapshot_dirty: bool = False
    """Defensive editor invalidation flag for a previously captured layout snapshot."""

    diagnostics: list[str] = field(default_factory=list)
    style_provenance: list[str] = field(default_factory=list)
    """Coarse sources that contributed to resolved paragraph/run defaults."""

    paragraphs: list[Paragraph] = field(default_factory=list)

    @property
    def text(self) -> str:
        """Concatenated text of all paragraphs joined by newlines."""
        return "\n".join(p.text for p in self.paragraphs)
