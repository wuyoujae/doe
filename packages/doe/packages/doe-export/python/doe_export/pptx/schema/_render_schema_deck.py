# Origin: schema_v4_export.py::_render_schema_deck
from __future__ import annotations
from .shared import Any, MAX_RENDERER_STDOUT_BYTES, RENDERER_CONTRACT, RUNTIME_ROOT, SchemaV4ExportError, json, os, subprocess
from ._node_executable import _node_executable
from .layout_error import layout_failure

def _render_schema_deck(
    deck: dict[str, Any],
    assets: dict[str, Any],
    *,
    timeout_seconds: int,
    include_screenshots: bool,
    include_stylesheet: bool,
    slide_indices: list[int] | None = None,
    total_slides: int | None = None,
    output_format: str | None = None,
    watermark_data_uri: str | None = None,
    flow_layout: dict[str, Any] | None = None,
) -> dict[str, Any]:
    script = RUNTIME_ROOT / "schema_v4_renderer.js"
    if not script.is_file():
        raise SchemaV4ExportError("Schema v4 renderer is not installed.")
    request = json.dumps(
        {
            "deck": deck,
            "assets": assets,
            "include_screenshots": include_screenshots,
            "include_stylesheet": include_stylesheet,
            **({"flow_layout": flow_layout} if flow_layout is not None else {}),
            **({"slide_indices": slide_indices} if slide_indices is not None else {}),
            **({"total_slides": total_slides} if total_slides is not None else {}),
            **({"output_format": output_format, "watermark_data_uri": watermark_data_uri} if output_format is not None else {}),
        },
        ensure_ascii=False,
        separators=(",", ":"),
    ).encode("utf-8")
    creation_flags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
    try:
        completed = subprocess.run(
            [_node_executable(), str(script)],
            input=request,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=str(RUNTIME_ROOT),
            timeout=max(30, timeout_seconds),
            check=False,
            creationflags=creation_flags,
        )
    except subprocess.TimeoutExpired as error:
        raise SchemaV4ExportError("Schema v4 browser rendering timed out.") from error
    if completed.returncode != 0:
        if len(completed.stdout) <= 4096:
            try:
                result = json.loads(completed.stdout)
            except (ValueError, UnicodeDecodeError):
                result = None
            failure = layout_failure(result, total_slides or len(deck.get("deck", {}).get("slides", [])))
            if failure:
                raise failure
        message = completed.stderr.decode("utf-8", errors="replace").strip()
        raise SchemaV4ExportError(
            f"Schema v4 browser rendering failed: {message[-2000:] or 'unknown error'}"
        )
    if len(completed.stdout) > MAX_RENDERER_STDOUT_BYTES:
        raise SchemaV4ExportError("Schema v4 browser rendering result is too large.")
    try:
        result = json.loads(completed.stdout.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise SchemaV4ExportError("Schema v4 browser renderer returned invalid JSON.") from error
    if not isinstance(result, dict) or result.get("success") is not True:
        raise SchemaV4ExportError("Schema v4 browser rendering did not complete.")
    if result.get("renderer_contract") != RENDERER_CONTRACT:
        raise SchemaV4ExportError("Schema v4 renderer contract does not match the server.")
    return result

_render_schema_deck.__module__ = 'schema_v4_export'
