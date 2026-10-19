# Origin: pptx2html/server/ooxml_pptx_writer.py::normalized_track_sizes
from __future__ import annotations

def normalized_track_sizes(values: list[float] | None, count: int, fallback: float) -> list[float]:
    result = [float(value or 0) for value in (values or [])[:count]]
    while len(result) < count:
        result.append(fallback)
    return [value if value > 0 else fallback for value in result]

normalized_track_sizes.__module__ = 'pptx2html.server.ooxml_pptx_writer'
