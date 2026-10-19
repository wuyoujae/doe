# Origin: pptx2html/htmlir/compiler.py::_validated_visual_text_layout
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import math
from doe_export.html.compiler.typography._ValidatedVisualTextLayout import _ValidatedVisualTextLayout
from doe_export.html.compiler.css._css_float import _css_float

def _validated_visual_text_layout(node: dict[str, Any]) -> _ValidatedVisualTextLayout | None:
    layout = node.get("visualTextLayout")
    records = node.get("richTextRuns")
    if not isinstance(layout, dict) or not isinstance(records, list):
        return None
    if layout.get("version") != 1 or layout.get("reliable") is not True:
        return None

    source_parts: list[str] = []
    authored_breaks: list[int] = []
    source_length = 0
    for record in records:
        if not isinstance(record, dict):
            return None
        kind = str(record.get("kind") or "text")
        if kind == "break":
            if str(record.get("breakKind") or "line") != "line":
                return None
            authored_breaks.append(source_length)
            continue
        if kind != "text":
            return None
        value = str(record.get("text") or "")
        source_parts.append(value)
        source_length += len(value)

    source_text = "".join(source_parts)
    if not source_text or layout.get("sourceText") != source_text:
        return None

    def offsets_from(value: Any) -> list[int] | None:
        if not isinstance(value, list):
            return None
        result: list[int] = []
        for item in value:
            if isinstance(item, bool) or not isinstance(item, int):
                return None
            if item <= 0 or item >= source_length:
                return None
            if result and item <= result[-1]:
                return None
            result.append(item)
        return result

    declared_authored = offsets_from(layout.get("authoredBreakOffsets"))
    soft_breaks = offsets_from(layout.get("softBreakOffsets"))
    if declared_authored is None or soft_breaks is None or declared_authored != authored_breaks:
        return None
    if set(declared_authored).intersection(soft_breaks):
        return None

    lines = layout.get("lines")
    if not isinstance(lines, list) or not lines:
        return None
    line_boundaries: list[int] = []
    previous_end: int | None = None
    for index, line in enumerate(lines):
        if not isinstance(line, dict):
            return None
        start = line.get("start")
        end = line.get("end")
        if (
            isinstance(start, bool)
            or isinstance(end, bool)
            or not isinstance(start, int)
            or not isinstance(end, int)
            or start < 0
            or end > source_length
            or start >= end
            or (previous_end is not None and start != previous_end)
        ):
            return None
        if index == 0 and start != 0:
            return None
        rect = line.get("rect")
        if not isinstance(rect, dict):
            return None
        rect_values = [_css_float(rect.get(key), math.nan) for key in ("left", "top", "width", "height")]
        if not all(math.isfinite(value) for value in rect_values) or rect_values[2] <= 0 or rect_values[3] <= 0:
            return None
        if index > 0:
            line_boundaries.append(start)
        previous_end = end
    if previous_end != source_length:
        return None
    expected_boundaries = sorted([*declared_authored, *soft_breaks])
    if line_boundaries != expected_boundaries:
        return None
    return _ValidatedVisualTextLayout(
        source_text=source_text,
        authored_break_offsets=tuple(declared_authored),
        soft_break_offsets=tuple(soft_breaks),
    )

_validated_visual_text_layout.__module__ = 'pptx2html.htmlir.compiler'
