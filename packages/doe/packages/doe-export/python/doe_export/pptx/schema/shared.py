from __future__ import annotations


import base64

import binascii

import io

import json

import os

import shutil

import stat

import subprocess

from pathlib import Path

from typing import Any


from PIL import Image

from pptx import Presentation

from pptx.util import Pt


from pptx2html.server.export_watermark import apply_pptx_export_watermark

from pptx_pipeline import export_ir_to_pptx, parse_html_to_ir

from schema_v4_fonts import embed_schema_v4_fonts

from schema_v4_native import apply_schema_v4_native_components



RUNTIME_ROOT = Path(__file__).resolve().parents[3]

RENDERER_CONTRACT = "yrkie-doe-schema-v4-server-renderer-v101"

COMPILER_CONTRACT = "htmlir-semantic-schema-v4-v6"

WRITER_CONTRACT = "pptx2html-source-free-schema-native-fonts-v6"

MAX_RENDERER_STDOUT_BYTES = 192 * 1024 * 1024

MAX_SLIDES = 300

SLIDE_WIDTH_PT = 960

SLIDE_HEIGHT_PT = 540

SCREENSHOT_WIDTH_PX = 1280

SCREENSHOT_HEIGHT_PX = 720

THUMBNAIL_WIDTH_PX = 640

THUMBNAIL_HEIGHT_PX = 360

MAX_THUMBNAIL_BYTES = 2 * 1024 * 1024

MAX_SCREENSHOT_BYTES = 32 * 1024 * 1024



class SchemaV4ExportError(ValueError):
    pass



__all__ = [
    "COMPILER_CONTRACT",
    "RENDERER_CONTRACT",
    "SchemaV4ExportError",
    "WRITER_CONTRACT",
    "export_schema_v4_deck_to_pptx",
    "render_schema_v4_thumbnail",
]

SchemaV4ExportError.__module__ = 'schema_v4_export'
