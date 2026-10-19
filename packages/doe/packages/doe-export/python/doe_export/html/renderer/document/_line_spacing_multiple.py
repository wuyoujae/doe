# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._line_spacing_multiple
from __future__ import annotations
from doe_export.html.renderer.shared import Optional, TextFrame

@staticmethod
def _line_spacing_multiple(para, tf: Optional[TextFrame]) -> Optional[float]:
    multiple = para.line_spacing_multiple
    if (
        multiple is not None
        and para.line_spacing_type == "percent"
        and tf
        and tf.autofit_mode == "normal"
        and tf.autofit_line_spacing_reduction
    ):
        return max(0.1, multiple - tf.autofit_line_spacing_reduction)
    return multiple

_line_spacing_multiple.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_line_spacing_multiple.__func__.__qualname__ = 'HtmlRenderer._line_spacing_multiple'
