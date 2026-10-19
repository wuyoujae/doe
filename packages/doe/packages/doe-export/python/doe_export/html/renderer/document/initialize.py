# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer.__init__
from __future__ import annotations
from doe_export.html.renderer.shared import IRPresentation, Optional

def __init__(self, mode: str = "embedded", media_dir: str = "media"):
    self._mode = mode
    self._media_dir = media_dir
    self._image_counter = 0
    self._svg_counter = 0
    self._embedded_font_families: set[str] = set()
    self._media_write_dir: Optional[str] = None
    self._media_src_dir: Optional[str] = None
    # Set during render()
    self._ir: Optional[IRPresentation] = None
    self._slide_w: float = 0.0
    self._slide_h: float = 0.0

__init__.__module__ = 'pptx2html.renderer.html_renderer'
__init__.__qualname__ = 'HtmlRenderer.__init__'
