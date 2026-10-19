# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._shape_style
from __future__ import annotations
from doe_export.html.renderer.shared import GEOMETRY_CSS, Shape

def _shape_style(self, shape: Shape) -> list[str]:
    styles: list[str] = []

    if shape.hidden:
        styles.append("display:none")

    # Position & size (all in pt)
    if shape.bounds:
        styles.append(f"left:{shape.bounds.left:.3f}pt")
        styles.append(f"top:{shape.bounds.top:.3f}pt")
        styles.append(f"width:{shape.bounds.width:.3f}pt")
        styles.append(f"height:{shape.bounds.height:.3f}pt")

    transform = []
    if shape.rotation:
        transform.append(f"rotate({shape.rotation:.2f}deg)")
    if shape.flip_horizontal or shape.flip_vertical:
        sx = -1 if shape.flip_horizontal else 1
        sy = -1 if shape.flip_vertical else 1
        transform.append(f"scale({sx}, {sy})")
    if transform:
        styles.append(f"transform:{' '.join(transform)}")

    if shape.shadow:
        blur = shape.shadow.blur_pt or 0
        if shape.shadow.type == "softEdge":
            styles.append(f"filter:blur({blur:.2f}pt)")
        else:
            color = self._css_color(shape.shadow.color) or "#000000"
            ox = shape.shadow.offset_x or 0
            oy = shape.shadow.offset_y or 0
            if shape.shadow.alpha is not None and shape.shadow.alpha < 1:
                raw = color.lstrip("#")
                color = (
                    f"rgba({int(raw[0:2], 16)},{int(raw[2:4], 16)},"
                    f"{int(raw[4:6], 16)},{shape.shadow.alpha:.3f})"
                )
            styles.append(f"filter:drop-shadow({ox:.2f}pt {oy:.2f}pt {blur:.2f}pt {color})")

    # Fill
    if shape.fill and shape.fill.type == "solid" and shape.fill.color and not shape.geometry_paths:
        color = self._css_color(shape.fill.color)
        if color and shape.fill.alpha is not None and shape.fill.alpha < 1.0:
            r = int(color[1:3], 16)
            g = int(color[3:5], 16)
            b = int(color[5:7], 16)
            styles.append(f"background-color:rgba({r},{g},{b},{shape.fill.alpha:.3f})")
        elif color:
            styles.append(f"background-color:{color}")
    elif (
        shape.fill
        and shape.fill.type == "gradient"
        and shape.fill.gradient_stops
        and (not shape.geometry_paths or shape.geometry in GEOMETRY_CSS)
    ):
        gradient = self._css_gradient_fill(shape.fill)
        if gradient:
            styles.append(f"background:{gradient}")
    elif shape.fill and shape.fill.type == "picture" and shape.fill.image and not shape.geometry_paths:
        width = shape.bounds.width if shape.bounds else 100.0
        height = shape.bounds.height if shape.bounds else 100.0
        styles.extend(
            self._image_background_styles(
                shape.fill.image,
                width,
                height,
                opacity_multiplier=shape.fill.alpha,
            )
        )

    # Border
    if shape.border and shape.type != "connector" and not shape.geometry_paths:
        styles.extend(self._border_styles(shape.border))

    # Geometry
    css_backed_geometry_fill = bool(
        shape.geometry_paths
        and shape.fill
        and shape.fill.type == "gradient"
        and shape.geometry in GEOMETRY_CSS
    )
    if shape.geometry and (not shape.geometry_paths or css_backed_geometry_fill):
        geo_css = self._geometry_css(shape)
        if geo_css:
            styles.append(geo_css)

    return styles

_shape_style.__module__ = 'pptx2html.renderer.html_renderer'
_shape_style.__qualname__ = 'HtmlRenderer._shape_style'
