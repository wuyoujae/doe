# Origin: pptx_pipeline.py::export_ir_to_png_zip
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import BytesIO, CanonicalHtmlRenderer, capture_html_screenshots, dataclasses, zipfile
from doe_export.pipeline.presentation._presentation_for_static_export import _presentation_for_static_export
from doe_export.pipeline.html._static_export_html import _static_export_html

def export_ir_to_png_zip(
    presentation_ir: dict[str, Any],
    *,
    export_watermark: bool = False,
) -> bytes:
    """Render every slide to a 1920x1080 PNG and return an ordered ZIP archive."""

    presentation = _presentation_for_static_export(presentation_ir)
    renderer = CanonicalHtmlRenderer(mode="embedded")
    output = BytesIO()
    digits = max(3, len(str(len(presentation.slides))))
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_STORED) as archive:
        for start in range(0, len(presentation.slides), 8):
            batch = presentation.slides[start:start + 8]
            items = []
            for offset, slide in enumerate(batch):
                one_slide = dataclasses.replace(presentation, slides=[slide])
                items.append(
                    {
                        "id": str(start + offset),
                        "source": _static_export_html(
                            renderer.render(one_slide),
                            export_watermark=export_watermark,
                        ),
                    }
                )
            screenshots = capture_html_screenshots(
                items,
                viewport=(1280, 720),
                device_scale_factor=1.5,
                timeout_ms=45000,
                concurrency=2,
            )
            for offset, png in enumerate(screenshots):
                if not png.startswith(b"\x89PNG\r\n\x1a\n"):
                    raise ValueError(f"Slide {start + offset + 1} returned an invalid PNG file.")
                archive.writestr(f"slide-{start + offset + 1:0{digits}d}.png", png)
    return output.getvalue()

export_ir_to_png_zip.__module__ = 'pptx_pipeline'
