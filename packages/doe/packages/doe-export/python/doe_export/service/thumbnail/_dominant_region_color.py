# Origin: htmlir_server.py::_dominant_region_color
from __future__ import annotations
from doe_export.service.shared import Image, defaultdict

def _dominant_region_color(image: Image.Image, center_x: float, center_y: float) -> str:
    width, height = image.size
    region_width = max(1, round(width * 0.12))
    region_height = max(1, round(height * 0.12))
    x0 = max(0, min(width - region_width, round(width * center_x - region_width / 2)))
    y0 = max(0, min(height - region_height, round(height * center_y - region_height / 2)))
    buckets: dict[tuple[int, int, int], list[int]] = defaultdict(lambda: [0, 0, 0, 0])
    for red, green, blue, alpha in image.crop(
        (x0, y0, x0 + region_width, y0 + region_height)
    ).getdata():
        if alpha < 32:
            continue
        bucket = (red >> 3, green >> 3, blue >> 3)
        totals = buckets[bucket]
        totals[0] += red
        totals[1] += green
        totals[2] += blue
        totals[3] += 1
    if not buckets:
        return "#eef2f7"
    totals = max(buckets.values(), key=lambda value: value[3])
    count = totals[3]
    return f"#{round(totals[0] / count):02x}{round(totals[1] / count):02x}{round(totals[2] / count):02x}"

_dominant_region_color.__module__ = 'htmlir_server'
