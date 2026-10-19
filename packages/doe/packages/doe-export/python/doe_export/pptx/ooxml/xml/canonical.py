# Origin: pptx2html/server/ooxml_pptx_writer.py::canonical
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any

def canonical(value: Any) -> Any:
    if isinstance(value, dict):
        return {
            key: canonical(
                [
                    diagnostic
                    for diagnostic in item
                    if diagnostic != "htmlir:visual-layout-snapshot"
                ]
                if key == "diagnostics" and isinstance(item, list)
                else item
            )
            for key, item in sorted(value.items())
            if item is not None
            and key not in {
                "_yrkie_source_slide_index",
                "layout_snapshot",
                "layout_snapshot_dirty",
            }
        }
    if isinstance(value, list):
        return [canonical(item) for item in value]
    if isinstance(value, float):
        return round(value, 4)
    return value

canonical.__module__ = 'pptx2html.server.ooxml_pptx_writer'
