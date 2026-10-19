# Origin: pptx2html/ir/builder.py::PresentationBuilder._is_safe_browser_svg
from __future__ import annotations
from doe_export.ir.importer.shared import ET, _EMF2SVG_ALLOWED_ATTRIBUTES, _EMF2SVG_ALLOWED_DATA_IMAGE_PREFIXES, _EMF2SVG_ALLOWED_ELEMENTS, _EMF2SVG_MAX_ELEMENTS, _EMF2SVG_MAX_OUTPUT_BYTES, _EMF2SVG_MAX_ROOT_DIMENSION_PT, _EMF2SVG_NUMERIC_ATTRIBUTES, _EMF2SVG_SVG_NAMESPACE, _EMF2SVG_XLINK_NAMESPACE, _EMF2SVG_XML_NAMESPACE, re

@staticmethod
def _is_safe_browser_svg(blob: bytes) -> bool:
    from pptx2html.ir.builder import PresentationBuilder
    if not blob or len(blob) > _EMF2SVG_MAX_OUTPUT_BYTES or b"\x00" in blob:
        return False
    try:
        text = blob.decode("utf-8-sig")
    except UnicodeDecodeError:
        return False

    without_declaration = re.sub(
        r"^\s*<\?xml\s+[^?]*\?>",
        "",
        text,
        count=1,
        flags=re.IGNORECASE,
    )
    lowered = without_declaration.lower()
    if "<?" in without_declaration or any(
        forbidden in lowered for forbidden in ("<!doctype", "<!entity", "@import")
    ):
        return False

    try:
        root = ET.fromstring(text)
    except (ET.ParseError, ValueError):
        return False
    root_namespace, root_name = PresentationBuilder._expanded_xml_name(root.tag)
    if root_namespace != _EMF2SVG_SVG_NAMESPACE or root_name != "svg":
        return False

    width = PresentationBuilder._svg_length_pt(root.get("width"), None)
    height = PresentationBuilder._svg_length_pt(root.get("height"), None)
    if (
        width is None
        or height is None
        or width > _EMF2SVG_MAX_ROOT_DIMENSION_PT
        or height > _EMF2SVG_MAX_ROOT_DIMENSION_PT
    ):
        return False
    view_box = root.get("viewBox")
    if view_box is not None and not PresentationBuilder._is_bounded_svg_view_box(view_box):
        return False

    element_count = 0
    for element in root.iter():
        element_count += 1
        if element_count > _EMF2SVG_MAX_ELEMENTS:
            return False
        namespace, element_name = PresentationBuilder._expanded_xml_name(element.tag)
        if namespace != _EMF2SVG_SVG_NAMESPACE:
            return False
        if element_name not in _EMF2SVG_ALLOWED_ELEMENTS:
            return False
        if element is not root and element_name == "svg":
            return False
        for raw_name, raw_value in element.attrib.items():
            attribute_namespace, name = PresentationBuilder._expanded_xml_name(raw_name)
            if attribute_namespace not in {
                None,
                _EMF2SVG_XLINK_NAMESPACE,
                _EMF2SVG_XML_NAMESPACE,
            }:
                return False
            if name not in _EMF2SVG_ALLOWED_ATTRIBUTES:
                return False
            if attribute_namespace == _EMF2SVG_XLINK_NAMESPACE and name != "href":
                return False
            if attribute_namespace == _EMF2SVG_XML_NAMESPACE and name != "space":
                return False
            value = raw_value.strip()
            lowered_value = value.lower()
            if any(
                scheme in lowered_value
                for scheme in ("javascript:", "vbscript:", "file:", "http:", "https:")
            ):
                return False
            if "url(" in lowered_value and re.fullmatch(
                r"url\(\s*#[A-Za-z_][A-Za-z0-9_.:-]*\s*\)",
                value,
                flags=re.IGNORECASE,
            ) is None:
                return False
            if name == "style":
                if element_name not in {"text", "tspan"} or re.fullmatch(
                    r"white-space\s*:\s*pre\s*;?",
                    value,
                    flags=re.IGNORECASE,
                ) is None:
                    return False
            if name == "href":
                if element_name != "image" or not (
                    re.fullmatch(r"#[A-Za-z_][A-Za-z0-9_.:-]*", value)
                    or lowered_value.startswith(_EMF2SVG_ALLOWED_DATA_IMAGE_PREFIXES)
                ):
                    return False
            if name in _EMF2SVG_NUMERIC_ATTRIBUTES:
                if not PresentationBuilder._has_bounded_svg_numbers(value):
                    return False

    return True

_is_safe_browser_svg.__func__.__module__ = 'pptx2html.ir.builder'
_is_safe_browser_svg.__func__.__qualname__ = 'PresentationBuilder._is_safe_browser_svg'
