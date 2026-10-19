# Origin: pptx2html/htmlir/compiler.py::_css_effect_layout_diagnostics
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.css._css_column_count import _css_column_count
from doe_export.html.compiler.css._css_filter_function_names import _css_filter_function_names
from doe_export.html.compiler.css._css_px import _css_px
from doe_export.html.compiler.css._css_time_list_has_duration import _css_time_list_has_duration
from doe_export.html.compiler.geometry._css_transform_rotation import _css_transform_rotation
from doe_export.html.compiler.diagnostics._diagnostic_value import _diagnostic_value
from doe_export.html.compiler.css._has_css_gap_axis import _has_css_gap_axis

def _css_effect_layout_diagnostics(computed: dict[str, Any]) -> list[str]:
    diagnostics: list[str] = []

    def add(item: str) -> None:
        if item and item not in diagnostics:
            diagnostics.append(item)

    border_image_source = str(computed.get("borderImageSource") or "").strip().lower()
    border_image = str(computed.get("borderImage") or "").strip().lower()
    if (border_image_source and border_image_source != "none") or (border_image and border_image != "none"):
        add("htmlir:border-image")
        add("htmlir:border-image-first-pass")
        if "gradient(" in border_image_source:
            add("htmlir:border-image-gradient")
        if "url(" in border_image_source:
            add("htmlir:border-image-picture")

    filter_value = str(computed.get("filter") or "").strip().lower()
    if filter_value and filter_value != "none":
        add("htmlir:filter")
        names = _css_filter_function_names(filter_value)
        for name in names:
            add(f"htmlir:filter-{_diagnostic_value(name)}")
        if names and any(name not in {"drop-shadow", "blur"} for name in names):
            add("htmlir:filter-first-pass")
        if len(names) > 1:
            add("htmlir:filter-chain-first-pass")

    backdrop_filter = str(computed.get("backdropFilter") or "").strip().lower()
    if backdrop_filter and backdrop_filter != "none":
        add("htmlir:backdrop-filter-first-pass")

    mix_blend = _diagnostic_value(computed.get("mixBlendMode"))
    if mix_blend and mix_blend != "normal":
        add("htmlir:mix-blend-mode-first-pass")
        add(f"htmlir:mix-blend-mode-{mix_blend}")
    isolation = _diagnostic_value(computed.get("isolation"))
    if isolation == "isolate":
        add("htmlir:isolation-isolate")

    transform = str(computed.get("transform") or "").strip().lower()
    if transform and transform != "none":
        add("htmlir:transform")
        if _css_transform_rotation(computed) is not None:
            add("htmlir:transform-rotate")
        else:
            add("htmlir:transform-first-pass")
        origin = _diagnostic_value(computed.get("transformOrigin"))
        if origin and origin not in {"50%-50%-0px", "50%-50%", "center-center", "center"}:
            add("htmlir:transform-origin-first-pass")

    clip_value = str(computed.get("clip") or "").strip().lower()
    clip_path = str(computed.get("clipPath") or "").strip().lower()
    if (clip_value and clip_value not in {"auto", "none"}) or (clip_path and clip_path != "none"):
        add("htmlir:clip-path")
        add("htmlir:clip-path-first-pass")
        if "inset(" in clip_path:
            add("htmlir:clip-path-inset")
        elif "circle(" in clip_path or "ellipse(" in clip_path:
            add("htmlir:clip-path-ellipse")
        elif "polygon(" in clip_path:
            add("htmlir:clip-path-polygon")

    object_position = _diagnostic_value(computed.get("objectPosition"))
    if object_position and object_position not in {"50%-50%", "50%-50%-0px", "center-center", "center"}:
        add("htmlir:object-position")

    if _css_column_count(computed):
        add("htmlir:columns")
        add("htmlir:column-count")
    column_width = str(computed.get("columnWidth") or "").strip().lower()
    if column_width and column_width != "auto":
        add("htmlir:columns")
        add("htmlir:column-width-first-pass")
    if _has_css_gap_axis(computed.get("columnGap")):
        add("htmlir:column-gap")
    column_rule_style = str(computed.get("columnRuleStyle") or "").strip().lower()
    if column_rule_style and column_rule_style not in {"none", "hidden"} and _css_px(computed.get("columnRuleWidth")) > 0:
        add("htmlir:column-rule-first-pass")
    column_fill = _diagnostic_value(computed.get("columnFill"))
    if column_fill and column_fill not in {"balance", "auto"}:
        add("htmlir:column-fill-first-pass")
    column_span = _diagnostic_value(computed.get("columnSpan"))
    if column_span and column_span != "none":
        add("htmlir:column-span-first-pass")

    writing_mode = _diagnostic_value(computed.get("writingMode"))
    if writing_mode and writing_mode != "horizontal-tb":
        add("htmlir:writing-mode")
        add(f"htmlir:writing-mode-{writing_mode}")
    text_orientation = _diagnostic_value(computed.get("textOrientation"))
    if text_orientation and text_orientation != "mixed":
        add("htmlir:text-orientation")
        add(f"htmlir:text-orientation-{text_orientation}")

    animation_name = str(computed.get("animationName") or "").strip().lower()
    if animation_name and animation_name != "none":
        add("htmlir:animation-first-pass")
        add("htmlir:animation-static-capture")
    transition_duration = str(computed.get("transitionDuration") or "").strip().lower()
    transition_property = str(computed.get("transitionProperty") or "").strip().lower()
    if _css_time_list_has_duration(transition_duration) or (transition_property and transition_property not in {"all", "none"}):
        add("htmlir:transition-first-pass")
        add("htmlir:transition-static-capture")
    return diagnostics

_css_effect_layout_diagnostics.__module__ = 'pptx2html.htmlir.compiler'
