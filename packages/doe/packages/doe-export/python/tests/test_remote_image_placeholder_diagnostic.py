from __future__ import annotations

import base64
import io
import sys
import unittest
from pathlib import Path

from PIL import Image


RUNTIME_ROOT = Path(__file__).resolve().parents[1]
if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from pptx2html.htmlir.compiler import compile_html  # noqa: E402


def _pixel_data_url() -> str:
    payload = io.BytesIO()
    Image.new("RGB", (2, 2), (190, 178, 152)).save(payload, format="PNG")
    return "data:image/png;base64," + base64.b64encode(payload.getvalue()).decode("ascii")


class RemoteImagePlaceholderDiagnosticTests(unittest.TestCase):
    def test_plain_and_rounded_placeholder_images_keep_geometry_and_shape_diagnostic(self) -> None:
        source = f"""<!doctype html>
<html>
<head>
  <style>
    html, body {{ margin: 0; width: 1280px; height: 720px; overflow: hidden; }}
    img {{ position: absolute; width: 200px; height: 120px; object-fit: cover; }}
    #plain {{ left: 32px; top: 40px; }}
    #rounded {{ left: 280px; top: 40px; border-radius: 24px; }}
  </style>
</head>
<body>
  <img id="plain" src="{_pixel_data_url()}"
       data-yrkie-image-placeholder="remote-unavailable" alt="Unavailable remote image">
  <img id="rounded" src="{_pixel_data_url()}"
       data-yrkie-image-placeholder="remote-unavailable" alt="Unavailable rounded remote image">
</body>
</html>"""

        result = compile_html(source, include_ast=False, viewport=(1280, 720))
        shapes = result["presentation"]["slides"][0]["shapes"]
        plain = next(shape for shape in shapes if shape["name"].endswith("img plain"))
        rounded = next(shape for shape in shapes if shape["name"].endswith("img rounded"))

        self.assertEqual(plain["type"], "picture")
        self.assertEqual(plain["geometry"], "rect")
        self.assertEqual(plain["bounds"], {"left": 24.0, "top": 30.0, "width": 150.0, "height": 90.0})
        self.assertEqual(plain["diagnostics"].count("yrkie:remote-image-placeholder"), 1)

        self.assertEqual(rounded["type"], "auto_shape")
        self.assertEqual(rounded["geometry"], "roundRect")
        self.assertEqual(rounded["bounds"], {"left": 210.0, "top": 30.0, "width": 150.0, "height": 90.0})
        self.assertEqual(rounded["fill"]["type"], "picture")
        self.assertIsNotNone(rounded["fill"]["image"])
        self.assertEqual(rounded["diagnostics"].count("yrkie:remote-image-placeholder"), 1)


if __name__ == "__main__":
    unittest.main()
