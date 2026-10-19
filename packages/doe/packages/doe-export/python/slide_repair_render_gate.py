from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path
from typing import Any

from schema_v4_export import _node_executable


RUNTIME_ROOT = Path(__file__).resolve().parent
RENDER_GATE_CONTRACT = "yrkie-slide-repair-render-gate-v1"
MAX_RENDER_GATE_OUTPUT_BYTES = 2 * 1024 * 1024
MAX_SLIDES = 200


class SlideRepairRenderGateError(ValueError):
    pass


def validate_slide_repair_deck(deck: dict[str, Any]) -> dict[str, Any]:
    deck_body = deck.get("deck")
    slides = deck_body.get("slides") if isinstance(deck_body, dict) else None
    if int(deck.get("version") or 0) != 4 or not isinstance(slides, list):
        raise SlideRepairRenderGateError("Slide repair validation requires a Schema v4 Deck.")
    if not 1 <= len(slides) <= MAX_SLIDES or any(
        not isinstance(slide, dict) for slide in slides
    ):
        raise SlideRepairRenderGateError("Slide repair validation received an invalid page set.")

    script = RUNTIME_ROOT / "slide_repair_render_gate.js"
    if not script.is_file():
        raise SlideRepairRenderGateError("Slide repair renderer is not installed.")
    request = json.dumps(
        {"deck": deck}, ensure_ascii=False, separators=(",", ":")
    ).encode("utf-8")
    creation_flags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
    try:
        completed = subprocess.run(
            [_node_executable(), str(script)],
            input=request,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=str(RUNTIME_ROOT),
            timeout=90,
            check=False,
            creationflags=creation_flags,
        )
    except subprocess.TimeoutExpired as error:
        raise SlideRepairRenderGateError("Slide repair browser validation timed out.") from error
    if len(completed.stdout) > MAX_RENDER_GATE_OUTPUT_BYTES:
        raise SlideRepairRenderGateError("Slide repair renderer output is too large.")
    if completed.returncode not in {0, 2}:
        raise SlideRepairRenderGateError("Slide repair browser validation failed.")
    try:
        report = json.loads(completed.stdout.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise SlideRepairRenderGateError("Slide repair renderer returned invalid JSON.") from error
    if (
        not isinstance(report, dict)
        or report.get("contract") != RENDER_GATE_CONTRACT
        or not isinstance(report.get("success"), bool)
        or not isinstance(report.get("pages"), list)
        or len(report["pages"]) != len(slides)
    ):
        raise SlideRepairRenderGateError("Slide repair renderer contract does not match the server.")
    return report


__all__ = [
    "SlideRepairRenderGateError",
    "validate_slide_repair_deck",
]
