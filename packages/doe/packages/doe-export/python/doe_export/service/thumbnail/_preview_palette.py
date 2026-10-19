# Origin: htmlir_server.py::_preview_palette
from __future__ import annotations
from doe_export.service.shared import Image, PALETTE_VERSION
from doe_export.service.thumbnail._dominant_region_color import _dominant_region_color

def _preview_palette(image: Image.Image) -> dict[str, str]:
    positions = {
        "topLeft": (0.08, 0.08),
        "top": (0.50, 0.08),
        "topRight": (0.92, 0.08),
        "bottomLeft": (0.08, 0.92),
        "bottom": (0.50, 0.92),
        "bottomRight": (0.92, 0.92),
    }
    palette = {
        name: _dominant_region_color(image, x, y)
        for name, (x, y) in positions.items()
    }
    channels = [tuple(int(color[index:index + 2], 16) for index in (1, 3, 5)) for color in palette.values()]
    base = tuple(round(sum(color[channel] for color in channels) / len(channels)) for channel in range(3))
    palette["base"] = f"#{base[0]:02x}{base[1]:02x}{base[2]:02x}"
    palette["version"] = PALETTE_VERSION
    return palette

_preview_palette.__module__ = 'htmlir_server'
