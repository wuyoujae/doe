# Origin: pptx2html/ir/builder.py::PresentationBuilder._text_body_props
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional, emu_to_pt, parse_bool, percentage_to_float

def _text_body_props(self, body_pr: Optional[ET.Element]) -> dict:
    if body_pr is None:
        return {}

    _A = NAMESPACE.DML_MAIN
    props: dict = {
        "vertical_align": body_pr.get("anchor"),
        "horizontal_overflow": body_pr.get("horzOverflow"),
        "vertical_overflow": body_pr.get("vertOverflow"),
        "vertical_text": body_pr.get("vert"),
        "rotation": self._angle_to_degrees(body_pr.get("rot")),
        "anchor_center": parse_bool(body_pr.get("anchorCtr")),
        "column_count": self._positive_int(body_pr.get("numCol"), 1)
        if body_pr.get("numCol") is not None
        else None,
        "column_spacing": emu_to_pt(body_pr.get("spcCol")),
        "rtl_columns": parse_bool(body_pr.get("rtlCol")),
        "compatibility_line_spacing": parse_bool(body_pr.get("compatLnSpc")),
        "diagnostics": [],
    }

    if body_pr.find(f"{{{_A}}}noAutofit") is not None:
        props["autofit_mode"] = "none"
    elif (norm := body_pr.find(f"{{{_A}}}normAutofit")) is not None:
        props["autofit_mode"] = "normal"
        props["autofit_font_scale"] = percentage_to_float(
            norm.get("fontScale") or "100000"
        )
        props["autofit_line_spacing_reduction"] = percentage_to_float(
            norm.get("lnSpcReduction") or "0"
        )
    elif body_pr.find(f"{{{_A}}}spAutoFit") is not None:
        props["autofit_mode"] = "shape"

    warp = body_pr.find(f"{{{_A}}}prstTxWarp")
    if warp is not None:
        props["text_warp"] = warp.get("prst")

    return props

_text_body_props.__module__ = 'pptx2html.ir.builder'
_text_body_props.__qualname__ = 'PresentationBuilder._text_body_props'
