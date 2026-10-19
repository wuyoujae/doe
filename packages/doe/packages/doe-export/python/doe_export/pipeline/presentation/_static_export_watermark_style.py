# Origin: pptx_pipeline.py::_static_export_watermark_style
from __future__ import annotations
from doe_export.pipeline.shared import WATERMARK_BOTTOM_PT, WATERMARK_HEIGHT_PT, WATERMARK_RIGHT_PT, WATERMARK_WIDTH_PT, export_watermark_data_uri

def _static_export_watermark_style() -> str:
    return f"""
<style id="yrkie-export-watermark-style">
.pptx-slide.pptx-canonical-slide {{
  position: relative !important;
}}
.pptx-slide.pptx-canonical-slide::after {{
  content: "";
  position: absolute;
  right: {WATERMARK_RIGHT_PT:g}pt;
  bottom: {WATERMARK_BOTTOM_PT:g}pt;
  width: {WATERMARK_WIDTH_PT:g}pt;
  height: {WATERMARK_HEIGHT_PT:g}pt;
  z-index: 2147483647;
  display: block;
  pointer-events: none;
  user-select: none;
  background: url("{export_watermark_data_uri()}") center / contain no-repeat;
}}
</style>
"""

_static_export_watermark_style.__module__ = 'pptx_pipeline'
