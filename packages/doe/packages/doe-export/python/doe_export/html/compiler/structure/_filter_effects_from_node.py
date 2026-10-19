# Origin: pptx2html/htmlir/compiler.py::_filter_effects_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Shadow
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_filter_amount import _css_filter_amount
from doe_export.html.compiler.css._css_filter_function_names import _css_filter_function_names
from doe_export.html.compiler.css._css_named_function_arguments import _css_named_function_arguments
from doe_export.html.compiler.css._css_px import _css_px

def _filter_effects_from_node(node: dict[str, Any], sx: float, sy: float) -> list[Shadow]:
    computed = _computed(node)
    raw = str(computed.get("filter") or "").strip()
    if not raw or raw.lower() == "none":
        return []
    effects: list[Shadow] = []
    for arg in _css_named_function_arguments(raw, "blur"):
        blur_px = _css_px(arg)
        if blur_px <= 0:
            continue
        effects.append(
            Shadow(
                type="softEdge",
                blur_pt=round(blur_px * ((sx + sy) / 2.0), 3),
                diagnostics=["htmlir:filter", "htmlir:filter-blur"],
            )
        )
        break
    for arg in _css_named_function_arguments(raw, "grayscale"):
        amount = _css_filter_amount(arg, default=1.0)
        if amount <= 0:
            continue
        effects.append(
            Shadow(
                type="grayscale",
                alpha=round(amount, 4),
                diagnostics=["htmlir:filter", "htmlir:filter-grayscale"],
            )
        )
        break
    if effects and len(_css_filter_function_names(raw)) > len(effects):
        effects[0].diagnostics.append("htmlir:filter-chain-first-pass")
    return effects

_filter_effects_from_node.__module__ = 'pptx2html.htmlir.compiler'
