# Origin: pptx2html/htmlir/compiler.py::_uses_background_clip_text
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _uses_background_clip_text(computed: dict[str, Any]) -> bool:
    raw = str(computed.get("backgroundClip") or "").strip().lower()
    return any(token.strip() == "text" for token in raw.split(","))

_uses_background_clip_text.__module__ = 'pptx2html.htmlir.compiler'
