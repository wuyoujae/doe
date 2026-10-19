# Origin: schema_v4_fonts.py::remove_embedded_fonts
from __future__ import annotations
from .shared import BytesIO, CONTENT_TYPES_NS, PML_NS, ZIP_DEFLATED, ZipFile, etree, posixpath

def remove_embedded_fonts(pptx_bytes: bytes) -> bytes:
    """Remove font payloads, including those preserved from an imported PPTX."""
    with ZipFile(BytesIO(pptx_bytes), "r") as source:
        presentation_path = "ppt/presentation.xml"
        relationships_path = "ppt/_rels/presentation.xml.rels"
        presentation = etree.fromstring(source.read(presentation_path))
        relationships = etree.fromstring(source.read(relationships_path))
        content_types = etree.fromstring(source.read("[Content_Types].xml"))
        font_parts = {name for name in source.namelist() if name.startswith("ppt/fonts/")}
        font_relationships = [
            item for item in relationships
            if (item.get("Type") or "").endswith("/font")
        ]
        embedded_list = presentation.find(f"{{{PML_NS}}}embeddedFontLst")
        if (embedded_list is None and not font_parts and not font_relationships
                and "embedTrueTypeFonts" not in presentation.attrib
                and "saveSubsetFonts" not in presentation.attrib):
            return pptx_bytes
        for item in font_relationships:
            if item.get("TargetMode", "Internal") == "Internal":
                target = (item.get("Target") or "").replace("\\", "/")
                font_parts.add(posixpath.normpath(posixpath.join("/ppt", target)).lstrip("/"))
            relationships.remove(item)
        if embedded_list is not None:
            presentation.remove(embedded_list)
        presentation.attrib.pop("embedTrueTypeFonts", None)
        presentation.attrib.pop("saveSubsetFonts", None)
        remaining = set(source.namelist()) - font_parts
        for item in list(content_types):
            if item.tag == f"{{{CONTENT_TYPES_NS}}}Override":
                if (item.get("PartName") or "").lstrip("/") in font_parts:
                    content_types.remove(item)
            elif item.tag == f"{{{CONTENT_TYPES_NS}}}Default":
                extension = (item.get("Extension") or "").lower()
                if any(name.lower().endswith(f".{extension}") for name in font_parts) and not any(
                    name.lower().endswith(f".{extension}") for name in remaining
                ):
                    content_types.remove(item)
        modified = {
            name: etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True)
            for name, root in (
                (presentation_path, presentation),
                (relationships_path, relationships),
                ("[Content_Types].xml", content_types),
            )
        }
        output_stream = BytesIO()
        with ZipFile(output_stream, "w", ZIP_DEFLATED) as output:
            for item in source.infolist():
                if item.filename not in font_parts:
                    output.writestr(item, modified.get(item.filename, source.read(item.filename)))
        return output_stream.getvalue()

remove_embedded_fonts.__module__ = 'schema_v4_fonts'
