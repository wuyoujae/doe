# Origin: pptx2html/htmlir/compiler.py::_collect_svg_coverage_violations
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import EDITABLE_SVG_TAGS, UNSUPPORTED_SVG_ATTRIBUTES, math
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_float import _css_float
from doe_export.html.compiler.css._style_attr_property import _style_attr_property

def _collect_svg_coverage_violations(
    node: dict[str, Any],
    tag: str,
    violations: set[tuple[str, str, str | None]],
) -> None:
    if tag not in EDITABLE_SVG_TAGS:
        violations.add(("unsupported-svg-element", tag or "unknown", None))
        return

    raw_attributes = node.get("attributes") if isinstance(node.get("attributes"), dict) else {}
    attributes = {str(name).lower(): str(value or "").strip() for name, value in raw_attributes.items()}
    for name in UNSUPPORTED_SVG_ATTRIBUTES:
        value = attributes.get(name, "")
        if value and value.lower() != "none":
            violations.add(("unsupported-svg-feature", tag, name))

    style = attributes.get("style", "")
    for name in UNSUPPORTED_SVG_ATTRIBUTES:
        value = _style_attr_property(style, name)
        if value is not None and str(value).strip().lower() not in {"", "none"}:
            violations.add(("unsupported-svg-feature", tag, name))

    computed = _computed(node)
    for name, computed_name in (
        ("transform", "transform"),
        ("filter", "filter"),
        ("clip-path", "clipPath"),
        ("mix-blend-mode", "mixBlendMode"),
    ):
        value = str(computed.get(computed_name) or "").strip().lower()
        default = "normal" if name == "mix-blend-mode" else "none"
        if value and value != default:
            violations.add(("unsupported-svg-feature", tag, name))

    if tag == "g":
        opacity = _css_float(computed.get("opacity"), 1.0)
        if not math.isclose(opacity, 1.0, abs_tol=0.0001):
            violations.add(("unsupported-svg-feature", tag, "opacity"))

    for paint in ("fill", "stroke"):
        value = str(
            attributes.get(paint)
            or _style_attr_property(style, paint)
            or computed.get(paint)
            or ""
        ).strip().lower()
        if value.startswith("url("):
            violations.add(("unsupported-svg-feature", tag, f"{paint}-paint-server"))

_collect_svg_coverage_violations.__module__ = 'pptx2html.htmlir.compiler'
