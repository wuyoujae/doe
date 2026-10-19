# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._font_scale
from __future__ import annotations
from doe_export.html.renderer.shared import Optional, TextFrame

@staticmethod
def _font_scale(tf: Optional[TextFrame]) -> float:
    if tf and tf.autofit_mode == "normal" and tf.autofit_font_scale:
        return tf.autofit_font_scale
    return 1.0

_font_scale.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_font_scale.__func__.__qualname__ = 'HtmlRenderer._font_scale'
