# Origin: schema_v4_fonts.py::_insert_embedded_font_list
from __future__ import annotations
from .shared import Any

def _insert_embedded_font_list(presentation_root: Any, embedded_list: Any) -> None:
    following = {
        "custShowLst",
        "photoAlbum",
        "custDataLst",
        "kinsoku",
        "defaultTextStyle",
        "modifyVerifier",
        "extLst",
    }
    for index, child in enumerate(presentation_root):
        if child.tag.rsplit("}", 1)[-1] in following:
            presentation_root.insert(index, embedded_list)
            return
    presentation_root.append(embedded_list)

_insert_embedded_font_list.__module__ = 'schema_v4_fonts'
