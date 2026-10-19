# Origin: pptx2html/htmlir/compiler.py::_has_non_initial_flex_item_props
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _has_non_initial_flex_item_props(computed: dict[str, Any]) -> bool:
    grow = str(computed.get("flexGrow") or "0").strip()
    shrink = str(computed.get("flexShrink") or "1").strip()
    basis = str(computed.get("flexBasis") or "auto").strip().lower()
    order = str(computed.get("order") or "0").strip()
    return grow not in {"0", "0.0"} or shrink not in {"1", "1.0"} or basis != "auto" or order not in {"0", "0.0"}

_has_non_initial_flex_item_props.__module__ = 'pptx2html.htmlir.compiler'
