# Origin: pptx2html/htmlir/compiler.py::_is_remote_image_placeholder
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _is_remote_image_placeholder(node: dict[str, Any]) -> bool:
    attrs = node.get("attributes") if isinstance(node.get("attributes"), dict) else {}
    return str(attrs.get("data-yrkie-image-placeholder") or "").strip() == "remote-unavailable"

_is_remote_image_placeholder.__module__ = 'pptx2html.htmlir.compiler'
