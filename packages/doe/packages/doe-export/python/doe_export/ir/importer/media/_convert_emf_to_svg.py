# Origin: pptx2html/ir/builder.py::PresentationBuilder._convert_emf_to_svg
from __future__ import annotations
from doe_export.ir.importer.shared import Optional, Path, _EMF2SVG_MAX_OUTPUT_BYTES, _EMF2SVG_TIMEOUT_SECONDS, subprocess, tempfile

@staticmethod
def _convert_emf_to_svg(blob: bytes) -> Optional[tuple[str, bytes]]:
    from pptx2html.ir.builder import PresentationBuilder
    executable = PresentationBuilder._emf2svg_executable()
    if executable is None or not blob:
        return None

    with tempfile.TemporaryDirectory(prefix="pptx2html-emf2svg-") as temp_dir:
        temp_path = Path(temp_dir)
        source = temp_path / "image.emf"
        target = temp_path / "image.svg"
        source.write_bytes(blob)
        try:
            completed = subprocess.run(
                [
                    str(executable),
                    "-i",
                    str(source),
                    "-o",
                    str(target),
                    "-p",
                ],
                check=False,
                cwd=str(temp_path),
                env={
                    "HOME": str(temp_path),
                    "LANG": "C.UTF-8",
                    "LC_ALL": "C.UTF-8",
                    "PATH": "/usr/bin:/bin",
                    "TMPDIR": str(temp_path),
                },
                stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=_EMF2SVG_TIMEOUT_SECONDS,
            )
        except (OSError, subprocess.SubprocessError):
            return None
        if completed.returncode != 0 or not target.is_file() or target.is_symlink():
            return None
        try:
            output_size = target.stat().st_size
            if output_size <= 0 or output_size > _EMF2SVG_MAX_OUTPUT_BYTES:
                return None
            with target.open("rb") as output:
                svg = output.read(_EMF2SVG_MAX_OUTPUT_BYTES + 1)
        except OSError:
            return None
        if len(svg) != output_size or len(svg) > _EMF2SVG_MAX_OUTPUT_BYTES:
            return None
        if not PresentationBuilder._is_safe_browser_svg(svg):
            return None
        return "image/svg+xml", svg

_convert_emf_to_svg.__func__.__module__ = 'pptx2html.ir.builder'
_convert_emf_to_svg.__func__.__qualname__ = 'PresentationBuilder._convert_emf_to_svg'
