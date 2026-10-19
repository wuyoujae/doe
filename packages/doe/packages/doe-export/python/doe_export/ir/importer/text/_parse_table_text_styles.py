# Origin: pptx2html/ir/builder.py::PresentationBuilder._parse_table_text_styles
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE

def _parse_table_text_styles(self, root: ET.Element) -> dict[str, dict[str, dict]]:
    _A = NAMESPACE.DML_MAIN
    styles: dict[str, dict[str, dict]] = {}
    for tbl_style in root.findall(f"{{{_A}}}tblStyle"):
        style_id = tbl_style.get("styleId")
        if not style_id:
            continue
        sections: dict[str, dict] = {}
        for section_name in (
            "wholeTbl",
            "band1H",
            "band2H",
            "band1V",
            "band2V",
            "lastCol",
            "firstCol",
            "lastRow",
            "firstRow",
            "nwCell",
            "neCell",
            "swCell",
            "seCell",
        ):
            tx_style = tbl_style.find(f"{{{_A}}}{section_name}/{{{_A}}}tcTxStyle")
            if tx_style is None:
                continue
            props = self._font_props_from_table_tx_style(tx_style)
            if props:
                sections[section_name] = props
        styles[style_id] = sections
    return styles

_parse_table_text_styles.__module__ = 'pptx2html.ir.builder'
_parse_table_text_styles.__qualname__ = 'PresentationBuilder._parse_table_text_styles'
