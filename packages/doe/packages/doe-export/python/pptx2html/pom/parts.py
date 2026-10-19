"""Part subclasses that bridge OPC parts to the POM domain layer.

Each subclass is registered with ``PartFactory`` so that parts loaded
from an OPC package automatically get the right domain methods.
"""

import xml.etree.ElementTree as ET
from typing import Optional

from pptx2html.opc.constants import NAMESPACE, RELATIONSHIP_TYPE
from pptx2html.opc.part import XmlPart, PartFactory
from pptx2html.opc.packuri import PackURI
from pptx2html.ooxml.units import emu_to_pt

# ---------------------------------------------------------------------------
# Namespace tags
# ---------------------------------------------------------------------------
_P = NAMESPACE.PML_MAIN
_A = NAMESPACE.DML_MAIN
_R = NAMESPACE.OFC_RELATIONSHIPS

_TAG_SLD_ID_LST = f"{{{_P}}}sldIdLst"
_TAG_SLD_ID = f"{{{_P}}}sldId"
_TAG_SLD_SZ = f"{{{_P}}}sldSz"
_TAG_NOTES_SZ = f"{{{_P}}}notesSz"
_TAG_SLD = f"{{{_P}}}sld"
_TAG_SLD_LAYOUT = f"{{{_P}}}sldLayout"
_TAG_SLD_MASTER = f"{{{_P}}}sldMaster"
_TAG_C_SLD = f"{{{_P}}}cSld"
_TAG_SP_TREE = f"{{{_P}}}spTree"
_TAG_NAME = f"{{{_P}}}name"
_TAG_SHOW = f"{{{_P}}}show"

_ATTR_REL_ID = f"{{{_R}}}id"

# ---------------------------------------------------------------------------
# PmlPart — base for all PresentationML parts
# ---------------------------------------------------------------------------


class PmlPart(XmlPart):
    """Base class for all PresentationML parts.

    Provides helpers to resolve related parts by relationship ID
    (wrapping the OPC relationship machinery).
    """

    def related_part(self, r_id: str):
        """Return the related ``Part`` identified by *r_id*, or ``None``."""
        try:
            rel = self.relationships[r_id]
        except (KeyError, IndexError):
            return None
        if rel.target_mode != "Internal":
            return None
        target_uri = PackURI.from_rel_ref(self._pack_uri.base_uri, rel.target)
        try:
            return self._package.part(target_uri)
        except Exception:
            return None

    def _find_c_sld(self) -> Optional[ET.Element]:
        """Return the ``p:cSld`` element from this part's XML."""
        return self.element.find(_TAG_C_SLD)


# ---------------------------------------------------------------------------
# PresentationPart
# ---------------------------------------------------------------------------


class PresentationPart(PmlPart):
    """The main presentation part (``/ppt/presentation.xml``).

    Provides access to slides, masters, layouts, and dimensions.
    """

    @property
    def slides(self) -> list["SlidePart"]:
        """All slides in the presentation."""
        sld_id_lst = self.element.find(_TAG_SLD_ID_LST)
        if sld_id_lst is None:
            return list(self.related_parts(RELATIONSHIP_TYPE.SLIDE))

        slides: list[SlidePart] = []
        for sld_id in sld_id_lst.findall(_TAG_SLD_ID):
            r_id = sld_id.get(_ATTR_REL_ID)
            if not r_id:
                continue
            slide = self.related_part(r_id)
            if slide is not None:
                slides.append(slide)
        return slides

    @property
    def slide_masters(self) -> list["SlideMasterPart"]:
        """All slide masters."""
        return list(self.related_parts(RELATIONSHIP_TYPE.SLIDE_MASTER))

    @property
    def slide_layouts(self) -> list["SlideLayoutPart"]:
        """Collect all unique slide layouts used by slides."""
        seen: set[int] = set()
        layouts: list[SlideLayoutPart] = []
        for slide in self.slides:
            layout = slide.slide_layout
            if layout is not None and id(layout) not in seen:
                seen.add(id(layout))
                layouts.append(layout)
        return layouts

    @property
    def slide_width(self) -> Optional[float]:
        """Slide width in points (from ``p:sldSz``)."""
        sld_sz = self.element.find(_TAG_SLD_SZ)
        if sld_sz is None:
            return None
        cx = sld_sz.get("cx")
        return emu_to_pt(cx)

    @property
    def slide_height(self) -> Optional[float]:
        """Slide height in points (from ``p:sldSz``)."""
        sld_sz = self.element.find(_TAG_SLD_SZ)
        if sld_sz is None:
            return None
        cy = sld_sz.get("cy")
        return emu_to_pt(cy)

    @property
    def notes_slide_width(self) -> Optional[float]:
        """Notes slide width in points."""
        notes_sz = self.element.find(_TAG_NOTES_SZ)
        if notes_sz is None:
            return None
        cx = notes_sz.get("cx")
        return emu_to_pt(cx)

    @property
    def notes_slide_height(self) -> Optional[float]:
        """Notes slide height in points."""
        notes_sz = self.element.find(_TAG_NOTES_SZ)
        if notes_sz is None:
            return None
        cy = notes_sz.get("cy")
        return emu_to_pt(cy)

    def __repr__(self) -> str:
        return f"PresentationPart(slides={len(self.slides)})"


# ---------------------------------------------------------------------------
# BaseSlidePart — shared by Slide, Layout, Master, Notes
# ---------------------------------------------------------------------------


class BaseSlidePart(PmlPart):
    """Base for slide-like parts that contain a shape tree."""

    @property
    def shapes(self):
        """The ``ShapeTree`` for this slide/layout/master."""
        from .shapes import ShapeTree  # defer import to avoid cycles

        c_sld = self._find_c_sld()
        if c_sld is None:
            return ShapeTree(ET.Element(_TAG_SP_TREE), self)
        sp_tree = c_sld.find(_TAG_SP_TREE)
        if sp_tree is None:
            return ShapeTree(ET.Element(_TAG_SP_TREE), self)
        return ShapeTree(sp_tree, self)

    @property
    def name(self) -> Optional[str]:
        """Slide/layout/master name (from ``p:cSld/p:name`` or ``title`` attribute)."""
        c_sld = self._find_c_sld()
        if c_sld is None:
            return None
        name_el = c_sld.find(_TAG_NAME)
        if name_el is not None:
            return name_el.get("name")
        return c_sld.get("name")

    @property
    def show(self) -> bool:
        """Whether this slide is shown (default ``True``)."""
        show_el = self.element.find(_TAG_SHOW)
        if show_el is not None:
            return show_el.get("show") != "0"
        return True

    @property
    def placeholders(self):
        """All placeholder shapes on this slide/layout/master."""
        return self.shapes.placeholders


# ---------------------------------------------------------------------------
# SlidePart
# ---------------------------------------------------------------------------


class SlidePart(BaseSlidePart):
    """A single slide (``/ppt/slides/slideN.xml``)."""

    @property
    def slide_layout(self) -> Optional["SlideLayoutPart"]:
        """The slide layout this slide is based on."""
        parts = self.related_parts(RELATIONSHIP_TYPE.SLIDE_LAYOUT)
        return parts[0] if parts else None

    @property
    def notes_slide(self) -> Optional["NotesSlidePart"]:
        """The notes slide associated with this slide, if any."""
        parts = self.related_parts(RELATIONSHIP_TYPE.NOTES_SLIDE)
        return parts[0] if parts else None

    @property
    def has_notes_slide(self) -> bool:
        """Whether this slide has a notes slide."""
        return self.notes_slide is not None

    def __repr__(self) -> str:
        return (
            f"SlidePart(name={self.name!r}, "
            f"shapes={len(self.shapes)}, "
            f"show={self.show})"
        )


# ---------------------------------------------------------------------------
# SlideLayoutPart
# ---------------------------------------------------------------------------


class SlideLayoutPart(BaseSlidePart):
    """A slide layout (``/ppt/slideLayouts/slideLayoutN.xml``)."""

    @property
    def slide_masters(self) -> list["SlideMasterPart"]:
        """Slide masters that own this layout."""
        return list(self.related_parts(RELATIONSHIP_TYPE.SLIDE_MASTER))

    @property
    def slide_master(self) -> Optional["SlideMasterPart"]:
        """The first (primary) slide master."""
        masters = self.slide_masters
        return masters[0] if masters else None

    def __repr__(self) -> str:
        return f"SlideLayoutPart(name={self.name!r})"


# ---------------------------------------------------------------------------
# SlideMasterPart
# ---------------------------------------------------------------------------


class SlideMasterPart(BaseSlidePart):
    """A slide master (``/ppt/slideMasters/slideMasterN.xml``)."""

    @property
    def slide_layouts(self) -> list["SlideLayoutPart"]:
        """Slide layouts belonging to this master."""
        return list(self.related_parts(RELATIONSHIP_TYPE.SLIDE_LAYOUT))

    def __repr__(self) -> str:
        return f"SlideMasterPart(name={self.name!r})"


# ---------------------------------------------------------------------------
# NotesSlidePart
# ---------------------------------------------------------------------------


class NotesSlidePart(BaseSlidePart):
    """A notes slide (``/ppt/notesSlides/notesSlideN.xml``)."""

    @property
    def notes_master(self) -> Optional["PmlPart"]:
        """The notes master, if any."""
        parts = self.related_parts(RELATIONSHIP_TYPE.NOTES_MASTER)
        return parts[0] if parts else None

    def __repr__(self) -> str:
        return f"NotesSlidePart(shapes={len(self.shapes)})"


# ---------------------------------------------------------------------------
# PartFactory registration
# ---------------------------------------------------------------------------

# Register all POM part subclasses with the OPC PartFactory.
# This must happen at import time so that when OpcPackage._get_or_create_part
# calls PartFactory.create(), the registered subclasses are used.
PartFactory.register(NAMESPACE.PML_MAIN + "presentation", PresentationPart)  # placeholder — uses CONTENT_TYPE below
PartFactory.register(
    "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml",
    PresentationPart,
)
PartFactory.register(
    "application/vnd.openxmlformats-officedocument.presentationml.slide+xml",
    SlidePart,
)
PartFactory.register(
    "application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml",
    SlideLayoutPart,
)
PartFactory.register(
    "application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml",
    SlideMasterPart,
)
PartFactory.register(
    "application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml",
    NotesSlidePart,
)
