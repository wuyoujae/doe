# Origin: pptx2html/ir/builder.py::PresentationBuilder._parse_border
from __future__ import annotations
from doe_export.ir.importer.shared import Border, ET, NAMESPACE, Optional, emu_to_pt, local_name

def _parse_border(self, container: Optional[ET.Element]) -> Optional[Border]:
    if container is None:
        return None
    _A = NAMESPACE.DML_MAIN
    ln = container.find(f"{{{_A}}}ln")
    if ln is None:
        return None
    if ln.find(f"{{{_A}}}noFill") is not None:
        return Border(width=emu_to_pt(ln.get("w")), no_fill=True)

    width_emu = ln.get("w")
    width = emu_to_pt(width_emu)

    dash = None
    dash_elem = ln.find(f"{{{_A}}}prstDash")
    if dash_elem is not None:
        dash = dash_elem.get("val")
    elif ln.find(f"{{{_A}}}custDash") is not None:
        dash = "custom"

    join = None
    for child in list(ln):
        child_name = local_name(child.tag)
        if child_name == "round":
            join = "round"
        elif child_name == "bevel":
            join = "bevel"
        elif child_name == "miter":
            join = "miter"

    head = ln.find(f"{{{_A}}}headEnd")
    tail = ln.find(f"{{{_A}}}tailEnd")

    color = None
    alpha = None
    fill_elem = ln.find(f"{{{_A}}}solidFill")
    if fill_elem is not None:
        color, alpha = self._color_from_fill_elem(fill_elem)

    return Border(
        width=width,
        color=color,
        alpha=alpha,
        dash=dash,
        cap=ln.get("cap"),
        compound=ln.get("cmpd"),
        alignment=ln.get("algn"),
        join=join,
        head_end_type=head.get("type") if head is not None else None,
        head_end_width=head.get("w") if head is not None else None,
        head_end_length=head.get("len") if head is not None else None,
        tail_end_type=tail.get("type") if tail is not None else None,
        tail_end_width=tail.get("w") if tail is not None else None,
        tail_end_length=tail.get("len") if tail is not None else None,
    )

_parse_border.__module__ = 'pptx2html.ir.builder'
_parse_border.__qualname__ = 'PresentationBuilder._parse_border'
