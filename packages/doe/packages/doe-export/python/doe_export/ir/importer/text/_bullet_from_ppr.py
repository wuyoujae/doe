# Origin: pptx2html/ir/builder.py::PresentationBuilder._bullet_from_ppr
from __future__ import annotations
from doe_export.ir.importer.shared import BulletInfo, ET, NAMESPACE, Optional, percentage_to_float

def _bullet_from_ppr(self, p_pr: Optional[ET.Element]) -> Optional[BulletInfo]:
    if p_pr is None:
        return None
    _A = NAMESPACE.DML_MAIN
    bullet = BulletInfo()

    if p_pr.find(f"{{{_A}}}buNone") is not None:
        bullet.kind = "none"
        return bullet

    bu_char = p_pr.find(f"{{{_A}}}buChar")
    bu_auto = p_pr.find(f"{{{_A}}}buAutoNum")
    bu_blip = p_pr.find(f"{{{_A}}}buBlip")

    if bu_char is not None:
        bullet.kind = "char"
        bullet.char = bu_char.get("char")
    elif bu_auto is not None:
        bullet.kind = "auto"
        bullet.auto_number_scheme = bu_auto.get("type")
        bullet.start_at = self._optional_int(bu_auto.get("startAt"))
    elif bu_blip is not None:
        bullet.kind = "blip"
    else:
        return None

    bu_clr_tx = p_pr.find(f"{{{_A}}}buClrTx") is not None
    bu_sz_tx = p_pr.find(f"{{{_A}}}buSzTx") is not None
    bu_font_tx = p_pr.find(f"{{{_A}}}buFontTx") is not None

    bu_font = p_pr.find(f"{{{_A}}}buFont")
    bu_sz_pct = p_pr.find(f"{{{_A}}}buSzPct")
    bu_sz_pts = p_pr.find(f"{{{_A}}}buSzPts")
    bu_clr = p_pr.find(f"{{{_A}}}buClr")

    bullet.follows_text_color = bu_clr_tx or bu_clr is None
    bullet.follows_text_size = bu_sz_tx or (bu_sz_pct is None and bu_sz_pts is None)
    bullet.follows_text_font = bu_font_tx or bu_font is None

    if bu_font is not None:
        bullet.font_family = bu_font.get("typeface")

    if bu_sz_pct is not None:
        bullet.size_pct = percentage_to_float(bu_sz_pct.get("val"))
    if bu_sz_pts is not None:
        bullet.size_pt = self._centipoints_to_pt(bu_sz_pts.get("val"))

    if bu_clr is not None:
        solid = bu_clr.find(f"{{{_A}}}solidFill")
        if solid is not None:
            bullet.color = self._color_from_solid_fill(solid)

    return bullet

_bullet_from_ppr.__module__ = 'pptx2html.ir.builder'
_bullet_from_ppr.__qualname__ = 'PresentationBuilder._bullet_from_ppr'
