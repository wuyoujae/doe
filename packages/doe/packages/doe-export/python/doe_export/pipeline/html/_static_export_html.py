# Origin: pptx_pipeline.py::_static_export_html
from __future__ import annotations
from doe_export.pipeline.shared import _CANONICAL_PAYLOAD_PATTERN, _STATIC_EXPORT_STYLE
from doe_export.pipeline.presentation._static_export_watermark_style import _static_export_watermark_style

def _static_export_html(
    source: str,
    *,
    export_watermark: bool = False,
    page_width_pt: float = 960.0,
    page_height_pt: float = 540.0,
    screen_viewport: tuple[int, int] = (1280, 720),
) -> str:
    compact = _CANONICAL_PAYLOAD_PATTERN.sub("", source)
    styles = _STATIC_EXPORT_STYLE.replace(
        "@page { size: 960pt 540pt;",
        f"@page {{ size: {page_width_pt:g}pt {page_height_pt:g}pt;",
        1,
    )
    styles = styles.replace(
        "width: 1280px !important;",
        f"width: {screen_viewport[0]}px !important;",
        1,
    ).replace(
        "height: 720px !important;",
        f"height: {screen_viewport[1]}px !important;",
        1,
    )
    if export_watermark:
        styles += _static_export_watermark_style()
    if "</head>" in compact:
        return compact.replace("</head>", f"{styles}</head>", 1)
    return f"{styles}{compact}"

_static_export_html.__module__ = 'pptx_pipeline'
