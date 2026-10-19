# Origin: pptx2html/ir/builder.py::PresentationBuilder._apply_color_transforms
from __future__ import annotations
from doe_export.ir.importer.shared import ET, Optional, colorsys, local_name, math, percentage_to_float

@staticmethod
def _apply_color_transforms(color: Optional[str], color_elem: ET.Element) -> Optional[str]:
    if not color or len(color) != 6:
        return color
    try:
        r = int(color[0:2], 16) / 255.0
        g = int(color[2:4], 16) / 255.0
        b = int(color[4:6], 16) / 255.0
    except ValueError:
        return color

    def clamp(value: float) -> float:
        return max(0.0, min(1.0, value))

    def pct(child: ET.Element, attr: str = "val") -> Optional[float]:
        return percentage_to_float(child.get(attr))

    def angle_fraction(child: ET.Element) -> Optional[float]:
        if child.get("val") is None:
            return None
        try:
            return int(child.get("val")) / 60000.0 / 360.0
        except (TypeError, ValueError):
            return None

    def rgb_component_update(channel: str, value: float) -> None:
        nonlocal r, g, b
        if channel == "red":
            r = value
        elif channel == "green":
            g = value
        elif channel == "blue":
            b = value

    def rgb_component_value(channel: str) -> float:
        return {"red": r, "green": g, "blue": b}[channel]

    def hls_update(
        hue: Optional[float] = None,
        luminance: Optional[float] = None,
        saturation: Optional[float] = None,
    ) -> None:
        nonlocal r, g, b
        h, l, s = colorsys.rgb_to_hls(clamp(r), clamp(g), clamp(b))
        if hue is not None:
            h = hue % 1.0
        if luminance is not None:
            l = clamp(luminance)
        if saturation is not None:
            s = clamp(saturation)
        r, g, b = colorsys.hls_to_rgb(h, l, s)

    for child in list(color_elem):
        name = local_name(child.tag)
        value = pct(child)
        if name == "shade" and value is not None:
            r, g, b = r * value, g * value, b * value
        elif name == "tint" and value is not None:
            # DrawingML stores the retained source-color fraction.
            r = 1.0 - (1.0 - r) * value
            g = 1.0 - (1.0 - g) * value
            b = 1.0 - (1.0 - b) * value
        elif name == "lumMod" and value is not None:
            h, l, s = colorsys.rgb_to_hls(clamp(r), clamp(g), clamp(b))
            hls_update(luminance=l * value)
        elif name == "lumOff" and value is not None:
            h, l, s = colorsys.rgb_to_hls(clamp(r), clamp(g), clamp(b))
            hls_update(luminance=l + value)
        elif name == "satMod" and value is not None:
            h, l, s = colorsys.rgb_to_hls(clamp(r), clamp(g), clamp(b))
            hls_update(saturation=s * value)
        elif name == "satOff" and value is not None:
            h, l, s = colorsys.rgb_to_hls(clamp(r), clamp(g), clamp(b))
            hls_update(saturation=s + value)
        elif name == "sat" and value is not None:
            hls_update(saturation=value)
        elif name == "hue" and child.get("val") is not None:
            hue = angle_fraction(child)
            if hue is not None:
                hls_update(hue=hue)
        elif name == "hueMod" and value is not None:
            h, l, s = colorsys.rgb_to_hls(clamp(r), clamp(g), clamp(b))
            hls_update(hue=h * value)
        elif name == "hueOff" and child.get("val") is not None:
            offset = angle_fraction(child)
            if offset is not None:
                h, l, s = colorsys.rgb_to_hls(clamp(r), clamp(g), clamp(b))
                hls_update(hue=h + offset)
        elif name == "lum" and value is not None:
            hls_update(luminance=value)
        elif name in {"red", "green", "blue"} and value is not None:
            rgb_component_update(name, value)
        elif name in {"redMod", "greenMod", "blueMod"} and value is not None:
            channel = name[:-3]
            rgb_component_update(channel, rgb_component_value(channel) * value)
        elif name in {"redOff", "greenOff", "blueOff"} and value is not None:
            channel = name[:-3]
            rgb_component_update(channel, rgb_component_value(channel) + value)
        elif name == "comp":
            h, l, s = colorsys.rgb_to_hls(clamp(r), clamp(g), clamp(b))
            hls_update(hue=h + 0.5)
        elif name == "inv":
            r, g, b = 1.0 - r, 1.0 - g, 1.0 - b
        elif name == "gray":
            gray = 0.299 * r + 0.587 * g + 0.114 * b
            r = g = b = gray
        elif name == "gamma":
            r, g, b = [math.pow(clamp(component), 1 / 2.2) for component in (r, g, b)]
        elif name == "invGamma":
            r, g, b = [math.pow(clamp(component), 2.2) for component in (r, g, b)]

    r_i, g_i, b_i = [max(0, min(255, int(round(clamp(value) * 255)))) for value in (r, g, b)]
    return f"{r_i:02X}{g_i:02X}{b_i:02X}"

_apply_color_transforms.__func__.__module__ = 'pptx2html.ir.builder'
_apply_color_transforms.__func__.__qualname__ = 'PresentationBuilder._apply_color_transforms'
