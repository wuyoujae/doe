# Origin: pptx2html/server/pptx_writer.py::_apply_gradient_fill
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import OxmlElement
from doe_export.pptx.writer.xml._append_srgb import _append_srgb
from doe_export.pptx.writer.xml._clean_hex import _clean_hex
from doe_export.pptx.writer.shape._clear_fill_children import _clear_fill_children
from doe_export.pptx.writer.shape._gradient_angle_to_ooxml import _gradient_angle_to_ooxml
from doe_export.pptx.writer.xml._percent_to_ooxml import _percent_to_ooxml
from doe_export.pptx.writer.shape._shape_sp_pr import _shape_sp_pr
from doe_export.pptx.writer.xml._stop_pos_to_ooxml import _stop_pos_to_ooxml

def _apply_gradient_fill(pptx_shape, fill: dict[str, Any]) -> bool:
    stops = fill.get("gradient_stops") or []
    normalized_stops: list[tuple[int, str, Any]] = []
    for stop in stops:
        if not isinstance(stop, dict):
            continue
        color = _clean_hex(stop.get("color")) or _clean_hex(fill.get("color"))
        if not color:
            continue
        normalized_stops.append((_stop_pos_to_ooxml(stop.get("position")), color, stop.get("alpha")))
    if not normalized_stops:
        color = _clean_hex(fill.get("color"))
        if not color:
            return False
        normalized_stops = [(0, color, fill.get("alpha")), (100000, color, fill.get("alpha"))]

    sp_pr = _shape_sp_pr(pptx_shape)
    _clear_fill_children(sp_pr)
    grad_fill = OxmlElement("a:gradFill")
    grad_fill.set("rotWithShape", "1" if fill.get("gradient_rotate_with_shape", True) is not False else "0")
    gs_lst = OxmlElement("a:gsLst")
    for pos, color, alpha in sorted(normalized_stops, key=lambda item: item[0]):
        gs = OxmlElement("a:gs")
        gs.set("pos", str(pos))
        _append_srgb(gs, color, alpha)
        gs_lst.append(gs)
    grad_fill.append(gs_lst)
    if fill.get("gradient_path"):
        path = OxmlElement("a:path")
        path.set("path", str(fill.get("gradient_path") or "circle"))
        fill_rect_attrs: dict[str, str] = {}
        for key, attr in (
            ("gradient_fill_to_left", "l"),
            ("gradient_fill_to_right", "r"),
            ("gradient_fill_to_top", "t"),
            ("gradient_fill_to_bottom", "b"),
        ):
            if fill.get(key) is not None:
                fill_rect_attrs[attr] = str(_percent_to_ooxml(fill.get(key)))
        if fill_rect_attrs:
            fill_to_rect = OxmlElement("a:fillToRect")
            for attr, value in fill_rect_attrs.items():
                fill_to_rect.set(attr, value)
            path.append(fill_to_rect)
        grad_fill.append(path)
    else:
        lin = OxmlElement("a:lin")
        lin.set("ang", str(_gradient_angle_to_ooxml(fill.get("gradient_angle"))))
        lin.set("scaled", "1")
        grad_fill.append(lin)
    sp_pr.append(grad_fill)
    return True

_apply_gradient_fill.__module__ = 'pptx2html.server.pptx_writer'
