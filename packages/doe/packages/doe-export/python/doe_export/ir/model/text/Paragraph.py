from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity
from doe_export.ir.model.text.BulletInfo import BulletInfo
from doe_export.ir.model.text.Font import Font
from doe_export.ir.model.text.Run import Run
from doe_export.ir.model.text.TabStop import TabStop

@dataclass
@preserve_identity
class Paragraph:
    """A single paragraph within a text frame."""

    alignment: Optional[str] = None
    """Text alignment: ``"l"``, ``"ctr"``, ``"r"``, ``"just"``, or ``None``."""

    level: int = 0
    """Paragraph outline level (0-based)."""

    spacing_before: Optional[float] = None
    """Paragraph spacing before in points."""
    spacing_after: Optional[float] = None
    """Paragraph spacing after in points."""

    line_spacing_multiple: Optional[float] = None
    """Line height multiplier, e.g. 1.0 for PowerPoint single spacing."""

    line_spacing_pt: Optional[float] = None
    """Absolute line height in points."""

    line_spacing_type: Optional[str] = None
    """Semantic line spacing unit: ``"percent"`` or ``"points"``."""

    spacing_before_type: Optional[str] = None
    spacing_after_type: Optional[str] = None
    spacing_before_pct: Optional[float] = None
    spacing_after_pct: Optional[float] = None

    margin_left: Optional[float] = None
    margin_right: Optional[float] = None
    indent: Optional[float] = None
    default_tab_size: Optional[float] = None
    tab_stops: list[TabStop] = field(default_factory=list)
    font_align: Optional[str] = None
    rtl: Optional[bool] = None
    ea_line_break: Optional[bool] = None
    latin_line_break: Optional[bool] = None
    hanging_punctuation: Optional[bool] = None
    bullet: Optional[BulletInfo] = None
    end_para_font: Optional[Font] = None
    """Run properties saved at the end of the paragraph (``a:endParaRPr``)."""

    runs: list[Run] = field(default_factory=list)

    @property
    def text(self) -> str:
        """Concatenated text of all runs."""
        parts = []
        for run in self.runs:
            if run.kind == "break":
                parts.append("\n")
            else:
                parts.append(run.text)
        return "".join(parts)
