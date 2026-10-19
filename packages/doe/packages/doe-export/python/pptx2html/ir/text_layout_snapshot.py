"""Hash-bound text layout snapshots for editable PPTX export.

The semantic IR keeps only authored/native ``Run(kind="break")`` records.
Chromium soft wraps and authoritative no-wrap layouts live in
:class:`TextLayoutSnapshot` and are materialized on a temporary copy only after
both content and layout metrics still match.
"""

from __future__ import annotations

import copy
import dataclasses
import hashlib
import json
import math
import re
from collections.abc import Mapping, MutableMapping, Sequence
from typing import Any

from .model import TextLayoutSnapshot, TextLayoutSoftBreak


LAYOUT_SNAPSHOT_VERSION = 1
LAYOUT_SNAPSHOT_PROVIDER = "chromium"
NO_WRAP_LAYOUT_SNAPSHOT_PROVIDER = "deterministic-no-wrap"
_SUPPORTED_LAYOUT_SNAPSHOT_PROVIDERS = {
    LAYOUT_SNAPSHOT_PROVIDER,
    NO_WRAP_LAYOUT_SNAPSHOT_PROVIDER,
}

_SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
_FRAME_METRIC_KEYS = (
    "word_wrap",
    "white_space",
    "overflow_wrap",
    "word_break",
    "margins",
    "horizontal_overflow",
    "vertical_overflow",
    "vertical_text",
    "column_count",
    "column_spacing",
    "rtl_columns",
    "compatibility_line_spacing",
    "autofit_mode",
    "autofit_font_scale",
    "autofit_line_spacing_reduction",
    "text_warp",
)
_PARAGRAPH_METRIC_KEYS = (
    "level",
    "spacing_before",
    "spacing_after",
    "line_spacing_multiple",
    "line_spacing_pt",
    "line_spacing_type",
    "spacing_before_type",
    "spacing_after_type",
    "spacing_before_pct",
    "spacing_after_pct",
    "margin_left",
    "margin_right",
    "indent",
    "default_tab_size",
    "tab_stops",
    "font_align",
    "rtl",
    "ea_line_break",
    "latin_line_break",
    "hanging_punctuation",
)
_BULLET_METRIC_KEYS = (
    "kind",
    "char",
    "auto_number_scheme",
    "start_at",
    "font_family",
    "size_pct",
    "size_pt",
    "follows_text_size",
    "follows_text_font",
)
_FONT_METRIC_KEYS = (
    "family",
    "latin_family",
    "ea_family",
    "cs_family",
    "sym_family",
    "size_pt",
    "bold",
    "italic",
    "char_spacing_pt",
    "word_spacing_pt",
    "kerning_pt",
    "baseline",
    "lang",
    "alt_lang",
    "capitalization",
    "normalize_horizontal",
    "rtl",
)


class InvalidTextLayoutSnapshot(ValueError):
    """Raised by snapshot creation when its source coordinates are invalid."""


def make_text_container_metrics(
    width_pt: Any,
    height_pt: Any,
    *,
    kind: str = "shape",
    cell_margins: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Build the only supported external-metrics payload for snapshot hashes."""

    if kind not in {"shape", "table-cell"}:
        raise InvalidTextLayoutSnapshot(f"Unsupported text container kind: {kind}")
    width = _finite_positive_number(width_pt, "width_pt")
    height = _finite_positive_number(height_pt, "height_pt")
    result: dict[str, Any] = {"kind": kind, "width_pt": width, "height_pt": height}
    if kind == "table-cell":
        margins = _as_mapping(cell_margins or {})
        result["cell_margins"] = {
            side: margins.get(side)
            for side in ("left", "right", "top", "bottom")
            if margins.get(side) is not None
        }
    return _canonical_value(result)


def compute_layout_source_sha256(text_frame: Any) -> str:
    """Fingerprint paragraph/run text semantics, including authored breaks."""

    frame = _as_mapping(text_frame)
    paragraphs = []
    for paragraph_value in frame.get("paragraphs") or []:
        paragraph = _as_mapping(paragraph_value)
        runs = []
        for run_value in paragraph.get("runs") or []:
            run = _as_mapping(run_value)
            runs.append(
                {
                    "kind": str(run.get("kind") or "text"),
                    "text": str(run.get("text") or ""),
                    "field_id": run.get("field_id"),
                    "field_type": run.get("field_type"),
                }
            )
        paragraphs.append({"runs": runs})
    return _sha256({"paragraphs": paragraphs})


def compute_layout_metrics_sha256(
    text_frame: Any,
    *,
    container_metrics: Mapping[str, Any],
) -> str:
    """Fingerprint every IR value that can affect visual line geometry."""

    frame = _as_mapping(text_frame)
    metrics_frame = {key: frame.get(key) for key in _FRAME_METRIC_KEYS}
    metrics_paragraphs = []
    for paragraph_value in frame.get("paragraphs") or []:
        paragraph = _as_mapping(paragraph_value)
        paragraph_metrics = {key: paragraph.get(key) for key in _PARAGRAPH_METRIC_KEYS}
        if paragraph.get("bullet") is not None:
            bullet = _as_mapping(paragraph.get("bullet"))
            paragraph_metrics["bullet"] = {key: bullet.get(key) for key in _BULLET_METRIC_KEYS}
        if paragraph.get("end_para_font") is not None:
            paragraph_metrics["end_para_font"] = _font_metrics(paragraph.get("end_para_font"))
        paragraph_metrics["runs"] = [
            {"font": _font_metrics(_as_mapping(run).get("font") or {})}
            for run in paragraph.get("runs") or []
        ]
        metrics_paragraphs.append(paragraph_metrics)
    payload = {
        "container": _validated_container_metrics(container_metrics),
        "frame": metrics_frame,
        "paragraphs": metrics_paragraphs,
    }
    return _sha256(payload)


def create_layout_snapshot(
    text_frame: Any,
    soft_breaks: Sequence[Any],
    *,
    container_metrics: Mapping[str, Any],
    provider: str = LAYOUT_SNAPSHOT_PROVIDER,
) -> TextLayoutSnapshot:
    """Create a v1 snapshot after validating every UTF-16 run coordinate."""

    if provider not in _SUPPORTED_LAYOUT_SNAPSHOT_PROVIDERS:
        raise InvalidTextLayoutSnapshot(f"Unsupported layout snapshot provider: {provider}")
    normalized = _validated_soft_breaks(text_frame, soft_breaks)
    if provider == NO_WRAP_LAYOUT_SNAPSHOT_PROVIDER and (
        _as_mapping(text_frame).get("word_wrap") is not False or normalized
    ):
        raise InvalidTextLayoutSnapshot(
            "Deterministic no-wrap snapshots require word_wrap=false and no soft breaks"
        )
    return TextLayoutSnapshot(
        version=LAYOUT_SNAPSHOT_VERSION,
        provider=provider,
        source_sha256=compute_layout_source_sha256(text_frame),
        metrics_sha256=compute_layout_metrics_sha256(
            text_frame, container_metrics=container_metrics
        ),
        soft_breaks=[TextLayoutSoftBreak(**item) for item in normalized],
    )


def layout_snapshot_is_valid(
    text_frame: Any,
    *,
    container_metrics: Mapping[str, Any],
) -> bool:
    """Return whether a frame's snapshot is supported, intact, and current."""

    try:
        frame = _as_mapping(text_frame)
        if frame.get("layout_snapshot_dirty") is True:
            return False
        snapshot = _as_mapping(frame.get("layout_snapshot"))
        if snapshot.get("version") != LAYOUT_SNAPSHOT_VERSION:
            return False
        provider = snapshot.get("provider")
        if provider not in _SUPPORTED_LAYOUT_SNAPSHOT_PROVIDERS:
            return False
        source_hash = str(snapshot.get("source_sha256") or "").lower()
        metrics_hash = str(snapshot.get("metrics_sha256") or "").lower()
        if not _SHA256_RE.fullmatch(source_hash) or not _SHA256_RE.fullmatch(metrics_hash):
            return False
        if source_hash != compute_layout_source_sha256(frame):
            return False
        if metrics_hash != compute_layout_metrics_sha256(
            frame, container_metrics=container_metrics
        ):
            return False
        soft_breaks = _validated_soft_breaks(
            frame,
            snapshot.get("soft_breaks") or [],
        )
        if provider == NO_WRAP_LAYOUT_SNAPSHOT_PROVIDER and (
            frame.get("word_wrap") is not False or soft_breaks
        ):
            return False
        return True
    except (InvalidTextLayoutSnapshot, TypeError, ValueError, OverflowError):
        return False


def refresh_no_wrap_layout_snapshot(
    text_frame: Any,
    *,
    container_metrics: Mapping[str, Any],
) -> bool:
    """Attach an authoritative empty-soft-wrap snapshot to explicit no-wrap text.

    CSS transforms can make Chromium's axis-aligned visual-line measurement
    intentionally unreliable.  An explicit ``word_wrap=false`` frame has no
    browser-created soft line boundaries by definition, so its empty layout is
    deterministic and does not require geometry inspection.
    """

    try:
        if _as_mapping(text_frame).get("word_wrap") is not False:
            return False
        snapshot = create_layout_snapshot(
            text_frame,
            [],
            container_metrics=container_metrics,
            provider=NO_WRAP_LAYOUT_SNAPSHOT_PROVIDER,
        )
    except (InvalidTextLayoutSnapshot, TypeError, ValueError, OverflowError):
        return False

    if dataclasses.is_dataclass(text_frame) and not isinstance(text_frame, type):
        text_frame.layout_snapshot = snapshot
        text_frame.layout_snapshot_dirty = False
        return True
    if isinstance(text_frame, MutableMapping):
        text_frame["layout_snapshot"] = dataclasses.asdict(snapshot)
        text_frame["layout_snapshot_dirty"] = False
        return True
    return False


def materialize_layout_snapshot(
    text_frame: Any,
    *,
    container_metrics: Mapping[str, Any],
) -> dict[str, Any] | None:
    """Return a no-wrap temporary frame with derived breaks, or ``None``.

    The input frame is never mutated. Callers must use the original frame when
    ``None`` is returned so legacy and stale-snapshot behavior stays unchanged.
    """

    if not layout_snapshot_is_valid(text_frame, container_metrics=container_metrics):
        return None
    frame = copy.deepcopy(_as_mapping(text_frame))
    snapshot = _as_mapping(frame.get("layout_snapshot"))
    soft_breaks = _validated_soft_breaks(frame, snapshot.get("soft_breaks") or [])
    grouped: dict[tuple[int, int], list[int]] = {}
    for item in soft_breaks:
        grouped.setdefault((item["paragraph_index"], item["run_index"]), []).append(
            item["offset_utf16"]
        )

    for paragraph_index, paragraph in enumerate(frame.get("paragraphs") or []):
        runs = paragraph.get("runs") or []
        materialized_runs: list[dict[str, Any]] = []
        for run_index, run in enumerate(runs):
            offsets = grouped.get((paragraph_index, run_index))
            if not offsets:
                materialized_runs.append(run)
                continue
            text = str(run.get("text") or "")
            codepoint_offsets = [_utf16_offset_to_codepoint(text, offset) for offset in offsets]
            start = 0
            for end in codepoint_offsets:
                if end > start:
                    segment = copy.deepcopy(run)
                    segment["text"] = text[start:end]
                    materialized_runs.append(segment)
                materialized_runs.append(
                    {
                        "kind": "break",
                        "break_kind": "soft",
                        "text": "",
                        "font": copy.deepcopy(run.get("font") or {}),
                    }
                )
                start = end
            if start < len(text):
                segment = copy.deepcopy(run)
                segment["text"] = text[start:]
                materialized_runs.append(segment)
        paragraph["runs"] = materialized_runs
    frame["word_wrap"] = False
    return frame


def normalize_htmlir_export_line_edges(text_frame: Any) -> dict[str, Any]:
    """Remove collapsed HTML whitespace that DrawingML would render literally.

    Browsers discard collapsible spaces next to authored ``br`` elements.
    Canonical IR produced before that normalization was added can still contain
    those spaces, so trim them only for computed HTML text. Browser soft-wrap
    separators, imported PowerPoint text, and preserving CSS modes stay exact.
    """

    frame = _as_mapping(text_frame)
    provenance = {str(value) for value in frame.get("style_provenance") or []}
    white_space = str(frame.get("white_space") or "normal").strip().lower()
    if (
        "htmlir:computed-style" not in provenance
        or white_space in {"pre", "pre-wrap", "break-spaces"}
    ):
        return frame

    normalized = copy.deepcopy(frame)
    collapsible = " \t\r\n\f\v"
    for paragraph in normalized.get("paragraphs") or []:
        runs = paragraph.get("runs") or []
        authored_breaks = [
            index
            for index, run in enumerate(runs)
            if str(run.get("kind") or "text") == "break"
            and str(run.get("break_kind") or "authored") != "soft"
        ]
        for break_index in authored_breaks:
            for index in range(break_index - 1, -1, -1):
                kind = str(runs[index].get("kind") or "text")
                if kind == "break":
                    break
                if kind in {"text", "field"}:
                    runs[index]["text"] = str(runs[index].get("text") or "").rstrip(collapsible)
                    if runs[index]["text"]:
                        break
            for index in range(break_index + 1, len(runs)):
                kind = str(runs[index].get("kind") or "text")
                if kind == "break":
                    break
                if kind in {"text", "field"}:
                    runs[index]["text"] = str(runs[index].get("text") or "").lstrip(collapsible)
                    if runs[index]["text"]:
                        break
        for index, run in enumerate(runs):
            if str(run.get("kind") or "text") in {"text", "field"}:
                runs[index]["text"] = str(run.get("text") or "").lstrip(collapsible)
                if runs[index]["text"]:
                    break
        for index in range(len(runs) - 1, -1, -1):
            run = runs[index]
            if str(run.get("kind") or "text") in {"text", "field"}:
                runs[index]["text"] = str(run.get("text") or "").rstrip(collapsible)
                if runs[index]["text"]:
                    break
        paragraph["runs"] = [
            run
            for run in runs
            if str(run.get("kind") or "text") == "break" or run.get("text")
        ]
    return normalized


def _validated_soft_breaks(text_frame: Any, soft_breaks: Sequence[Any]) -> list[dict[str, int]]:
    frame = _as_mapping(text_frame)
    paragraphs = frame.get("paragraphs") or []
    result: list[dict[str, int]] = []
    seen_boundaries: set[tuple[int, int]] = set()
    for raw in soft_breaks:
        item = _as_mapping(raw)
        paragraph_index = _strict_nonnegative_int(item.get("paragraph_index"), "paragraph_index")
        run_index = _strict_nonnegative_int(item.get("run_index"), "run_index")
        offset_utf16 = _strict_nonnegative_int(item.get("offset_utf16"), "offset_utf16")
        if paragraph_index >= len(paragraphs):
            raise InvalidTextLayoutSnapshot("Soft break paragraph index is out of range")
        paragraph = _as_mapping(paragraphs[paragraph_index])
        runs = paragraph.get("runs") or []
        if run_index >= len(runs):
            raise InvalidTextLayoutSnapshot("Soft break run index is out of range")
        run = _as_mapping(runs[run_index])
        if str(run.get("kind") or "text") not in {"text", "field"}:
            raise InvalidTextLayoutSnapshot("Soft breaks may target only semantic text or field runs")
        text = str(run.get("text") or "")
        _utf16_offset_to_codepoint(text, offset_utf16)
        global_offset, canonical_run, canonical_offset = _paragraph_soft_break_boundary(
            paragraph,
            run_index,
            offset_utf16,
        )
        boundary_key = (paragraph_index, global_offset)
        if boundary_key in seen_boundaries:
            continue
        seen_boundaries.add(boundary_key)
        result.append(
            {
                "paragraph_index": paragraph_index,
                "run_index": canonical_run,
                "offset_utf16": canonical_offset,
            }
        )
    result.sort(key=lambda item: (item["paragraph_index"], item["run_index"], item["offset_utf16"]))
    return result


def _paragraph_soft_break_boundary(
    paragraph: Mapping[str, Any],
    target_run_index: int,
    target_offset: int,
) -> tuple[int, int, int]:
    spans: list[tuple[int, int, int]] = []
    authored_break_positions: set[int] = set()
    cursor = 0
    for run_index, raw_run in enumerate(paragraph.get("runs") or []):
        run = _as_mapping(raw_run)
        kind = str(run.get("kind") or "text")
        if kind == "break":
            authored_break_positions.add(cursor)
            continue
        length = _utf16_length(str(run.get("text") or ""))
        if kind in {"text", "field"} and length > 0:
            spans.append((cursor, cursor + length, run_index))
        if run_index == target_run_index:
            global_offset = cursor + target_offset
        cursor += length

    if "global_offset" not in locals():
        raise InvalidTextLayoutSnapshot("Soft break run index is out of range")
    if global_offset <= 0 or global_offset >= cursor:
        raise InvalidTextLayoutSnapshot("Soft breaks may not target paragraph boundaries")
    if global_offset in authored_break_positions:
        raise InvalidTextLayoutSnapshot("Soft break duplicates an authored line break")

    # A rich-run boundary has two equivalent coordinates. Canonicalize it to
    # the next semantic text run at offset zero; otherwise retain the run that
    # owns the interior boundary (or the preceding run end as a final fallback).
    next_span = next(
        (span for span in spans if span[0] == global_offset and span[1] > span[0]),
        None,
    )
    if next_span is not None:
        return global_offset, next_span[2], 0
    containing = next(
        (span for span in spans if span[0] < global_offset < span[1]),
        None,
    )
    if containing is not None:
        return global_offset, containing[2], global_offset - containing[0]
    previous_span = next(
        (span for span in reversed(spans) if span[1] == global_offset),
        None,
    )
    if previous_span is not None:
        return global_offset, previous_span[2], previous_span[1] - previous_span[0]
    raise InvalidTextLayoutSnapshot("Soft break does not resolve to a semantic text boundary")


def _utf16_offset_to_codepoint(text: str, offset: int) -> int:
    boundaries = {0: 0}
    utf16_offset = 0
    for index, character in enumerate(text):
        utf16_offset += 2 if ord(character) > 0xFFFF else 1
        boundaries[utf16_offset] = index + 1
    if offset not in boundaries:
        raise InvalidTextLayoutSnapshot("Soft break splits a UTF-16 surrogate pair or exceeds its run")
    return boundaries[offset]


def _utf16_length(text: str) -> int:
    return len(text.encode("utf-16-le")) // 2


def _font_metrics(value: Any) -> dict[str, Any]:
    font = _as_mapping(value)
    return {key: font.get(key) for key in _FONT_METRIC_KEYS}


def _validated_container_metrics(value: Mapping[str, Any]) -> dict[str, Any]:
    metrics = _as_mapping(value)
    return make_text_container_metrics(
        metrics.get("width_pt"),
        metrics.get("height_pt"),
        kind=str(metrics.get("kind") or ""),
        cell_margins=metrics.get("cell_margins"),
    )


def _as_mapping(value: Any) -> dict[str, Any]:
    if dataclasses.is_dataclass(value) and not isinstance(value, type):
        return dataclasses.asdict(value)
    if isinstance(value, Mapping):
        return dict(value)
    raise InvalidTextLayoutSnapshot("Text layout snapshot value must be an object")


def _strict_nonnegative_int(value: Any, name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise InvalidTextLayoutSnapshot(f"{name} must be a non-negative integer")
    return value


def _finite_positive_number(value: Any, name: str) -> float:
    if isinstance(value, bool):
        raise InvalidTextLayoutSnapshot(f"{name} must be a finite positive number")
    try:
        number = float(value)
    except (TypeError, ValueError) as error:
        raise InvalidTextLayoutSnapshot(f"{name} must be a finite positive number") from error
    if not math.isfinite(number) or number <= 0:
        raise InvalidTextLayoutSnapshot(f"{name} must be a finite positive number")
    return number


def _sha256(value: Any) -> str:
    encoded = json.dumps(
        _canonical_value(value),
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _canonical_value(value: Any) -> Any:
    if dataclasses.is_dataclass(value) and not isinstance(value, type):
        value = dataclasses.asdict(value)
    if isinstance(value, Mapping):
        return {
            str(key): _canonical_value(item)
            for key, item in sorted(value.items(), key=lambda pair: str(pair[0]))
            if item is not None
        }
    if isinstance(value, (list, tuple)):
        return [_canonical_value(item) for item in value]
    if isinstance(value, bool) or value is None or isinstance(value, str):
        return value
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        if not math.isfinite(value):
            raise InvalidTextLayoutSnapshot("Layout metric values must be finite")
        rounded = round(value, 6)
        return 0.0 if rounded == 0 else rounded
    raise InvalidTextLayoutSnapshot(f"Unsupported layout snapshot value: {type(value).__name__}")
