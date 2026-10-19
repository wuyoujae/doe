from __future__ import annotations

import os
import stat
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
import modular_patch as mock


RUNTIME_ROOT = Path(__file__).resolve().parents[1]
if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from pptx2html.ir import builder as builder_module  # noqa: E402
from pptx2html.ir.builder import PresentationBuilder  # noqa: E402


SAFE_SVG = (
    b'<svg xmlns="http://www.w3.org/2000/svg" width="12" height="8" '
    b'viewBox="0 0 12 8"><path d="M0 0h12v8H0z" fill="#123456"/></svg>'
)


class EmfBrowserConversionTests(unittest.TestCase):
    def setUp(self) -> None:
        builder_module._METAFILE_CACHE.clear()

    def tearDown(self) -> None:
        builder_module._METAFILE_CACHE.clear()

    def test_linux_emf_uses_absolute_converter_before_pillow(self) -> None:
        emf = b"fake-emf-for-command-contract"
        with tempfile.TemporaryDirectory() as temp_dir:
            executable = Path(temp_dir) / ("emf2svg-conv.exe" if os.name == "nt" else "emf2svg-conv")
            executable.write_bytes(b"fake executable")
            executable.chmod(executable.stat().st_mode | stat.S_IXUSR)

            def run_converter(command, **kwargs):
                self.assertEqual(command[0], str(executable.resolve()))
                self.assertEqual(command[1], "-i")
                self.assertEqual(command[3], "-o")
                self.assertEqual(
                    command[5:],
                    ["-p"],
                )
                self.assertEqual(Path(command[2]).read_bytes(), emf)
                Path(command[4]).write_bytes(SAFE_SVG)
                self.assertFalse(kwargs["check"])
                self.assertEqual(kwargs["timeout"], builder_module._EMF2SVG_TIMEOUT_SECONDS)
                self.assertEqual(kwargs["stdin"], subprocess.DEVNULL)
                self.assertEqual(kwargs["stdout"], subprocess.DEVNULL)
                self.assertEqual(kwargs["stderr"], subprocess.DEVNULL)
                self.assertEqual(kwargs["env"]["PATH"], "/usr/bin:/bin")
                return subprocess.CompletedProcess(command, 0)

            with (
                mock.patch.object(PresentationBuilder, "_is_windows_runtime", return_value=False),
                mock.patch.object(
                    PresentationBuilder,
                    "_emf2svg_executable",
                    return_value=executable.resolve(),
                ),
                mock.patch.dict(
                    os.environ,
                    {
                        "YRKIE_ENVIRONMENT": "test",
                        builder_module._EMF2SVG_EXECUTABLE_ENV: str(executable),
                    },
                ),
                mock.patch.object(builder_module.subprocess, "run", side_effect=run_converter),
                mock.patch.object(
                    PresentationBuilder,
                    "_rasterize_metafile_with_pillow",
                    side_effect=AssertionError("Pillow must not run after a valid SVG conversion"),
                ),
            ):
                converted = PresentationBuilder._rasterize_metafile(
                    "image/x-emf", emf, "ppt/media/image1.emf"
                )

        self.assertEqual(converted, ("image/svg+xml", SAFE_SVG))

    def test_converter_timeout_falls_back_to_pillow(self) -> None:
        emf = b"fake-emf-timeout"
        with tempfile.TemporaryDirectory() as temp_dir:
            executable = Path(temp_dir) / ("emf2svg-conv.exe" if os.name == "nt" else "emf2svg-conv")
            executable.write_bytes(b"fake executable")
            executable.chmod(executable.stat().st_mode | stat.S_IXUSR)
            fallback = ("image/png", b"fallback-png")
            with (
                mock.patch.object(PresentationBuilder, "_is_windows_runtime", return_value=False),
                mock.patch.dict(
                    os.environ,
                    {
                        "YRKIE_ENVIRONMENT": "test",
                        builder_module._EMF2SVG_EXECUTABLE_ENV: str(executable),
                    },
                ),
                mock.patch.object(
                    builder_module.subprocess,
                    "run",
                    side_effect=subprocess.TimeoutExpired(str(executable), 15),
                ),
                mock.patch.object(
                    PresentationBuilder,
                    "_rasterize_metafile_with_pillow",
                    return_value=fallback,
                ) as pillow,
            ):
                converted = PresentationBuilder._rasterize_metafile(
                    "image/emf", emf, "ppt/media/image2.emf"
                )

        self.assertEqual(converted, fallback)
        pillow.assert_called_once_with(emf)

    def test_oversized_converter_output_falls_back(self) -> None:
        emf = b"fake-emf-oversized-output"
        with tempfile.TemporaryDirectory() as temp_dir:
            executable = Path(temp_dir) / ("emf2svg-conv.exe" if os.name == "nt" else "emf2svg-conv")
            executable.write_bytes(b"fake executable")
            executable.chmod(executable.stat().st_mode | stat.S_IXUSR)

            def write_oversized_output(command, **_kwargs):
                Path(command[4]).write_bytes(b"x" * 65)
                return subprocess.CompletedProcess(command, 0)

            fallback = ("image/png", b"fallback-after-oversized-svg")
            with (
                mock.patch.object(PresentationBuilder, "_is_windows_runtime", return_value=False),
                mock.patch.dict(
                    os.environ,
                    {
                        "YRKIE_ENVIRONMENT": "test",
                        builder_module._EMF2SVG_EXECUTABLE_ENV: str(executable),
                    },
                ),
                mock.patch.object(builder_module, "_EMF2SVG_MAX_OUTPUT_BYTES", 64),
                mock.patch.object(
                    builder_module.subprocess,
                    "run",
                    side_effect=write_oversized_output,
                ),
                mock.patch.object(
                    PresentationBuilder,
                    "_rasterize_metafile_with_pillow",
                    return_value=fallback,
                ),
            ):
                converted = PresentationBuilder._rasterize_metafile(
                    "application/emf", emf, "ppt/media/image-oversized.emf"
                )

        self.assertEqual(converted, fallback)

    def test_unsafe_or_invalid_svg_is_rejected(self) -> None:
        self.assertFalse(
            PresentationBuilder._is_safe_browser_svg(
                b'<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1">'
                b'<script>alert(1)</script></svg>'
            )
        )
        self.assertFalse(
            PresentationBuilder._is_safe_browser_svg(
                b'<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1">'
                b'<image href="https://example.com/a.png"/></svg>'
            )
        )
        self.assertFalse(
            PresentationBuilder._is_safe_browser_svg(
                b'<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1">'
                b'<set href="#i" attributeName="href" to="https://example.com/probe"/>'
                b'</svg>'
            )
        )
        self.assertFalse(
            PresentationBuilder._is_safe_browser_svg(
                b'<?xml-stylesheet href="https://example.com/style.css"?>'
                b'<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'
            )
        )
        self.assertFalse(
            PresentationBuilder._is_safe_browser_svg(
                b'<svg xmlns="http://www.w3.org/2000/svg" width="1e308" height="1"/>'
            )
        )
        self.assertFalse(
            PresentationBuilder._is_safe_browser_svg(
                b'<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1">'
                b'<path d="M0 0 L1e308 1"/></svg>'
            )
        )
        self.assertFalse(
            PresentationBuilder._is_safe_browser_svg(
                b'<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1">'
                b'<path d="M0 0" transform="translate(Infinity, 0)"/></svg>'
            )
        )
        self.assertFalse(PresentationBuilder._is_safe_browser_svg(b"<svg>"))
        self.assertTrue(PresentationBuilder._is_safe_browser_svg(SAFE_SVG))

    def test_official_static_text_and_embedded_raster_shape_is_allowed(self) -> None:
        svg = (
            b'<svg xmlns="http://www.w3.org/2000/svg" '
            b'xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" '
            b'width="320.0000" height="180.0000">'
            b'<g transform="translate(0, 0)">'
            b'<text x="12" y="24" font-family="Arial" font-size="18" '
            b'style="white-space:pre;" fill="#112233">Safe text</text>'
            b'<image x="0" y="0" width="1" height="1" '
            b'xlink:href="data:image/png;base64,AA=="/>'
            b'</g></svg>'
        )
        self.assertTrue(PresentationBuilder._is_safe_browser_svg(svg))

    def test_metafile_cache_is_lru_bounded_by_entries_and_bytes(self) -> None:
        cache = builder_module._BoundedMetafileCache(max_entries=2, max_bytes=5)
        cache.put("a", ("image/svg+xml", b"aaa"))
        cache.put("b", ("image/svg+xml", b"bb"))
        self.assertEqual(cache.total_bytes, 5)
        self.assertEqual(cache.get("a"), ("image/svg+xml", b"aaa"))

        cache.put("c", ("image/svg+xml", b"ccc"))

        self.assertEqual(len(cache), 1)
        self.assertIsNone(cache.get("a"))
        self.assertIsNone(cache.get("b"))
        self.assertEqual(cache.get("c"), ("image/svg+xml", b"ccc"))
        self.assertEqual(cache.total_bytes, 3)

        cache.put("oversized", ("image/svg+xml", b"123456"))
        self.assertIsNone(cache.get("oversized"))
        self.assertEqual(cache.total_bytes, 3)

    def test_relative_converter_configuration_is_never_executed(self) -> None:
        with (
            mock.patch.dict(
                os.environ,
                {
                    "YRKIE_ENVIRONMENT": "test",
                    builder_module._EMF2SVG_EXECUTABLE_ENV: "tools/emf2svg-conv",
                },
            ),
            mock.patch.object(builder_module.subprocess, "run") as run,
        ):
            self.assertIsNone(PresentationBuilder._convert_emf_to_svg(b"emf"))
        run.assert_not_called()

    def test_production_ignores_executable_override_from_process_environment(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            packaged = Path(temp_dir) / ("packaged.exe" if os.name == "nt" else "packaged")
            override = Path(temp_dir) / ("override.exe" if os.name == "nt" else "override")
            for executable in (packaged, override):
                executable.write_bytes(b"fake executable")
                executable.chmod(executable.stat().st_mode | stat.S_IXUSR)
            with (
                mock.patch.object(
                    builder_module,
                    "_EMF2SVG_DEFAULT_EXECUTABLE",
                    str(packaged),
                ),
                mock.patch.dict(
                    os.environ,
                    {
                        "YRKIE_ENVIRONMENT": "production",
                        builder_module._EMF2SVG_EXECUTABLE_ENV: str(override),
                    },
                ),
                mock.patch.object(builder_module.os, "access", return_value=True),
            ):
                selected = PresentationBuilder._emf2svg_executable()

        self.assertEqual(selected, packaged.resolve())

    def test_wmf_keeps_existing_pillow_fallback_on_linux(self) -> None:
        fallback = ("image/png", b"wmf-pillow")
        with (
            mock.patch.object(PresentationBuilder, "_is_windows_runtime", return_value=False),
            mock.patch.object(
                PresentationBuilder,
                "_convert_emf_to_svg",
                side_effect=AssertionError("emf2svg-conv must not receive WMF"),
            ),
            mock.patch.object(
                PresentationBuilder,
                "_rasterize_metafile_with_pillow",
                return_value=fallback,
            ),
        ):
            converted = PresentationBuilder._rasterize_metafile(
                "image/x-wmf", b"fake-wmf", "ppt/media/image3.wmf"
            )
        self.assertEqual(converted, fallback)

    def test_windows_keeps_existing_system_drawing_path(self) -> None:
        def run_powershell(command, **_kwargs):
            self.assertEqual(command[0], "powershell")
            Path(command[-1]).write_bytes(b"windows-png")
            return subprocess.CompletedProcess(command, 0)

        with (
            mock.patch.object(PresentationBuilder, "_is_windows_runtime", return_value=True),
            mock.patch.object(
                PresentationBuilder,
                "_convert_emf_to_svg",
                side_effect=AssertionError("Windows must retain the System.Drawing path"),
            ),
            mock.patch.object(builder_module.subprocess, "run", side_effect=run_powershell),
        ):
            converted = PresentationBuilder._rasterize_metafile(
                "image/x-emf", b"fake-windows-emf", "ppt/media/image4.emf"
            )
        self.assertEqual(converted, ("image/png", b"windows-png"))


if __name__ == "__main__":
    unittest.main()
