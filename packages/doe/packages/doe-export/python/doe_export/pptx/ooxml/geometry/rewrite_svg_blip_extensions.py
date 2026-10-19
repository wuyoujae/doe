# Origin: pptx2html/server/ooxml_pptx_writer.py::rewrite_svg_blip_extensions
from __future__ import annotations
from doe_export.pptx.ooxml.shared import A, ASVG, ET, R, SVG_BLIP_EXT_URI
from doe_export.pptx.ooxml.xml.qn import qn

def rewrite_svg_blip_extensions(blip: ET.Element, relationship_id: str, *, keep_svg: bool) -> None:
    ext_lst = blip.find(qn(A, "extLst"))
    if ext_lst is None:
        if not keep_svg:
            return
        ext_lst = ET.SubElement(blip, qn(A, "extLst"))
        extension = ET.SubElement(ext_lst, qn(A, "ext"), {"uri": SVG_BLIP_EXT_URI})
        ET.SubElement(extension, qn(ASVG, "svgBlip"), {qn(R, "embed"): relationship_id})
        return

    svg_extensions: list[tuple[ET.Element, list[ET.Element]]] = []
    for extension in ext_lst.findall(qn(A, "ext")):
        svg_blips = list(extension.iter(qn(ASVG, "svgBlip")))
        if svg_blips:
            svg_extensions.append((extension, svg_blips))

    if keep_svg:
        if not svg_extensions:
            extension = ET.SubElement(ext_lst, qn(A, "ext"), {"uri": SVG_BLIP_EXT_URI})
            svg_extensions.append(
                (
                    extension,
                    [ET.SubElement(extension, qn(ASVG, "svgBlip"))],
                )
            )
        for _extension, svg_blips in svg_extensions:
            for svg_blip in svg_blips:
                svg_blip.set(qn(R, "embed"), relationship_id)
                svg_blip.attrib.pop(qn(R, "link"), None)
        return

    for extension, _svg_blips in svg_extensions:
        ext_lst.remove(extension)
    if not list(ext_lst):
        blip.remove(ext_lst)

rewrite_svg_blip_extensions.__module__ = 'pptx2html.server.ooxml_pptx_writer'
