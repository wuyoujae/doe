# Origin: pptx2html/ir/builder.py::PresentationBuilder.build
from __future__ import annotations
from doe_export.ir.importer.shared import IRPresentation, NAMESPACE, PomPresentation

def build(self, pom: PomPresentation) -> IRPresentation:
    self._theme_colors_by_owner = {}
    self._color_maps_by_owner = {}
    self._active_color_owner = None
    self._active_slide_part = None
    self._active_group_fill = None
    self._theme_colors = self._load_theme_colors(pom)
    (
        self._theme_fill_styles,
        self._theme_bg_fill_styles,
        self._theme_line_styles,
        self._theme_effect_styles,
    ) = self._load_theme_format_styles(pom)
    self._theme_three_d_styles = self._load_theme_three_d_styles(pom)
    self._theme_fonts = self._load_theme_fonts(pom)
    self._table_text_styles = self._load_table_text_styles(pom)
    self._table_cell_style_elements = self._load_table_cell_style_elements(pom)
    self._presentation_default_text_style = (
        pom.presentation_part.element.find(
            f"{{{NAMESPACE.PML_MAIN}}}defaultTextStyle"
        )
        if pom.presentation_part is not None
        else None
    )
    ir = IRPresentation(
        width=pom.slide_width or 720.0,
        height=pom.slide_height or 540.0,
        embedded_fonts=self._load_embedded_fonts(pom),
    )
    for i, slide_part in enumerate(pom.slides, 1):
        self._active_slide_part = slide_part
        try:
            ir_slide = self._build_slide(slide_part, i)
            ir.slides.append(ir_slide)
        finally:
            self._active_slide_part = None
    return ir

build.__module__ = 'pptx2html.ir.builder'
build.__qualname__ = 'PresentationBuilder.build'
