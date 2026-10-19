# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._text_frame_style
from __future__ import annotations
from doe_export.html.renderer.shared import TextFrame

def _text_frame_style(self, tf: TextFrame) -> list[str]:
    styles: list[str] = []
    va = self._normalized_text_anchor(tf.vertical_align)
    if va == "mid":
        styles.append("justify-content:center")
    elif va == "bot":
        styles.append("justify-content:flex-end")
    else:
        styles.append("justify-content:flex-start")

    if tf.margins:
        m = tf.margins
        if tf.anchor_center:
            horizontal = ((m.get("left") or 0) + (m.get("right") or 0)) / 2
            vertical = ((m.get("top") or 0) + (m.get("bottom") or 0)) / 2
            m = {
                "left": horizontal,
                "right": horizontal,
                "top": vertical,
                "bottom": vertical,
            }
        parts = []
        for key in ("top", "right", "bottom", "left"):
            val = m.get(key)
            if val is not None:
                parts.append(f"{val:.2f}pt")
            else:
                parts.append("0pt")
        styles.append(f"padding:{' '.join(parts)}")

    styles.append("overflow:visible")
    clip_x = tf.horizontal_overflow == "clip"
    clip_y = tf.vertical_overflow == "clip"
    if clip_x or clip_y:
        free = "-100000px"
        top = "0" if clip_y else free
        right = "0" if clip_x else free
        bottom = "0" if clip_y else free
        left = "0" if clip_x else free
        styles.append(f"clip-path:inset({top} {right} {bottom} {left})")

    if tf.vertical_text and tf.vertical_text not in ("horz", "wordArtVert"):
        styles.append("writing-mode:vertical-rl")

    if tf.rotation:
        styles.append(f"transform:rotate({float(tf.rotation):.4f}deg)")
        styles.append("transform-origin:center center")

    if tf.column_count and tf.column_count > 1:
        styles.append(f"column-count:{int(tf.column_count)}")
        if tf.column_spacing is not None:
            styles.append(f"column-gap:{tf.column_spacing:.2f}pt")
        if tf.rtl_columns:
            styles.append("direction:rtl")

    return styles

_text_frame_style.__module__ = 'pptx2html.renderer.html_renderer'
_text_frame_style.__qualname__ = 'HtmlRenderer._text_frame_style'
