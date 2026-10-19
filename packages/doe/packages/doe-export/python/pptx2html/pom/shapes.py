"""Shape classes — BaseShape, AutoShape, Picture, Connector, GroupShape,
GraphicFrame — plus the ShapeTree collection and shape dispatch.

All shapes are created from XML elements found in a slide's ``p:spTree``.
"""

import xml.etree.ElementTree as ET
from typing import TYPE_CHECKING, Iterator, Optional

from pptx2html.ooxml.units import emu_to_pt, percentage_to_float
from pptx2html.opc.constants import NAMESPACE
from .shared import PartElementProxy
from .text import TextFrame

if TYPE_CHECKING:
    from pptx2html.opc.part import Part
    from .parts import PmlPart


# ---------------------------------------------------------------------------
# Namespace tags
# ---------------------------------------------------------------------------
_P = NAMESPACE.PML_MAIN
_A = NAMESPACE.DML_MAIN
_R = NAMESPACE.OFC_RELATIONSHIPS
_C = NAMESPACE.DML_CHART

_TAG_SP = f"{{{_P}}}sp"
_TAG_PIC = f"{{{_P}}}pic"
_TAG_CXN_SP = f"{{{_P}}}cxnSp"
_TAG_GRP_SP = f"{{{_P}}}grpSp"
_TAG_GRAPHIC_FRAME = f"{{{_P}}}graphicFrame"
_TAG_SP_TREE = f"{{{_P}}}spTree"

_TAG_NV_SP_PR = f"{{{_P}}}nvSpPr"
_TAG_NV_PIC_PR = f"{{{_P}}}nvPicPr"
_TAG_NV_CXN_SP_PR = f"{{{_P}}}nvCxnSpPr"
_TAG_NV_GRP_SP_PR = f"{{{_P}}}nvGrpSpPr"
_TAG_NV_GF_PR = f"{{{_P}}}nvGraphicFramePr"
_TAG_CNV_PR = f"{{{_P}}}cNvPr"
_TAG_NV_PR = f"{{{_P}}}nvPr"
_TAG_PH = f"{{{_P}}}ph"

_TAG_SP_PR = f"{{{_P}}}spPr"
_TAG_TX_BODY = f"{{{_P}}}txBody"
_TAG_PIC_TX_BODY = f"{{{_A}}}txBody"
_TAG_BLIP_FILL = f"{{{_P}}}blipFill"
_TAG_BLIP = f"{{{_A}}}blip"
_TAG_SRC_RECT = f"{{{_A}}}srcRect"
_TAG_GRP_SP_PR = f"{{{_P}}}grpSpPr"
_TAG_GF_PR = f"{{{_P}}}graphicFramePr"
_TAG_XFRM = f"{{{_A}}}xfrm"
_TAG_P_XFRM = f"{{{_P}}}xfrm"
_TAG_GRP_XFRM = f"{{{_A}}}grp"
_TAG_OFF = f"{{{_A}}}off"
_TAG_EXT = f"{{{_A}}}ext"
_TAG_CHOFF = f"{{{_A}}}chOff"
_TAG_CHEXT = f"{{{_A}}}chExt"
_TAG_PRST_GEOM = f"{{{_A}}}prstGeom"
_TAG_PRST_CONN = f"{{{_A}}}prstCnnctor"
_TAG_CXN = f"{{{_A}}}cxn"
_TAG_GRAPHIC = f"{{{_A}}}graphic"
_TAG_GRAPHIC_DATA = f"{{{_A}}}graphicData"
_TAG_TBL = f"{{{_A}}}tbl"
_TAG_CHART = f"{{{_C}}}chart"
_TAG_NON_VIS_GRP_SHAPE_PROPS = f"{{{_A}}}nvGrpSpPr"

# ---------------------------------------------------------------------------
# Shape base
# ---------------------------------------------------------------------------


class BaseShape(PartElementProxy):
    """Common base for all shapes.

    Provides: *name*, *shape_id*, *left*, *top*, *width*, *height*,
    *rotation*, *hidden*, *is_placeholder*, *placeholder_shape*.
    """

    def __init__(self, element: ET.Element, part: "PmlPart"):
        super().__init__(element, part)
        self._text_frame: Optional[TextFrame] = None
        self._placeholder: Optional["Placeholder"] = None

    @property
    def shape_id(self) -> Optional[int]:
        """Shape identifier (from ``p:cNvPr`` ``id`` attribute)."""
        cnv_pr = self._find_cnv_pr()
        if cnv_pr is not None:
            val = cnv_pr.get("id")
            try:
                return int(val) if val else None
            except (ValueError, TypeError):
                pass
        return None

    @property
    def name(self) -> Optional[str]:
        """Shape name (from ``p:cNvPr`` ``name`` attribute)."""
        cnv_pr = self._find_cnv_pr()
        if cnv_pr is not None:
            return cnv_pr.get("name")
        return None

    @property
    def hidden(self) -> bool:
        """Whether the shape is hidden."""
        cnv_pr = self._find_cnv_pr()
        if cnv_pr is not None:
            return cnv_pr.get("hidden") == "1"
        return False

    @property
    def left(self) -> Optional[float]:
        """Left edge position in points."""
        xfrm = self._find_xfrm()
        if xfrm is None:
            return None
        off = xfrm.find(_TAG_OFF)
        if off is None:
            return None
        return emu_to_pt(off.get("x"))

    @property
    def top(self) -> Optional[float]:
        """Top edge position in points."""
        xfrm = self._find_xfrm()
        if xfrm is None:
            return None
        off = xfrm.find(_TAG_OFF)
        if off is None:
            return None
        return emu_to_pt(off.get("y"))

    @property
    def width(self) -> Optional[float]:
        """Shape width in points."""
        xfrm = self._find_xfrm()
        if xfrm is None:
            return None
        ext = xfrm.find(_TAG_EXT)
        if ext is None:
            return None
        return emu_to_pt(ext.get("cx"))

    @property
    def height(self) -> Optional[float]:
        """Shape height in points."""
        xfrm = self._find_xfrm()
        if xfrm is None:
            return None
        ext = xfrm.find(_TAG_EXT)
        if ext is None:
            return None
        return emu_to_pt(ext.get("cy"))

    @property
    def rotation(self) -> Optional[float]:
        """Rotation in degrees (from ``a:xfrm`` ``rot`` attribute in
        1/60,000ths of a degree)."""
        xfrm = self._find_xfrm()
        if xfrm is None:
            return None
        rot = xfrm.get("rot")
        try:
            return int(rot) / 60000.0 if rot else None
        except (ValueError, TypeError):
            return None

    @property
    def has_text_frame(self) -> bool:
        """Whether this shape can contain text."""
        return False

    @property
    def text_frame(self) -> Optional[TextFrame]:
        """The shape's TextFrame (if any)."""
        return None

    @property
    def is_placeholder(self) -> bool:
        """Whether this shape is a placeholder."""
        ph = self._find_ph()
        return ph is not None

    @property
    def placeholder_shape(self) -> Optional["Placeholder"]:
        """Placeholder metadata if this is a placeholder shape."""
        ph = self._find_ph()
        if ph is not None:
            return Placeholder(ph)
        return None

    @property
    def auto_shape_type(self) -> Optional[str]:
        """Preset geometry name (e.g. ``"rect"``, ``"ellipse"``)."""
        sp_pr = self._element.find(_TAG_SP_PR)
        if sp_pr is None:
            return None
        prst = sp_pr.find(_TAG_PRST_GEOM)
        if prst is not None:
            return prst.get("prst")
        return None

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _find_cnv_pr(self) -> Optional[ET.Element]:
        """Find the ``p:cNvPr`` element for non-visual properties."""
        raise NotImplementedError

    def _find_xfrm(self) -> Optional[ET.Element]:
        """Find the ``a:xfrm`` (or similar) transform element."""
        raise NotImplementedError

    def _find_ph(self) -> Optional[ET.Element]:
        """Find the ``p:ph`` placeholder element."""
        return None

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(name={self.name!r})"


# ---------------------------------------------------------------------------
# Placeholder
# ---------------------------------------------------------------------------


class Placeholder:
    """Placeholder metadata from a ``p:ph`` element.

    Attributes: type, idx, orientation, size, has_custom_prompt.
    """

    def __init__(self, element: ET.Element):
        self._element = element

    @property
    def type(self) -> str:
        """Placeholder type (``"title"``, ``"body"``, ``"pic"``, …)."""
        return self._element.get("type", "body")

    @property
    def idx(self) -> int:
        """Placeholder index (0-based)."""
        val = self._element.get("idx", "0")
        try:
            return int(val)
        except (ValueError, TypeError):
            return 0

    @property
    def orientation(self) -> Optional[str]:
        return self._element.get("orient")

    @property
    def size(self) -> Optional[str]:
        return self._element.get("sz")

    def __repr__(self) -> str:
        return f"Placeholder(type={self.type!r}, idx={self.idx})"


# ---------------------------------------------------------------------------
# AutoShape
# ---------------------------------------------------------------------------


class AutoShape(BaseShape):
    """A shape with a preset geometry and optional text (``p:sp``)."""

    @property
    def has_text_frame(self) -> bool:
        return True

    @property
    def text_frame(self) -> Optional[TextFrame]:
        if self._text_frame is None:
            tx_body = self._element.find(_TAG_TX_BODY)
            if tx_body is not None:
                self._text_frame = TextFrame(tx_body, self)
        return self._text_frame

    # Internal helpers ------------------------------------------------

    def _find_cnv_pr(self) -> Optional[ET.Element]:
        nv = self._element.find(_TAG_NV_SP_PR)
        if nv is not None:
            return nv.find(_TAG_CNV_PR)
        return None

    def _find_xfrm(self) -> Optional[ET.Element]:
        sp_pr = self._element.find(_TAG_SP_PR)
        if sp_pr is not None:
            return sp_pr.find(_TAG_XFRM)
        return None

    def _find_ph(self) -> Optional[ET.Element]:
        nv = self._element.find(_TAG_NV_SP_PR)
        if nv is not None:
            nv_pr = nv.find(_TAG_NV_PR)
            if nv_pr is not None:
                return nv_pr.find(_TAG_PH)
        return None


# ---------------------------------------------------------------------------
# Picture
# ---------------------------------------------------------------------------


class Picture(BaseShape):
    """An image shape (``p:pic``)."""

    @property
    def has_text_frame(self) -> bool:
        tx_body = self._element.find(_TAG_PIC_TX_BODY)
        return tx_body is not None

    @property
    def text_frame(self) -> Optional[TextFrame]:
        if self._text_frame is None:
            tx_body = self._element.find(_TAG_PIC_TX_BODY)
            if tx_body is not None:
                self._text_frame = TextFrame(tx_body, self)
        return self._text_frame

    @property
    def image_part(self) -> Optional["Part"]:
        """The OPC Part containing the image blob."""
        blip_fill = self._element.find(_TAG_BLIP_FILL)
        if blip_fill is None:
            return None
        blip = blip_fill.find(_TAG_BLIP)
        if blip is None:
            return None
        r_id = blip.get(f"{{{_R}}}embed")
        if r_id is None:
            r_id = self._svg_blip_embed_id(blip)
        if r_id is None:
            return None
        return self._part.related_part(r_id)

    @property
    def image_blob(self) -> Optional[bytes]:
        """Raw image bytes."""
        img_part = self.image_part
        if img_part is not None:
            return img_part.blob
        return None

    @property
    def image_content_type(self) -> Optional[str]:
        """MIME type of the image."""
        img_part = self.image_part
        if img_part is not None:
            return img_part.content_type
        return None

    @property
    def cropping(self) -> dict[str, Optional[float]]:
        """Cropping values as fractions (from ``a:srcRect`` attributes)."""
        blip_fill = self._element.find(_TAG_BLIP_FILL)
        if blip_fill is None:
            return {"left": None, "right": None, "top": None, "bottom": None}
        src_rect = blip_fill.find(_TAG_SRC_RECT)
        if src_rect is None:
            return {"left": None, "right": None, "top": None, "bottom": None}

        # Crop attributes are ST_Percentage values: 100000 = 100%.
        result = {}
        for attr, key in [("l", "left"), ("r", "right"),
                          ("t", "top"), ("b", "bottom")]:
            val = src_rect.get(attr)
            result[key] = percentage_to_float(val)
        return result

    # Internal helpers ------------------------------------------------

    def _find_cnv_pr(self) -> Optional[ET.Element]:
        nv = self._element.find(_TAG_NV_PIC_PR)
        if nv is not None:
            return nv.find(_TAG_CNV_PR)
        return None

    def _find_xfrm(self) -> Optional[ET.Element]:
        sp_pr = self._element.find(_TAG_SP_PR)
        if sp_pr is not None:
            return sp_pr.find(_TAG_XFRM)
        return None

    @staticmethod
    def _svg_blip_embed_id(blip: ET.Element) -> Optional[str]:
        """Return Office 2016 SVG fallback relationship from ``asvg:svgBlip``."""
        for elem in blip.iter():
            if elem is blip:
                continue
            if elem.tag.endswith("}svgBlip"):
                embed = elem.get(f"{{{_R}}}embed")
                if embed:
                    return embed
        return None

    def _find_ph(self) -> Optional[ET.Element]:
        nv = self._element.find(_TAG_NV_PIC_PR)
        if nv is not None:
            nv_pr = nv.find(_TAG_NV_PR)
            if nv_pr is not None:
                return nv_pr.find(_TAG_PH)
        return None


# ---------------------------------------------------------------------------
# Connector
# ---------------------------------------------------------------------------


class Connector(BaseShape):
    """A connector shape (``p:cxnSp``)."""

    @property
    def connector_type(self) -> Optional[str]:
        """Connector type (``"straightConnector1"``, etc.)."""
        sp_pr = self._element.find(_TAG_SP_PR)
        if sp_pr is None:
            return None
        prst = sp_pr.find(_TAG_PRST_GEOM)
        if prst is not None:
            return prst.get("prst")
        prst = sp_pr.find(_TAG_PRST_CONN)
        if prst is not None:
            return prst.get("prst")
        return None

    def _find_cnv_pr(self) -> Optional[ET.Element]:
        nv = self._element.find(_TAG_NV_CXN_SP_PR)
        if nv is not None:
            return nv.find(_TAG_CNV_PR)
        return None

    def _find_xfrm(self) -> Optional[ET.Element]:
        sp_pr = self._element.find(_TAG_SP_PR)
        if sp_pr is not None:
            return sp_pr.find(_TAG_XFRM)
        return None


# ---------------------------------------------------------------------------
# GroupShape
# ---------------------------------------------------------------------------


class GroupShape(BaseShape):
    """A group shape (``p:grpSp``) containing child shapes."""

    @property
    def shapes(self) -> list[BaseShape]:
        """Child shapes within this group."""
        return list(_iter_child_shapes(self._element, self._part))

    def __iter__(self) -> Iterator[BaseShape]:
        return iter(self.shapes)

    def __len__(self) -> int:
        return len(self.shapes)

    @property
    def group_left(self) -> Optional[float]:
        """Group child origin x (from ``a:grp`` ``chOff``)."""
        grp = self._find_grp_xfrm()
        if grp is None:
            return None
        off = grp.find(_TAG_CHOFF)
        if off is None:
            return None
        return emu_to_pt(off.get("x"))

    @property
    def group_top(self) -> Optional[float]:
        """Group child origin y (from ``a:grp`` ``chOff``)."""
        grp = self._find_grp_xfrm()
        if grp is None:
            return None
        off = grp.find(_TAG_CHOFF)
        if off is None:
            return None
        return emu_to_pt(off.get("y"))

    @property
    def group_width(self) -> Optional[float]:
        """Group child extent cx (from ``a:grp`` ``chExt``)."""
        grp = self._find_grp_xfrm()
        if grp is None:
            return None
        ext = grp.find(_TAG_CHEXT)
        if ext is None:
            return None
        return emu_to_pt(ext.get("cx"))

    @property
    def group_height(self) -> Optional[float]:
        """Group child extent cy (from ``a:grp`` ``chExt``)."""
        grp = self._find_grp_xfrm()
        if grp is None:
            return None
        ext = grp.find(_TAG_CHEXT)
        if ext is None:
            return None
        return emu_to_pt(ext.get("cy"))

    def _find_cnv_pr(self) -> Optional[ET.Element]:
        nv = self._element.find(_TAG_NV_GRP_SP_PR)
        if nv is not None:
            cnv_pr = nv.find(_TAG_CNV_PR)
            if cnv_pr is not None:
                return cnv_pr
            # Fallback: a:nvGrpSpPr
            a_nv = nv.find(_TAG_NON_VIS_GRP_SHAPE_PROPS)
            if a_nv is not None:
                return a_nv.find(_TAG_CNV_PR)
        return None

    def _find_xfrm(self) -> Optional[ET.Element]:
        grp_pr = self._element.find(_TAG_GRP_SP_PR)
        if grp_pr is not None:
            return grp_pr.find(_TAG_XFRM)
        return None

    def _find_grp_xfrm(self) -> Optional[ET.Element]:
        grp_pr = self._element.find(_TAG_GRP_SP_PR)
        if grp_pr is not None:
            grp = grp_pr.find(_TAG_GRP_XFRM)
            if grp is not None:
                return grp
            return grp_pr.find(_TAG_XFRM)
        return None


# ---------------------------------------------------------------------------
# GraphicFrame
# ---------------------------------------------------------------------------


class GraphicFrame(BaseShape):
    """A frame containing a table, chart, or other embedded object (``p:graphicFrame``)."""

    def _find_graphic_data(self) -> Optional[ET.Element]:
        graphic = self._element.find(_TAG_GRAPHIC)
        if graphic is None:
            return None
        return graphic.find(_TAG_GRAPHIC_DATA)

    @property
    def has_table(self) -> bool:
        data = self._find_graphic_data()
        if data is None:
            return False
        return data.find(_TAG_TBL) is not None

    @property
    def has_chart(self) -> bool:
        data = self._find_graphic_data()
        if data is None:
            return False
        return data.find(_TAG_CHART) is not None

    @property
    def chart_r_id(self) -> Optional[str]:
        """Relationship id of the embedded chart part, if present."""
        data = self._find_graphic_data()
        if data is None:
            return None
        chart = data.find(_TAG_CHART)
        if chart is None:
            return None
        return chart.get(f"{{{_R}}}id")

    @property
    def uri(self) -> Optional[str]:
        """The ``uri`` attribute of the ``a:graphicData`` element."""
        data = self._find_graphic_data()
        if data is not None:
            return data.get("uri")
        return None

    def _find_cnv_pr(self) -> Optional[ET.Element]:
        nv = self._element.find(_TAG_NV_GF_PR)
        if nv is not None:
            return nv.find(_TAG_CNV_PR)
        return None

    def _find_xfrm(self) -> Optional[ET.Element]:
        xfrm = self._element.find(_TAG_P_XFRM)
        if xfrm is not None:
            return xfrm
        # Some producers still emit a:xfrm directly under p:graphicFrame.
        return self._element.find(_TAG_XFRM)


# ---------------------------------------------------------------------------
# Shape factory / dispatch
# ---------------------------------------------------------------------------

_SHAPE_DISPATCH: dict[str, type[BaseShape]] = {
    _TAG_SP: AutoShape,
    _TAG_PIC: Picture,
    _TAG_CXN_SP: Connector,
    _TAG_GRP_SP: GroupShape,
    _TAG_GRAPHIC_FRAME: GraphicFrame,
}


def _shape_factory(element: ET.Element, part: "PmlPart") -> BaseShape:
    """Create the appropriate shape subclass for *element*."""
    cls = _SHAPE_DISPATCH.get(element.tag)
    if cls is not None:
        return cls(element, part)
    # Unknown shape element — return base
    return BaseShape(element, part)


def _iter_child_shapes(
    element: ET.Element, part: "PmlPart"
) -> Iterator[BaseShape]:
    """Yield shape objects for all shape children of *element*.

    Looks for the ``p:spTree`` (or just iterates direct children
    of *element* if it is the spTree).
    """
    sp_tree = element
    if element.tag not in (_TAG_SP_TREE, _TAG_GRP_SP):
        sp_tree = element.find(_TAG_SP_TREE)
    if sp_tree is None:
        return
    for child in sp_tree:
        if child.tag in _SHAPE_DISPATCH:
            yield _shape_factory(child, part)


# ---------------------------------------------------------------------------
# ShapeTree
# ---------------------------------------------------------------------------


class ShapeTree(PartElementProxy):
    """Iterable collection of shapes on a slide/layout/master.

    Wraps the ``p:spTree`` element found in ``p:sld`` / ``p:sldLayout`` /
    ``p:sldMaster``.
    """

    def __init__(self, sp_tree_element: ET.Element, part: "PmlPart"):
        super().__init__(sp_tree_element, part)

    def __iter__(self) -> Iterator[BaseShape]:
        return _iter_child_shapes(self._element, self._part)

    def __len__(self) -> int:
        return sum(1 for _ in self)

    def __getitem__(self, index: int) -> BaseShape:
        for i, shape in enumerate(self):
            if i == index:
                return shape
        raise IndexError(f"Shape index {index} out of range")

    @property
    def placeholders(self) -> list[BaseShape]:
        """All placeholder shapes."""
        return [s for s in self if s.is_placeholder]
