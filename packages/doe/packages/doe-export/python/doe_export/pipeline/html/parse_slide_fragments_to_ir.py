# Origin: pptx_pipeline.py::parse_slide_fragments_to_ir
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import HtmlCompileError, compile_slide_fragments
from doe_export.pipeline.html.normalize_slide_fragment import normalize_slide_fragment
from doe_export.pipeline.html.parse_html_to_ir import parse_html_to_ir

def parse_slide_fragments_to_ir(items: list[dict[str, Any]], **options: Any) -> list[dict[str, Any]]:
    """Compile validated Slide Agent fragments in one Chromium batch."""

    normalized_items: list[dict[str, Any]] = []
    normalized_positions: list[int] = []
    results: list[dict[str, Any] | None] = [None] * len(items)
    for position, item in enumerate(items):
        item_id = str(item.get("id") or position) if isinstance(item, dict) else str(position)
        if not isinstance(item, dict):
            results[position] = {
                "id": item_id,
                "success": False,
                "error": "Each slide compile item must be an object.",
                "error_kind": "content",
            }
            continue
        fragment = item.get("fragment")
        if isinstance(fragment, str) and "data-pptx2html-canonical" in fragment.lower():
            try:
                canonical_options = dict(options)
                canonical_options.pop("concurrency", None)
                canonical_options["viewport"] = (1280, 720)
                compiled = parse_html_to_ir(
                    fragment,
                    slide_index=int(item.get("slide_index") or position),
                    **canonical_options,
                )
                compiled["id"] = item_id
                results[position] = compiled
            except Exception as error:
                diagnostics = (
                    [item.to_dict() for item in error.diagnostics]
                    if isinstance(error, HtmlCompileError)
                    else []
                )
                detailed_error = next(
                    (
                        item["message"]
                        for item in diagnostics
                        if item.get("severity") == "error" and item.get("message")
                    ),
                    str(error),
                )
                results[position] = {
                    "id": item_id,
                    "success": False,
                    "error": detailed_error,
                    "error_kind": (
                        "runtime" if isinstance(error, HtmlCompileError) else "content"
                    ),
                    "diagnostics": diagnostics,
                }
            continue
        try:
            normalized_items.append({**item, "fragment": normalize_slide_fragment(fragment)})
            normalized_positions.append(position)
        except ValueError as error:
            results[position] = {
                "id": item_id,
                "success": False,
                "error": str(error),
                "error_kind": "content",
            }

    if normalized_items:
        compiled = compile_slide_fragments(normalized_items, **options)
        for position, result in zip(normalized_positions, compiled, strict=True):
            results[position] = result
    return [
        result
        or {
            "id": str(position),
            "success": False,
            "error": "Compilation failed.",
            "error_kind": "runtime",
        }
        for position, result in enumerate(results)
    ]

parse_slide_fragments_to_ir.__module__ = 'pptx_pipeline'
