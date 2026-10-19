# Origin: pptx2html/server/ooxml_pptx_writer.py::SlideContext
from __future__ import annotations
from doe_export.pptx.ooxml.shared import ET, IMAGE_REL_TYPE, REL, dataclass
from doe_export.pptx.ooxml.assets.export_ready_image_payload import export_ready_image_payload
from doe_export.pptx.ooxml.package.next_relationship_id import next_relationship_id
from doe_export.pptx.ooxml.xml.qn import qn

@dataclass
class SlideContext:
    package: "OoxmlPackage"
    slide_part: str
    rels_root: ET.Element
    next_shape_id: int

    def allocate_shape_id(self) -> int:
        self.next_shape_id += 1
        return self.next_shape_id

    def add_image_relationship(self, image: dict[str, Any]) -> str:
        return self.add_image_relationship_with_content_type(image)[0]

    def add_image_relationship_with_content_type(self, image: dict[str, Any]) -> tuple[str, str]:
        data, content_type = export_ready_image_payload(image)
        media_part, target = self.package.add_media(data, content_type, self.slide_part)
        r_id = next_relationship_id(self.rels_root)
        ET.SubElement(
            self.rels_root,
            qn(REL, "Relationship"),
            {"Id": r_id, "Type": IMAGE_REL_TYPE, "Target": target},
        )
        self.package.ensure_content_type(media_part, content_type)
        return r_id, content_type

SlideContext.__module__ = 'pptx2html.server.ooxml_pptx_writer'
