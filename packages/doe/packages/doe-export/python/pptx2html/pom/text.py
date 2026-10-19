"""Text classes — TextFrame, Paragraph, Run, Font.

These wrap the ``p:txBody`` / ``a:p`` / ``a:r`` / ``a:rPr`` XML
elements found in shape text bodies.
"""

import xml.etree.ElementTree as ET
from typing import Optional

from pptx2html.ooxml.units import emu_to_pt
from pptx2html.opc.constants import NAMESPACE
from .shared import ElementProxy, ParentedElementProxy, PartElementProxy

# Namespace tags
_A = NAMESPACE.DML_MAIN
_TAG_BODY_PR = f"{{{_A}}}bodyPr"
_TAG_P = f"{{{_A}}}p"
_TAG_P_PR = f"{{{_A}}}pPr"
_TAG_R = f"{{{_A}}}r"
_TAG_BR = f"{{{_A}}}br"
_TAG_FLD = f"{{{_A}}}fld"
_TAG_R_PR = f"{{{_A}}}rPr"
_TAG_T = f"{{{_A}}}t"
_TAG_R_PR_LATIN = f"{{{_A}}}latin"
_TAG_R_PR_EA = f"{{{_A}}}ea"
_TAG_R_PR_SYML = f"{{{_A}}}sym"
_TAG_HLINK = f"{{{_A}}}hlinkClick"
_TAG_SOLID_FILL = f"{{{_A}}}solidFill"
_TAG_SRGBT = f"{{{_A}}}srgbClr"
_TAG_SCHEME = f"{{{_A}}}schemeClr"


class Font(ElementProxy):
    """Character-level formatting from an ``a:rPr`` element.

    Attributes accessed as properties: name, size, bold, italic,
    underline, color.
    """

    @property
    def name(self) -> Optional[str]:
        """Font typeface name (from a:latin, a:ea, etc.)."""
        latin = self._element.find(_TAG_R_PR_LATIN)
        if latin is not None:
            return latin.get("typeface")
        ea = self._element.find(_TAG_R_PR_EA)
        if ea is not None:
            return ea.get("typeface")
        return None

    @property
    def size(self) -> Optional[float]:
        """Font size in points (from ``sz`` attribute, stored in hundredths)."""
        sz = self._element.get("sz")
        if sz is not None:
            try:
                return int(sz) / 100.0
            except (ValueError, TypeError):
                pass
        return None

    @property
    def bold(self) -> bool:
        return self._element.get("b") == "1"

    @property
    def italic(self) -> bool:
        return self._element.get("i") == "1"

    @property
    def underline(self) -> Optional[str]:
        """Underline style (``"sng"``, ``"dbl"``, etc.) or ``None``."""
        return self._element.get("u")

    @property
    def strike(self) -> Optional[str]:
        """Strikethrough style or ``None``."""
        return self._element.get("strike")

    @property
    def color(self) -> Optional[str]:
        """Text color as hex string (e.g. ``"FF0000"``) or ``None``."""
        fill = self._element.find(_TAG_SOLID_FILL)
        if fill is None:
            return None
        srgb = fill.find(_TAG_SRGBT)
        if srgb is not None:
            val = srgb.get("val")
            return val.upper() if val else None
        scheme = fill.find(_TAG_SCHEME)
        if scheme is not None:
            return scheme.get("val")
        return None

    @property
    def hyperlink(self) -> Optional[str]:
        """Hyperlink action (``r:id`` attribute value) or ``None``."""
        hlink = self._element.find(_TAG_HLINK)
        if hlink is not None:
            return hlink.get(f"{{{NAMESPACE.OFC_RELATIONSHIPS}}}id")
        return None


class Run(PartElementProxy):
    """A text run (``a:r`` element) — a contiguous run of uniformly
    formatted text."""

    @property
    def text(self) -> str:
        """The text content of this run."""
        t_elem = self._element.find(_TAG_T)
        if t_elem is not None and t_elem.text:
            return t_elem.text
        return ""

    @text.setter
    def text(self, value: str) -> None:
        t_elem = self._element.find(_TAG_T)
        if t_elem is None:
            t_elem = ET.SubElement(self._element, _TAG_T)
        t_elem.text = value

    @property
    def font(self) -> Font:
        """Font formatting information for this run."""
        rPr = self._element.find(_TAG_R_PR)
        if rPr is None:
            rPr = ET.SubElement(self._element, _TAG_R_PR)
        return Font(rPr)

    def __repr__(self) -> str:
        return f"Run(text={self.text!r})"


class Paragraph(ParentedElementProxy):
    """A paragraph (``a:p`` element) containing runs of text."""

    @property
    def runs(self) -> list[Run]:
        """All ``Run`` objects in this paragraph."""
        part = self.part
        return [
            Run(r_elem, part)
            for r_elem in self._element.findall(_TAG_R)
        ]

    @property
    def text(self) -> str:
        """Concatenated text of all runs."""
        return "".join(run.text for run in self.runs)

    @property
    def level(self) -> int:
        """Paragraph level (0-based, from ``lvl`` attribute)."""
        p_pr = self._element.find(_TAG_P_PR)
        lvl = p_pr.get("lvl") if p_pr is not None else None
        if lvl is not None:
            try:
                return int(lvl)
            except (ValueError, TypeError):
                pass
        return 0

    @property
    def alignment(self) -> Optional[str]:
        """Paragraph alignment from ``a:pPr`` (``l``, ``ctr``, ``r``, ``just``)."""
        p_pr = self._element.find(_TAG_P_PR)
        if p_pr is None:
            return None
        return p_pr.get("algn")

    def __iter__(self):
        return iter(self.runs)

    def __len__(self) -> int:
        return len(self.runs)

    def __repr__(self) -> str:
        return f"Paragraph(text={self.text!r})"


class TextFrame(ParentedElementProxy):
    """A shape's text body (``p:txBody`` or ``a:txBody``).

    Iterating yields ``Paragraph`` objects.
    """

    @property
    def paragraphs(self) -> list[Paragraph]:
        """All paragraphs in this text frame."""
        return [
            Paragraph(p_elem, self)
            for p_elem in self._element.findall(_TAG_P)
        ]

    @property
    def text(self) -> str:
        """Concatenated text of all paragraphs, joined by newlines."""
        return "\n".join(p.text for p in self.paragraphs)

    @property
    def word_wrap(self) -> bool:
        """Whether text wraps within the shape (default ``True``)."""
        bp = self._element.find(_TAG_BODY_PR)
        wrap = bp.get("wrap") if bp is not None else None
        if wrap == "none":
            return False
        return True

    @property
    def margins(self) -> dict[str, Optional[float]]:
        """Margin values in points: ``{"left": …, "right": …, "top": …, "bottom": …}``."""
        bp = self._element.find(_TAG_BODY_PR)
        if bp is None:
            return {"left": None, "right": None, "top": None, "bottom": None}
        result = {}
        attr_to_key = {
            "lIns": "left",
            "rIns": "right",
            "tIns": "top",
            "bIns": "bottom",
        }
        for attr, key in attr_to_key.items():
            val = bp.get(attr)
            if val is not None:
                result[key] = emu_to_pt(val)
            else:
                result[key] = None
        return result

    def __iter__(self):
        return iter(self.paragraphs)

    def __len__(self) -> int:
        return len(self.paragraphs)

    def __repr__(self) -> str:
        return f"TextFrame(text={self.text!r})"
