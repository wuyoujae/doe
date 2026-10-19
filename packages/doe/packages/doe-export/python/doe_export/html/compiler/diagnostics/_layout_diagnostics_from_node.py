# Origin: pptx2html/htmlir/compiler.py::_layout_diagnostics_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_clear_value import _css_clear_value
from doe_export.html.compiler.css._css_effect_layout_diagnostics import _css_effect_layout_diagnostics
from doe_export.html.compiler.css._css_float_value import _css_float_value
from doe_export.html.compiler.diagnostics._diagnostic_value import _diagnostic_value
from doe_export.html.compiler.css._has_css_gap import _has_css_gap
from doe_export.html.compiler.css._has_css_gap_axis import _has_css_gap_axis
from doe_export.html.compiler.document._has_non_initial_flex_item_props import _has_non_initial_flex_item_props
from doe_export.html.compiler.document._has_non_initial_grid_item_props import _has_non_initial_grid_item_props
from doe_export.html.compiler.document._has_non_initial_grid_template import _has_non_initial_grid_template
from doe_export.html.compiler.document._is_flex_display import _is_flex_display
from doe_export.html.compiler.document._is_grid_display import _is_grid_display
from doe_export.html.compiler.document._list_has_custom_marker import _list_has_custom_marker
from doe_export.html.compiler.structure._parent_node import _parent_node
from doe_export.html.compiler.diagnostics._stable_identity_diagnostics import _stable_identity_diagnostics

def _layout_diagnostics_from_node(node: dict[str, Any], nodes_by_path: dict[str, dict[str, Any]]) -> list[str]:
    computed = _computed(node)
    diagnostics: list[str] = _stable_identity_diagnostics(node, nodes_by_path)

    def add(item: str) -> None:
        if item not in diagnostics:
            diagnostics.append(item)

    box_sizing = str(computed.get("boxSizing") or "").strip().lower()
    if box_sizing == "border-box":
        add("htmlir:box-sizing-border-box")
    float_value = _css_float_value(computed)
    if float_value in {"left", "right"}:
        add("htmlir:float")
        add(f"htmlir:float-{float_value}")
    clear_value = _css_clear_value(computed)
    if clear_value in {"left", "right", "both"}:
        add("htmlir:clear")
        add(f"htmlir:clear-{clear_value}")

    if _is_flex_display(computed):
        add("htmlir:flex-layout")
        direction = _diagnostic_value(computed.get("flexDirection"))
        if direction:
            add(f"htmlir:flex-direction-{direction}")
        wrap = _diagnostic_value(computed.get("flexWrap"))
        if wrap and wrap != "nowrap":
            add("htmlir:flex-wrap")
            add(f"htmlir:flex-wrap-{wrap}")
    if _is_grid_display(computed):
        add("htmlir:grid-layout")
        if _has_non_initial_grid_template(computed):
            add("htmlir:grid-template")
        auto_flow = _diagnostic_value(computed.get("gridAutoFlow"))
        if auto_flow and auto_flow != "row":
            add("htmlir:grid-auto-flow")
            add(f"htmlir:grid-auto-flow-{auto_flow}")

    if _has_css_gap(computed):
        add("htmlir:gap")
        if _has_css_gap_axis(computed.get("rowGap")):
            add("htmlir:row-gap")
        if _has_css_gap_axis(computed.get("columnGap")):
            add("htmlir:column-gap")

    for prop_name, diagnostic_name, default_values in (
        ("alignContent", "align-content", {"normal", "stretch"}),
        ("alignItems", "align-items", {"normal", "stretch"}),
        ("alignSelf", "align-self", {"auto", "normal", "stretch"}),
        ("justifyContent", "justify-content", {"normal", "start"}),
        ("justifyItems", "justify-items", {"legacy", "normal", "stretch"}),
        ("justifySelf", "justify-self", {"auto", "normal", "stretch"}),
    ):
        value = _diagnostic_value(computed.get(prop_name))
        if value and value not in default_values:
            add(f"htmlir:{diagnostic_name}")
            add(f"htmlir:{diagnostic_name}-{value}")

    for prop_name, diagnostic_name, default_values in (
        ("placeContent", "place-content", {"normal", "normal-normal", "stretch", "stretch-stretch"}),
        ("placeItems", "place-items", {"normal", "normal-normal", "stretch", "stretch-stretch"}),
        ("placeSelf", "place-self", {"auto", "auto-auto", "normal", "normal-normal", "stretch", "stretch-stretch"}),
    ):
        value = _diagnostic_value(computed.get(prop_name))
        if value and value not in default_values:
            add(f"htmlir:{diagnostic_name}")
            add(f"htmlir:{diagnostic_name}-{value}")

    for prop_name, diagnostic_name in (
        ("counterReset", "counter-reset"),
        ("counterIncrement", "counter-increment"),
        ("counterSet", "counter-set"),
    ):
        value = _diagnostic_value(computed.get(prop_name))
        if value and value != "none":
            add("htmlir:counter")
            add(f"htmlir:{diagnostic_name}")

    list_info = node.get("list") if isinstance(node.get("list"), dict) else None
    if list_info and _list_has_custom_marker(list_info):
        add("htmlir:custom-marker")
        marker = list_info.get("marker") if isinstance(list_info.get("marker"), dict) else {}
        content = str(marker.get("content") or "").lower()
        if "counter(" in content or "counters(" in content:
            add("htmlir:counter-marker")

    for diagnostic in _css_effect_layout_diagnostics(computed):
        add(diagnostic)

    parent = _parent_node(node, nodes_by_path)
    if parent is not None and _is_flex_display(_computed(parent)):
        add("htmlir:flex-item")
        if _has_non_initial_flex_item_props(computed):
            add("htmlir:flex-item-props")
    if parent is not None and _is_grid_display(_computed(parent)):
        add("htmlir:grid-item")
        if _has_non_initial_grid_item_props(computed):
            add("htmlir:grid-placement")
    return diagnostics

_layout_diagnostics_from_node.__module__ = 'pptx2html.htmlir.compiler'
