# Origin: pptx2html/ir/builder.py::PresentationBuilder._normalize_svg_intrinsic_size
from __future__ import annotations
from doe_export.ir.importer.shared import re

@staticmethod
def _normalize_svg_intrinsic_size(blob: bytes) -> bytes:
    try:
        text = blob.decode("utf-8-sig")
    except UnicodeDecodeError:
        return blob

    tag_match = re.search(r"<svg\b[^>]*>", text, flags=re.IGNORECASE)
    if tag_match is None:
        return blob
    tag = tag_match.group(0)
    if re.search(r"\swidth\s*=", tag, flags=re.IGNORECASE) and re.search(
        r"\sheight\s*=", tag, flags=re.IGNORECASE
    ):
        return blob

    view_box = re.search(r"\sviewBox\s*=\s*(['\"])(.*?)\1", tag, flags=re.IGNORECASE)
    if view_box is None:
        return blob
    parts = re.split(r"[\s,]+", view_box.group(2).strip())
    if len(parts) != 4:
        return blob
    try:
        width = float(parts[2])
        height = float(parts[3])
    except ValueError:
        return blob
    if width <= 0 or height <= 0:
        return blob

    def fmt(value: float) -> str:
        return str(int(value)) if value.is_integer() else f"{value:g}"

    attrs = ""
    if not re.search(r"\swidth\s*=", tag, flags=re.IGNORECASE):
        attrs += f' width="{fmt(width)}"'
    if not re.search(r"\sheight\s*=", tag, flags=re.IGNORECASE):
        attrs += f' height="{fmt(height)}"'
    if not attrs:
        return blob

    replacement = tag[:-1] + attrs + ">"
    text = text[: tag_match.start()] + replacement + text[tag_match.end() :]
    return text.encode("utf-8")

_normalize_svg_intrinsic_size.__func__.__module__ = 'pptx2html.ir.builder'
_normalize_svg_intrinsic_size.__func__.__qualname__ = 'PresentationBuilder._normalize_svg_intrinsic_size'
