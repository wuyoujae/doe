# Origin: pptx2html/server/ooxml_pptx_writer.py::append_svg_path_commands
from __future__ import annotations
from doe_export.pptx.ooxml.shared import A, ET, SVG_PATH_TOKEN_RE
from doe_export.pptx.ooxml.xml.ooxml_coord import ooxml_coord
from doe_export.pptx.ooxml.xml.qn import qn

def append_svg_path_commands(path_elem: ET.Element, data: str) -> None:
    tokens = SVG_PATH_TOKEN_RE.findall(data)
    index = 0
    command: str | None = None
    current = (0.0, 0.0)
    subpath_start = (0.0, 0.0)

    def is_command(token: str) -> bool:
        return len(token) == 1 and token.isalpha()

    def has_number() -> bool:
        return index < len(tokens) and not is_command(tokens[index])

    def read_number() -> float:
        nonlocal index
        if index >= len(tokens) or is_command(tokens[index]):
            raise ValueError("expected SVG path number")
        value = float(tokens[index])
        index += 1
        return value

    def point(x: float, y: float, relative: bool) -> tuple[float, float]:
        return (current[0] + x, current[1] + y) if relative else (x, y)

    def append_point(parent: ET.Element, value: tuple[float, float]) -> None:
        ET.SubElement(parent, qn(A, "pt"), {"x": ooxml_coord(value[0]), "y": ooxml_coord(value[1])})

    def append_line(value: tuple[float, float]) -> None:
        item = ET.SubElement(path_elem, qn(A, "lnTo"))
        append_point(item, value)

    try:
        while index < len(tokens):
            if is_command(tokens[index]):
                command = tokens[index]
                index += 1
            if command is None:
                return
            lower = command.lower()
            relative = command.islower()
            if lower == "z":
                ET.SubElement(path_elem, qn(A, "close"))
                current = subpath_start
                command = None
                continue
            first_segment = True
            while has_number():
                if lower == "m":
                    target = point(read_number(), read_number(), relative)
                    item = ET.SubElement(path_elem, qn(A, "moveTo" if first_segment else "lnTo"))
                    append_point(item, target)
                    current = target
                    if first_segment:
                        subpath_start = target
                    first_segment = False
                    command = "l" if relative else "L"
                    lower = "l"
                    relative = command.islower()
                elif lower == "l":
                    target = point(read_number(), read_number(), relative)
                    append_line(target)
                    current = target
                elif lower == "h":
                    value = read_number()
                    target = (current[0] + value, current[1]) if relative else (value, current[1])
                    append_line(target)
                    current = target
                elif lower == "v":
                    value = read_number()
                    target = (current[0], current[1] + value) if relative else (current[0], value)
                    append_line(target)
                    current = target
                elif lower == "c":
                    c1 = point(read_number(), read_number(), relative)
                    c2 = point(read_number(), read_number(), relative)
                    target = point(read_number(), read_number(), relative)
                    item = ET.SubElement(path_elem, qn(A, "cubicBezTo"))
                    append_point(item, c1)
                    append_point(item, c2)
                    append_point(item, target)
                    current = target
                elif lower == "q":
                    c1 = point(read_number(), read_number(), relative)
                    target = point(read_number(), read_number(), relative)
                    item = ET.SubElement(path_elem, qn(A, "quadBezTo"))
                    append_point(item, c1)
                    append_point(item, target)
                    current = target
                else:
                    return
                if index < len(tokens) and is_command(tokens[index]):
                    break
    except (TypeError, ValueError, OverflowError):
        return

append_svg_path_commands.__module__ = 'pptx2html.server.ooxml_pptx_writer'
