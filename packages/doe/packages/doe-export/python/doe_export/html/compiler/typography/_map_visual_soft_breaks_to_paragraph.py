# Origin: pptx2html/htmlir/compiler.py::_map_visual_soft_breaks_to_paragraph
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import TextFrame
from doe_export.html.compiler.typography._ValidatedVisualTextLayout import _ValidatedVisualTextLayout
from doe_export.html.compiler.typography._apply_text_transform import _apply_text_transform
from doe_export.html.compiler.typography._clean_inline_text import _clean_inline_text
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.document._utf16_length import _utf16_length

def _map_visual_soft_breaks_to_paragraph(
    node: dict[str, Any],
    text_frame: TextFrame,
    paragraph_index: int,
    layout: _ValidatedVisualTextLayout,
) -> list[dict[str, int]] | None:
    if paragraph_index < 0 or paragraph_index >= len(text_frame.paragraphs):
        return None
    records = node.get("richTextRuns")
    if not isinstance(records, list):
        return None
    target_runs = text_frame.paragraphs[paragraph_index].runs
    target_index = 0
    source_position = 0
    spans: list[tuple[int, int, int, str]] = []

    for record in records:
        if not isinstance(record, dict):
            return None
        while (
            target_index < len(target_runs)
            and target_runs[target_index].kind != "break"
            and not str(target_runs[target_index].text or "")
        ):
            target_index += 1
        kind = str(record.get("kind") or "text")
        if kind == "break":
            if (
                str(record.get("breakKind") or "line") != "line"
                or target_index >= len(target_runs)
                or target_runs[target_index].kind != "break"
            ):
                return None
            target_index += 1
            continue
        if kind != "text":
            return None

        source_value = str(record.get("text") or "")
        record_start = source_position
        source_position += len(source_value)
        computed = record.get("computed") if isinstance(record.get("computed"), dict) else _computed(node)
        processed = _clean_inline_text(source_value, computed)
        processed = _apply_text_transform(
            processed,
            computed.get("textTransform") or _computed(node).get("textTransform"),
        )
        # Snapshot coordinates refer to the DOM source stream. Any transform
        # that changes code-point coordinates is deliberately fail-closed.
        if processed != source_value:
            return None
        if target_index >= len(target_runs) or target_runs[target_index].kind == "break":
            if source_value.strip():
                return None
            continue
        target_run = target_runs[target_index]
        if target_run.kind not in {"text", "field"}:
            return None
        target_value = str(target_run.text or "")
        if target_value == source_value:
            content_start = 0
        else:
            content_start = source_value.find(target_value) if target_value else -1
            if (
                content_start < 0
                or source_value.find(target_value, content_start + 1) >= 0
                or source_value[:content_start].strip()
                or source_value[content_start + len(target_value) :].strip()
            ):
                return None
        spans.append(
            (
                record_start + content_start,
                record_start + content_start + len(target_value),
                target_index,
                target_value,
            )
        )
        target_index += 1

    while (
        target_index < len(target_runs)
        and target_runs[target_index].kind != "break"
        and not str(target_runs[target_index].text or "")
    ):
        target_index += 1
    if source_position != len(layout.source_text) or target_index != len(target_runs):
        return None

    mapped: list[dict[str, int]] = []
    for offset in layout.soft_break_offsets:
        candidates = [span for span in spans if span[0] < offset < span[1]]
        if not candidates:
            candidates = [span for span in spans if offset == span[0]]
        if not candidates:
            candidates = [span for span in spans if offset == span[1]]
        if len(candidates) != 1:
            return None
        start, end, run_index, run_text = candidates[0]
        local_offset = offset - start
        if local_offset < 0 or local_offset > end - start:
            return None
        mapped.append(
            {
                "paragraph_index": paragraph_index,
                "run_index": run_index,
                "offset_utf16": _utf16_length(run_text[:local_offset]),
            }
        )
    return mapped

_map_visual_soft_breaks_to_paragraph.__module__ = 'pptx2html.htmlir.compiler'
