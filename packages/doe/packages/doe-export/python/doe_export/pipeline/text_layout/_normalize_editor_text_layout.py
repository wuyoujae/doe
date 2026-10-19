# Origin: pptx_pipeline.py::_normalize_editor_text_layout
from __future__ import annotations
from doe_export.pipeline.shared import CanonicalHtmlRenderer, _LOGGER, layout_snapshot_is_valid, refresh_no_wrap_layout_snapshot
from doe_export.pipeline.text_layout._canonical_text_layout_targets import _canonical_text_layout_targets
from doe_export.pipeline.text_layout._text_layout_requires_normalization import _text_layout_requires_normalization

def _normalize_editor_text_layout(presentation):
    """Refresh only dirty or stale HTML-authored text layout snapshots.

    Chromium failure must never make editor persistence fail or retain an old
    snapshot. Unsupported frames remain semantically editable and dirty so a
    later save can retry normalization.
    """

    targets = _canonical_text_layout_targets(presentation)
    candidate_keys = set()
    normalized_frame_count = 0
    for key, (text_frame, container_metrics) in targets.items():
        if not _text_layout_requires_normalization(text_frame, container_metrics):
            continue
        if container_metrics is not None and refresh_no_wrap_layout_snapshot(
            text_frame,
            container_metrics=container_metrics,
        ):
            normalized_frame_count += 1
            continue
        candidate_keys.add(key)
    if not candidate_keys:
        return presentation, normalized_frame_count, 0

    source = CanonicalHtmlRenderer(mode="embedded").render(presentation)
    try:
        from pptx2html.htmlir.compiler import normalize_canonical_text_layout

        normalized, _patched_frame_count = normalize_canonical_text_layout(
            source,
            presentation,
        )
    except Exception as error:
        _LOGGER.warning(
            "Chromium text layout normalization failed closed (%s).",
            type(error).__name__,
        )
        normalized = presentation

    unresolved = 0
    normalized_targets = _canonical_text_layout_targets(normalized)
    for key in candidate_keys:
        target = normalized_targets.get(key)
        if target is None:
            unresolved += 1
            continue
        text_frame, container_metrics = target
        if (
            container_metrics is not None
            and layout_snapshot_is_valid(
                text_frame,
                container_metrics=container_metrics,
            )
        ):
            normalized_frame_count += 1
            continue
        text_frame.layout_snapshot = None
        text_frame.layout_snapshot_dirty = True
        unresolved += 1
    return normalized, normalized_frame_count, unresolved

_normalize_editor_text_layout.__module__ = 'pptx_pipeline'
