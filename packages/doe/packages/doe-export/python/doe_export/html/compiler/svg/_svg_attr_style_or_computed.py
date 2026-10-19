# Origin: pptx2html/htmlir/compiler.py::_svg_attr_style_or_computed
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._style_attr_property import _style_attr_property

def _svg_attr_style_or_computed(
    node: dict[str, Any],
    inherited_node: dict[str, Any],
    attr_name: str,
    computed_name: str,
) -> Any:
    computed = _computed(node)
    # SVG paint attributes may contain theme variables or be overridden by CSS.
    # The browser-resolved paint includes both the cascade and inherited color.
    if attr_name in {"fill", "stroke"} and str(computed.get(computed_name) or "").strip():
        return computed[computed_name]
    attrs = node.get("attributes") if isinstance(node.get("attributes"), dict) else {}
    if isinstance(attrs, dict):
        if attr_name in attrs:
            return attrs.get(attr_name)
        style_value = _style_attr_property(attrs.get("style"), attr_name)
        if style_value is not None:
            return style_value
    if computed_name in computed and str(computed.get(computed_name) or "").strip():
        return computed.get(computed_name)
    inherited = _computed(inherited_node)
    if computed_name in inherited and str(inherited.get(computed_name) or "").strip():
        return inherited.get(computed_name)
    inherited_attrs = inherited_node.get("attributes") if isinstance(inherited_node.get("attributes"), dict) else {}
    if isinstance(inherited_attrs, dict):
        if attr_name in inherited_attrs:
            return inherited_attrs.get(attr_name)
        return _style_attr_property(inherited_attrs.get("style"), attr_name)
    return None

_svg_attr_style_or_computed.__module__ = 'pptx2html.htmlir.compiler'
