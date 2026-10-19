"""Canonical, editable IR -> HTML projection.

Unlike :class:`HtmlRenderer`, this renderer emits every slide as visible static
HTML without viewer chrome or runtime JavaScript. The document carries stable
markers consumed by ``htmlir.compile_html`` for multi-slide import.
"""

from __future__ import annotations

import dataclasses
import hashlib
import html
import json
import math
import re

from pptx2html.ir.model import Fill, Presentation as IRPresentation

from .css import VIEWER_CSS
from .html_renderer import HtmlRenderer


CANONICAL_WIDTH = 960.0
CANONICAL_HEIGHT = 540.0


_TABLE_CELL_OPEN_PATTERN = re.compile(r"<td(?=[ >])")


CANONICAL_CSS = f"""
{VIEWER_CSS}

html,
body {{
  margin: 0;
  min-width: 100%;
  min-height: 100%;
  background: #d9dde3;
}}

body[data-pptx2html-canonical="1"] {{
  overflow: auto;
}}

.pptx-canonical-deck {{
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 24px;
  box-sizing: border-box;
}}

.pptx-slide.pptx-canonical-slide {{
  position: relative;
  display: block;
  flex: 0 0 auto;
  margin: 0;
  overflow: hidden;
  transform: none;
  transform-origin: 0 0;
  box-shadow: 0 3px 18px rgba(15, 23, 42, 0.2);
}}

.pptx-canonical-layer {{
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
}}

@media print {{
  html,
  body {{ background: #ffffff; }}
  .pptx-canonical-deck {{ gap: 0; padding: 0; }}
  .pptx-slide.pptx-canonical-slide {{
    box-shadow: none;
    break-after: page;
    page-break-after: always;
  }}
}}
"""


class CanonicalHtmlRenderer(HtmlRenderer):
    """Render IR to a self-contained, multi-slide canonical HTML document."""

    def render(
        self,
        ir: IRPresentation,
        *,
        preserve_page_size: bool = False,
    ) -> str:
        self._ir = ir
        self._slide_w = float(ir.width or CANONICAL_WIDTH)
        self._slide_h = float(ir.height or CANONICAL_HEIGHT)
        if preserve_page_size and (
            not math.isfinite(self._slide_w)
            or not math.isfinite(self._slide_h)
            or self._slide_w <= 0
            or self._slide_h <= 0
        ):
            raise ValueError("Presentation page size must contain positive finite dimensions.")
        self._canonical_w = self._slide_w if preserve_page_size else CANONICAL_WIDTH
        self._canonical_h = self._slide_h if preserve_page_size else CANONICAL_HEIGHT
        self._image_counter = 0
        self._svg_counter = 0
        self._embedded_font_families = {
            str(font.typeface).strip().lower()
            for font in (ir.embedded_fonts or [])
            if getattr(font, "typeface", None)
        }
        embedded_font_css = self._embedded_font_css(ir)

        rendered_slides = [
            self._render_canonical_slide(slide, index)
            for index, slide in enumerate(ir.slides)
        ]
        slides_html = "\n".join(rendered_slides)
        payload = self._render_ir_payload(ir, rendered_slides)
        return (
            "<!DOCTYPE html>\n"
            '<html lang="zh-CN" data-pptx2html-canonical="1">\n'
            "<head>\n"
            '<meta charset="UTF-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
            "<title>Canonical Presentation</title>\n"
            '<style data-pptx2html-canonical-style="1">\n'
            f"{CANONICAL_CSS}\n"
            f"{embedded_font_css}\n"
            "</style>\n"
            "</head>\n"
            '<body data-pptx2html-canonical="1">\n'
            '<main class="pptx-canonical-deck" data-pptx2html-canonical="1" '
            f'data-original-width="{self._slide_w:.6f}" '
            f'data-original-height="{self._slide_h:.6f}" '
            f'data-slide-count="{len(ir.slides)}">\n'
            f"{slides_html}\n"
            "</main>\n"
            f"{payload}\n"
            "</body>\n"
            "</html>"
        )

    def _render_shape(self, shape) -> str:
        shape_key = getattr(self, "_canonical_shape_counter", 0)
        self._canonical_shape_counter = shape_key + 1
        previous_shape_key = getattr(self, "_canonical_active_shape_key", None)
        self._canonical_active_shape_key = shape_key
        try:
            rendered = super()._render_shape(shape)
        finally:
            self._canonical_active_shape_key = previous_shape_key
        marker = rendered.find(">")
        if marker < 0:
            return rendered
        shape_id = getattr(shape, "shape_id", None)
        shape_type = str(getattr(shape, "type", "shape") or "shape")
        source_scope = str(getattr(shape, "source_scope", "") or "")
        shape_name = html.escape(str(getattr(shape, "name", "") or f"Shape {shape_id}"), quote=True)
        element_type = "icon" if getattr(shape, "icon", None) else {
            "picture": "image",
            "graphic_frame": "table",
            "group_shape": "group",
            "connector": "shape",
        }.get(shape_type, "text" if getattr(shape, "text", None) else "shape")
        attributes = (
            f' data-pptx-shape-id="{shape_id if shape_id is not None else ""}"'
            f' data-pptx-shape-key="{shape_key}"'
            f' data-yrkie-element-id="pptx-{shape_id if shape_id is not None else "unknown"}"'
            f' data-pptx-shape-type="{html.escape(shape_type, quote=True)}"'
            f' data-pptx-source-scope="{html.escape(source_scope, quote=True)}"'
            f' element-name="{shape_name}" element-type="{element_type}"'
        )
        return rendered[:marker] + attributes + rendered[marker:]

    def _render_text_frame(self, tf, shape=None) -> str:
        rendered = super()._render_text_frame(tf, shape)
        shape_key = getattr(self, "_canonical_active_shape_key", None)
        slide_index = getattr(self, "_canonical_active_slide_index", None)
        if shape_key is None or slide_index is None:
            return rendered
        return rendered.replace(
            '<div class="pptx-text-frame"',
            '<div class="pptx-text-frame" '
            f'data-pptx-text-key="slide:{slide_index}:shape:{shape_key}:text"',
            1,
        )

    def _render_table(self, shape, base_style: list[str]) -> str:
        rendered = super()._render_table(shape, base_style)
        table = getattr(shape, "table", None)
        shape_key = getattr(self, "_canonical_active_shape_key", None)
        slide_index = getattr(self, "_canonical_active_slide_index", None)
        if table is None or shape_key is None or slide_index is None:
            return rendered

        cell_keys: list[str | None] = []
        for row_index, row_cells in enumerate(table.rows):
            for column_index, cell in enumerate(row_cells):
                if cell.h_merge or cell.v_merge:
                    continue
                cell_keys.append(
                    (
                        f"slide:{slide_index}:shape:{shape_key}:"
                        f"cell:{row_index}:{column_index}"
                    )
                    if cell.text_frame is not None
                    else None
                )

        position = 0

        def add_text_key(match: re.Match[str]) -> str:
            nonlocal position
            key = cell_keys[position] if position < len(cell_keys) else None
            position += 1
            if key is None:
                return match.group(0)
            return f'<td data-pptx-text-key="{key}"'

        return _TABLE_CELL_OPEN_PATTERN.sub(add_text_key, rendered)

    @staticmethod
    def _render_ir_payload(ir: IRPresentation, rendered_slides: list[str]) -> str:
        payload = {
            "format": "pptx2html-canonical-ir",
            "version": 1,
            "slide_hashes": [
                hashlib.sha256(slide.encode("utf-8")).hexdigest()
                for slide in rendered_slides
            ],
            "presentation": dataclasses.asdict(ir),
        }
        raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        # Script data is a raw-text element. Unicode escapes keep presentation
        # text such as ``</script>`` from terminating the payload early.
        safe = raw.replace("&", "\\u0026").replace("<", "\\u003c").replace(">", "\\u003e")
        return (
            '<script id="pptx2html-canonical-ir" type="application/json" '
            'data-pptx2html-ir="1">'
            f"{safe}</script>"
        )

    def _render_canonical_slide(self, slide, index: int) -> str:
        self._canonical_shape_counter = 0
        self._canonical_active_slide_index = index
        try:
            shapes_html = "\n".join(self._render_shape(shape) for shape in slide.shapes)
        finally:
            self._canonical_active_slide_index = None
        scale_x = self._canonical_w / max(0.001, self._slide_w)
        scale_y = self._canonical_h / max(0.001, self._slide_h)
        slide_styles = [
            f"width:{self._canonical_w:.3f}pt",
            f"height:{self._canonical_h:.3f}pt",
            *self._slide_background_styles(slide.background.fill if slide.background else None),
        ]
        layer_styles = [
            f"width:{self._slide_w:.3f}pt",
            f"height:{self._slide_h:.3f}pt",
            f"transform:scale({scale_x:.9f}, {scale_y:.9f})",
        ]
        name = html.escape(slide.name or f"Slide {index + 1}", quote=True)
        return (
            f"<!-- PPTX2HTML_SLIDE_START:{index} -->\n"
            f'<section id="pptx-slide-{index + 1}" '
            'class="pptx-slide pptx-canonical-slide" '
            'data-pptx2html-slide="1" '
            f'data-slide-index="{index}" data-slide-name="{name}" '
            f'data-width="{self._canonical_w:.6f}" data-height="{self._canonical_h:.6f}" '
            f'style="{self._html_style(slide_styles)}">\n'
            '<div class="pptx-canonical-layer" data-pptx2html-layer="1" '
            f'style="{self._html_style(layer_styles)}">\n'
            f"{shapes_html}\n"
            "</div>\n"
            "</section>\n"
            f"<!-- PPTX2HTML_SLIDE_END:{index} -->"
        )

    def _slide_background_styles(self, fill: Fill | None) -> list[str]:
        if fill is None or fill.type == "none":
            return ["background-color:#FFFFFF"]
        return self._background_fill_styles(fill) or ["background-color:#FFFFFF"]
