# Origin: pptx2html/ir/builder.py::PresentationBuilder._load_embedded_fonts
from __future__ import annotations
from doe_export.ir.importer.shared import EmbeddedFont, NAMESPACE, PackURI, PomPresentation, base64

def _load_embedded_fonts(self, pom: PomPresentation) -> list[EmbeddedFont]:
    part = getattr(pom, "presentation_part", None)
    if part is None:
        return []
    _P = NAMESPACE.PML_MAIN
    _R = NAMESPACE.OFC_RELATIONSHIPS
    fonts: list[EmbeddedFont] = []
    font_lst = part.element.find(f"{{{_P}}}embeddedFontLst")
    if font_lst is None:
        return fonts

    for embedded in font_lst.findall(f"{{{_P}}}embeddedFont"):
        font_elem = embedded.find(f"{{{_P}}}font")
        typeface = font_elem.get("typeface") if font_elem is not None else None
        if not typeface:
            continue
        for style in ("regular", "bold", "italic", "boldItalic"):
            style_elem = embedded.find(f"{{{_P}}}{style}")
            rel_id = style_elem.get(f"{{{_R}}}id") if style_elem is not None else None
            if not rel_id:
                continue
            try:
                rel = part.relationships[rel_id]
                target_uri = PackURI.from_rel_ref(part.pack_uri.base_uri, rel.target)
                font_part = part.package.part(target_uri)
            except Exception:
                continue
            converted = self._browser_ready_font_blob(font_part.blob)
            if converted is None:
                continue
            content_type, blob = converted
            fonts.append(
                EmbeddedFont(
                    typeface=typeface,
                    style=style,
                    content_type=content_type,
                    data=base64.b64encode(blob).decode("ascii"),
                )
            )
    return fonts

_load_embedded_fonts.__module__ = 'pptx2html.ir.builder'
_load_embedded_fonts.__qualname__ = 'PresentationBuilder._load_embedded_fonts'
