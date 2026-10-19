# Origin: pptx2html/server/pptx_writer.py::_plain_text_frame
from __future__ import annotations
from doe_export.pptx.writer.shared import Any

def _plain_text_frame(text: str) -> dict[str, Any]:
    return {
        "word_wrap": True,
        "vertical_align": "mid",
        "margins": {"left": 5, "top": 3, "right": 5, "bottom": 3},
        "paragraphs": [{"alignment": "ctr", "runs": [{"text": text, "font": {"size_pt": 14, "color": "111111"}}]}],
    }

_plain_text_frame.__module__ = 'pptx2html.server.pptx_writer'
