# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._table_cell_style
from __future__ import annotations
from doe_export.html.renderer.shared import TableCell

def _table_cell_style(
    self,
    cell: TableCell,
    table: TableInfo | None = None,
    row_index: int = 0,
    *,
    width_pt: float = 100.0,
    height_pt: float = 100.0,
) -> str:
    styles: list[str] = []
    if cell.fill:
        if cell.fill.type == "solid":
            color = self._css_color(cell.fill.color)
            if color:
                if cell.fill.alpha is not None and cell.fill.alpha < 1:
                    raw = color.lstrip("#")
                    color = (
                        f"rgba({int(raw[0:2], 16)},{int(raw[2:4], 16)},"
                        f"{int(raw[4:6], 16)},{max(0.0, min(1.0, cell.fill.alpha)):.3f})"
                    )
                styles.append(f"background-color:{color}")
        elif cell.fill.type == "gradient" and cell.fill.gradient_stops:
            gradient = self._css_gradient_fill(cell.fill)
            if gradient:
                styles.append(f"background:{gradient}")
        elif cell.fill.type == "picture" and cell.fill.image:
            styles.extend(
                self._image_background_styles(
                    cell.fill.image,
                    width_pt,
                    height_pt,
                    opacity_multiplier=cell.fill.alpha,
                )
            )
        elif cell.fill.type == "pattern":
            foreground = self._css_color(cell.fill.pattern_fg_color) or "#000000"
            background = self._css_color(cell.fill.pattern_bg_color) or "#FFFFFF"
            styles.append(f"background-color:{background}")
            styles.append(
                "background-image:repeating-linear-gradient(45deg,"
                f"transparent 0 4px,{foreground} 4px 5px,transparent 5px 8px)"
            )
    if cell.margins:
        top = cell.margins.get("top") or 0
        right = cell.margins.get("right") or 0
        bottom = cell.margins.get("bottom") or 0
        left = cell.margins.get("left") or 0
        styles.append(f"padding:{top:.2f}pt {right:.2f}pt {bottom:.2f}pt {left:.2f}pt")
    if cell.vertical_align:
        if cell.vertical_align in {"ctr", "mid"}:
            styles.append("vertical-align:middle")
        elif cell.vertical_align in {"b", "bot"}:
            styles.append("vertical-align:bottom")
    for side, border in (
        ("left", cell.border_left),
        ("right", cell.border_right),
        ("top", cell.border_top),
        ("bottom", cell.border_bottom),
    ):
        if border and border.width and border.color and not border.no_fill:
            color = self._css_border_color(border)
            if not color:
                continue
            border_style = "double" if border.compound == "dbl" else self._css_dash_style(border.dash)
            styles.append(f"border-{side}:{border.width:.2f}pt {border_style} {color}")
    return "; ".join(styles)

_table_cell_style.__module__ = 'pptx2html.renderer.html_renderer'
_table_cell_style.__qualname__ = 'HtmlRenderer._table_cell_style'
