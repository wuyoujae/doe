# Origin: pptx2html/server/ooxml_pptx_writer.py::next_relationship_id
from __future__ import annotations
from doe_export.pptx.ooxml.shared import ET
from doe_export.pptx.ooxml.shared import REL

def next_relationship_id(root: ET.Element) -> str:
    used = []
    for rel in root.findall(f"{{{REL}}}Relationship"):
        rel_id = rel.get("Id") or ""
        if rel_id.startswith("rId") and rel_id[3:].isdigit():
            used.append(int(rel_id[3:]))
    next_id = max(used, default=0) + 1
    while any(rel.get("Id") == f"rId{next_id}" for rel in root.findall(f"{{{REL}}}Relationship")):
        next_id += 1
    return f"rId{next_id}"

next_relationship_id.__module__ = 'pptx2html.server.ooxml_pptx_writer'
