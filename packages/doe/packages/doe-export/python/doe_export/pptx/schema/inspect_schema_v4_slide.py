"""Private single-page visual inspection; no export or source mutation."""
from __future__ import annotations

import base64
import io
import json
import os
from pathlib import Path
import signal
import subprocess
import tempfile
import time
from typing import Callable

from PIL import Image
from .shared import RENDERER_CONTRACT, RUNTIME_ROOT
from ._node_executable import _node_executable
from ._validate_deck import _validate_deck

MAX_PNG_BYTES = 6 * 1024 * 1024
MAX_REPORT_BYTES = 64 * 1024
MAX_RESULT_BYTES = MAX_PNG_BYTES * 4 // 3 + MAX_REPORT_BYTES + 4096


class SlideInspectionError(ValueError):
    def __init__(self, code: str = "doe_preview_unavailable"):
        self.code = code if isinstance(code, str) and code in {"doe_preview_invalid_request", "doe_preview_timeout", "doe_preview_cancelled", "doe_preview_assets_unavailable", "doe_preview_invalid_result", "doe_preview_renderer_mismatch"} else "doe_preview_unavailable"
        super().__init__(self.code)


def _validate_result(result: object, page_number: int) -> dict:
    try:
        if not isinstance(result, dict) or result.get("success") is not True or result.get("page_number") != page_number:
            raise ValueError()
        if result.get("renderer_contract") != RENDERER_CONTRACT:
            raise SlideInspectionError("doe_preview_renderer_mismatch")
        report = result.get("report")
        if not isinstance(report, dict) or not isinstance(report.get("fits"), bool) or len(json.dumps(report).encode()) > MAX_REPORT_BYTES:
            raise ValueError()
        encoded = result.get("png_base64")
        if not isinstance(encoded, str) or len(encoded) > MAX_PNG_BYTES * 4 // 3 + 4:
            raise ValueError()
        png = base64.b64decode(encoded, validate=True)
        if not png.startswith(b"\x89PNG\r\n\x1a\n") or len(png) > MAX_PNG_BYTES:
            raise ValueError()
        with Image.open(io.BytesIO(png)) as image:
            if image.format != "PNG" or min(image.size) < 1 or max(image.size) > 2048 or image.width * image.height > 4_000_000:
                raise ValueError()
            image.verify()
        return result
    except SlideInspectionError:
        raise
    except (ValueError, TypeError, OSError, KeyError):
        raise SlideInspectionError("doe_preview_invalid_result") from None


def _stop(process: subprocess.Popen, cancellation_file: Path) -> None:
    if process.poll() is not None:
        return
    # Let Node close its own Chromium instance before the bounded hard fallback.
    cancellation_file.touch()
    try:
        process.wait(timeout=2)
    except subprocess.TimeoutExpired:
        if os.name == "nt":
            subprocess.run(["taskkill", "/PID", str(process.pid), "/T", "/F"], stdout=subprocess.DEVNULL,
                           stderr=subprocess.DEVNULL, creationflags=subprocess.CREATE_NO_WINDOW, timeout=3, check=False)
        else:
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
        process.wait(timeout=3)


def inspect_schema_v4_slide(deck: dict, *, assets: dict | None = None, page_number: int = 1,
                            total_slides: int = 1, cancelled: Callable[[], bool] = lambda: False,
                            timeout_seconds: float = 45) -> dict:
    try:
        if not isinstance(deck, dict):
            raise ValueError()
        slides = _validate_deck(deck)
        if len(slides) != 1 or type(page_number) is not int or type(total_slides) is not int or not 1 <= page_number <= total_slides <= 300:
            raise ValueError()
        if assets is not None and not isinstance(assets, dict):
            raise ValueError()
        if any(not isinstance(value, dict) or value.get("is_fallback") is True for value in (assets or {}).values()):
            raise SlideInspectionError("doe_preview_assets_unavailable")
    except SlideInspectionError:
        raise
    except (ValueError, TypeError):
        raise SlideInspectionError("doe_preview_invalid_request") from None
    if cancelled():
        raise SlideInspectionError("doe_preview_cancelled")
    deadline = time.monotonic() + min(45, max(.01, timeout_seconds))
    with tempfile.TemporaryDirectory(prefix="yrkie-doe-inspect-") as directory:
        folder = Path(directory)
        cancellation_file = folder / "cancel"
        request = {"deck": deck, "assets": assets or {}, "output_format": "inspect", "page_number": page_number,
                   "total_slides": total_slides, "cancellation_file": str(cancellation_file)}
        data = json.dumps(request, ensure_ascii=False, separators=(",", ":")).encode()
        if len(data) > 48 * 1024 * 1024:
            raise SlideInspectionError("doe_preview_invalid_request")
        source, target, error = folder / "input.json", folder / "output.json", folder / "stderr.log"
        source.write_bytes(data)
        with source.open("rb") as stdin, target.open("wb") as stdout, error.open("wb") as stderr:
            process = subprocess.Popen([_node_executable(), str(RUNTIME_ROOT / "schema_v4_renderer.js")], stdin=stdin,
                stdout=stdout, stderr=stderr, cwd=RUNTIME_ROOT, start_new_session=os.name != "nt",
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0)
            try:
                while process.poll() is None:
                    if cancelled():
                        raise SlideInspectionError("doe_preview_cancelled")
                    if time.monotonic() >= deadline:
                        raise SlideInspectionError("doe_preview_timeout")
                    if target.stat().st_size > MAX_RESULT_BYTES or error.stat().st_size > 1024 * 1024:
                        raise SlideInspectionError("doe_preview_invalid_result")
                    time.sleep(.05)
                if cancelled():
                    raise SlideInspectionError("doe_preview_cancelled")
                if process.returncode and target.stat().st_size <= 4096:
                    try:
                        failure = json.loads(target.read_bytes())
                    except (ValueError, UnicodeError):
                        failure = None
                    if isinstance(failure, dict) and failure.get("success") is False:
                        raise SlideInspectionError(failure.get("code"))
                if process.returncode or target.stat().st_size > MAX_RESULT_BYTES:
                    raise SlideInspectionError()
            finally:
                _stop(process, cancellation_file)
        try:
            result = json.loads(target.read_bytes())
        except (ValueError, UnicodeError):
            raise SlideInspectionError("doe_preview_invalid_result") from None
        return _validate_result(result, page_number)
