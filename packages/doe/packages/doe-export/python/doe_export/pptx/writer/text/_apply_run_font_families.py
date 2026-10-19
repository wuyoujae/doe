# Origin: pptx2html/server/pptx_writer.py::_apply_run_font_families
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import OxmlElement, qn

def _apply_run_font_families(run, font: dict[str, Any]) -> None:
    r_pr = run._r.get_or_add_rPr()
    family = font.get("family")
    slots = {
        "latin": font.get("latin_family") or family or run.font.name,
        "ea": font.get("ea_family") or family,
        "cs": font.get("cs_family"),
        "sym": font.get("sym_family"),
    }
    for tag, typeface in slots.items():
        if not typeface:
            continue
        node = r_pr.find(qn(f"a:{tag}"))
        if node is None:
            node = OxmlElement(f"a:{tag}")
            r_pr.append(node)
        node.set("typeface", str(typeface))

_apply_run_font_families.__module__ = 'pptx2html.server.pptx_writer'
