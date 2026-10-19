# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer.render_to_file
from __future__ import annotations
from doe_export.html.renderer.shared import IRPresentation, os

def render_to_file(self, ir: IRPresentation, output_path: str) -> None:
    """Render *ir* to an HTML file, optionally writing media to disk."""
    old_write_dir = self._media_write_dir
    old_src_dir = self._media_src_dir

    if self._mode == "file" and not os.path.isabs(self._media_dir):
        output_dir = os.path.dirname(os.path.abspath(output_path)) or "."
        self._media_write_dir = os.path.join(output_dir, self._media_dir)
        self._media_src_dir = self._media_dir.replace("\\", "/")

    html_text = self.render(ir)

    self._media_write_dir = old_write_dir
    self._media_src_dir = old_src_dir

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_text)

render_to_file.__module__ = 'pptx2html.renderer.html_renderer'
render_to_file.__qualname__ = 'HtmlRenderer.render_to_file'
