from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity


@dataclass
@preserve_identity
class Font:
    """Font formatting for a text run."""

    family: Optional[str] = None
    """Font typeface name, e.g. ``"Arial"``, ``"微软雅黑"``."""

    latin_family: Optional[str] = None
    ea_family: Optional[str] = None
    cs_family: Optional[str] = None
    sym_family: Optional[str] = None

    size_pt: Optional[float] = None
    """Font size in points."""

    bold: bool = False
    italic: bool = False
    underline: Optional[str] = None
    """Underline style: ``"sng"``, ``"dbl"``, or ``None``."""

    underline_color: Optional[str] = None
    """Underline color as hex string when it differs from text color."""

    underline_alpha: Optional[float] = None
    """Underline opacity 0-1 when present."""

    underline_width_pt: Optional[float] = None
    """Underline stroke width in points when explicitly requested."""

    color: Optional[str] = None
    """Text color as hex string, e.g. ``"FF0000"``."""

    alpha: Optional[float] = None
    """Text opacity 0-1 when present."""

    strike: Optional[str] = None

    strike_color: Optional[str] = None
    strike_alpha: Optional[float] = None
    strike_width_pt: Optional[float] = None
    strike_style: Optional[str] = None

    text_decoration_overlay: bool = False
    """True when a separate editable shape renders complex text decoration."""

    hyperlink_r_id: Optional[str] = None
    """Relationship ID for hyperlink (resolved later)."""

    hyperlink_url: Optional[str] = None
    """Resolved hyperlink target when available."""

    char_spacing_pt: Optional[float] = None
    """Additional character spacing in points."""

    word_spacing_pt: Optional[float] = None
    """Additional spacing after word separator characters in points."""

    kerning_pt: Optional[float] = None
    """Kerning threshold in points."""

    baseline: Optional[float] = None
    """Baseline shift as a fraction of font size."""

    lang: Optional[str] = None
    alt_lang: Optional[str] = None
    capitalization: Optional[str] = None
    highlight: Optional[str] = None
    normalize_horizontal: Optional[bool] = None
    rtl: Optional[bool] = None
    shadow: Optional["Shadow"] = None
