# Origin: pptx2html/htmlir/compiler.py::_image_info_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import ImageInfo
from doe_export.html.compiler.shared import CSS_PX_TO_PT
from doe_export.html.compiler.css._css_float import _css_float
from doe_export.html.compiler.css._element_opacity import _element_opacity
from doe_export.html.compiler.assets._image_info_from_src import _image_info_from_src

def _image_info_from_node(node: dict[str, Any]) -> ImageInfo | None:
    attrs = node.get("attributes") if isinstance(node.get("attributes"), dict) else {}
    media = node.get("media") if isinstance(node.get("media"), dict) else {}
    src = media.get("currentSrc") or attrs.get("src")
    if not isinstance(src, str) or not src.strip():
        return None
    alpha = _element_opacity(node)
    image = _image_info_from_src(src, alpha)
    natural_width = _css_float(media.get("naturalWidth"), 0.0)
    natural_height = _css_float(media.get("naturalHeight"), 0.0)
    if image.intrinsic_width_pt is None and natural_width > 0:
        image.intrinsic_width_pt = natural_width * CSS_PX_TO_PT
    if image.intrinsic_height_pt is None and natural_height > 0:
        image.intrinsic_height_pt = natural_height * CSS_PX_TO_PT
    return image

_image_info_from_node.__module__ = 'pptx2html.htmlir.compiler'
