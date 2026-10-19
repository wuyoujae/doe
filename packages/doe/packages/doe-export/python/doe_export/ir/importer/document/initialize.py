# Origin: pptx2html/ir/builder.py::PresentationBuilder.__init__
from __future__ import annotations
from doe_export.ir.importer.shared import Border, ET, Fill, GeometryBuilder, Optional, Shadow, ThreeDInfo

def __init__(self):
    self._theme_colors: dict[str, str] = {}
    self._theme_colors_by_owner: dict[object, dict[str, str]] = {}
    self._color_maps_by_owner: dict[object, dict[str, str]] = {}
    self._active_color_owner: object | None = None
    self._active_slide_part: object | None = None
    self._active_group_fill: Fill | None = None
    self._theme_fonts: dict[str, str] = {}
    self._theme_fill_styles: list[Fill] = []
    self._theme_bg_fill_styles: list[Fill] = []
    self._theme_line_styles: list[Border] = []
    self._theme_effect_styles: list[Shadow] = []
    self._theme_three_d_styles: list[Optional[ThreeDInfo]] = []
    self._table_text_styles: dict[str, dict[str, dict]] = {}
    self._table_cell_style_elements: dict[str, dict[str, ET.Element]] = {}
    self._presentation_default_text_style: Optional[ET.Element] = None
    self._geometry_builder = GeometryBuilder()

__init__.__module__ = 'pptx2html.ir.builder'
__init__.__qualname__ = 'PresentationBuilder.__init__'
