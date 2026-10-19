# Origin: schema_v4_math.py::formula_spec
from __future__ import annotations
from .shared import Any, FORMULA_COMPONENT_TYPE, NativeFormulaSpec
from ._parse_color import _parse_color
from ._read_bounds import _read_bounds

def formula_spec(component: dict[str, Any]) -> NativeFormulaSpec:
    if str(component.get("type") or "") != FORMULA_COMPONENT_TYPE:
        raise ValueError("Unsupported native formula component.")
    component_id = str(component.get("id") or "").strip()
    props = component.get("props") if isinstance(component.get("props"), dict) else {}
    content = props.get("content") if isinstance(props.get("content"), dict) else {}
    source = str(content.get("formula") or "").strip()
    mathml = str(component.get("mathml") or "").strip()
    if not component_id or not source or not mathml:
        raise ValueError("Native formula metadata is incomplete.")
    try:
        font_size_pt = float(component.get("font_size_pt") or 26.0)
    except (TypeError, ValueError):
        font_size_pt = 26.0
    font_size_pt = max(8.0, min(200.0, font_size_pt))
    align = str(component.get("align") or content.get("align") or "center").lower()
    if align not in {"left", "center", "right"}:
        align = "center"
    return NativeFormulaSpec(
        component_id=component_id,
        source=source,
        mathml=mathml,
        bounds_pt=_read_bounds(component.get("bounds_pt")),
        color=_parse_color(component.get("color") or content.get("color")),
        font_size_pt=font_size_pt,
        align=align,
    )

formula_spec.__module__ = 'schema_v4_math'
