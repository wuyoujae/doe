# Origin: pptx2html/ir/builder.py::PresentationBuilder._emf2svg_executable
from __future__ import annotations
from doe_export.ir.importer.shared import Optional, Path, _EMF2SVG_DEFAULT_EXECUTABLE, _EMF2SVG_EXECUTABLE_ENV, os

@staticmethod
def _emf2svg_executable() -> Optional[Path]:
    runtime_environment = os.environ.get("YRKIE_ENVIRONMENT", "").strip().lower()
    if runtime_environment in {"development", "test"}:
        configured = os.environ.get(
            _EMF2SVG_EXECUTABLE_ENV,
            _EMF2SVG_DEFAULT_EXECUTABLE,
        )
    else:
        configured = _EMF2SVG_DEFAULT_EXECUTABLE
    if not configured or "\x00" in configured:
        return None
    candidate = Path(configured)
    if not candidate.is_absolute():
        return None
    try:
        resolved = candidate.resolve(strict=True)
    except (OSError, RuntimeError):
        return None
    if not resolved.is_file() or not os.access(resolved, os.X_OK):
        return None
    return resolved

_emf2svg_executable.__func__.__module__ = 'pptx2html.ir.builder'
_emf2svg_executable.__func__.__qualname__ = 'PresentationBuilder._emf2svg_executable'
