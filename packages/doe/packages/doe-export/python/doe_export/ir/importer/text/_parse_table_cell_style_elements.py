# Origin: pptx2html/ir/builder.py::PresentationBuilder._parse_table_cell_style_elements
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, copy

@staticmethod
def _parse_table_cell_style_elements(
    root: ET.Element,
) -> dict[str, dict[str, ET.Element]]:
    _A = NAMESPACE.DML_MAIN
    styles: dict[str, dict[str, ET.Element]] = {}
    section_names = (
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
    )
    for tbl_style in root.findall(f"{{{_A}}}tblStyle"):
        style_id = tbl_style.get("styleId")
        if not style_id:
            continue
        sections: dict[str, ET.Element] = {}
        for section_name in section_names:
            tc_style = tbl_style.find(f"{{{_A}}}{section_name}/{{{_A}}}tcStyle")
            if tc_style is not None:
                sections[section_name] = copy.deepcopy(tc_style)
        styles[style_id] = sections
    return styles

_parse_table_cell_style_elements.__func__.__module__ = 'pptx2html.ir.builder'
_parse_table_cell_style_elements.__func__.__qualname__ = 'PresentationBuilder._parse_table_cell_style_elements'
