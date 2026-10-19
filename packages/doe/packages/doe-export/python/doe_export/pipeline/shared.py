from __future__ import annotations

import dataclasses

import os

import base64

import binascii

import copy

import hashlib

import json

import logging

import math

import re

import zipfile

import tempfile

import sys

import xml.etree.ElementTree as ET

from io import BytesIO

from html.parser import HTMLParser

from pathlib import Path

from typing import Any

from urllib.parse import unquote_to_bytes

RUNTIME_ROOT = Path(__file__).resolve().parents[2]

if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from pptx2html.htmlir import (
    HtmlCompileError,
    capture_html_screenshots,
    compile_html,
    compile_slide_fragment,
    compile_slide_fragments,
    recover_serialized_html_source,
    print_html_to_pdf,
)

from pptx2html import Presentation as PomPresentation

from pptx2html.asset_content import (
    font_content_type_from_magic,
    ir_contains_inline_asset,
    normalize_transient_asset_payloads,
)

from pptx2html.ir.builder import PresentationBuilder

from pptx2html.ir.serde import presentation_from_dict

from pptx2html.ir.text_layout_snapshot import (
    InvalidTextLayoutSnapshot,
    layout_snapshot_is_valid,
    make_text_container_metrics,
    refresh_no_wrap_layout_snapshot,
)

from pptx2html.opc.archive_guard import validate_pptx_archive

from pptx2html.renderer import CanonicalHtmlRenderer

from pptx2html.server.export_watermark import (
    WATERMARK_BOTTOM_PT,
    WATERMARK_HEIGHT_PT,
    WATERMARK_RIGHT_PT,
    WATERMARK_WIDTH_PT,
    apply_pptx_export_watermark,
    export_watermark_data_uri,
    remove_pptx_export_watermark,
)

from pptx2html.server.pptx_writer import write_pptx_from_ir

from schema_v4_fonts import embed_traditional_slide_fonts, remove_embedded_fonts

_CANONICAL_PAYLOAD_PATTERN = re.compile(
    r'<script\b[^>]*\bid=["\']pptx2html-canonical-ir["\'][^>]*>[\s\S]*?</script>',
    re.IGNORECASE,
)

_LOGGER = logging.getLogger('pptx_pipeline')

COPYIST_PARSER_VERSION = "pptx2html-canonical-v4"

_SLIDE_COORDINATE_WIDTH_KEY = "_yrkie_slide_width"

_SLIDE_COORDINATE_HEIGHT_KEY = "_yrkie_slide_height"

_SOURCE_SLIDE_INDEX_KEY = "_yrkie_source_slide_index"

_CANONICAL_PAYLOAD_CONTENT_PATTERN = re.compile(
    r'(?P<open><script\b[^>]*\bid=["\']pptx2html-canonical-ir["\'][^>]*>)'
    r'(?P<content>[\s\S]*?)'
    r'(?P<close></script\s*>)',
    re.IGNORECASE,
)

_CANONICAL_SLIDE_FRAGMENT_PATTERN = re.compile(
    r'<!--\s*PPTX2HTML_SLIDE_START:(?P<index>\d+)\s*-->'
    r'[\s\S]*?'
    r'<!--\s*PPTX2HTML_SLIDE_END:(?P=index)\s*-->',
    re.IGNORECASE,
)

_CANONICAL_EDITABLE_FRAGMENT_PATTERN = re.compile(
    r'<!--\s*PPTX2HTML_SLIDE_START:(?P<index>\d+)\s*-->'
    r'(?P<fragment>[\s\S]*?)'
    r'<!--\s*PPTX2HTML_SLIDE_END:(?P=index)\s*-->',
    re.IGNORECASE,
)

_EXTERNAL_RESOURCE_SCHEME_PATTERN = re.compile(
    r"^\s*(?:https?|file|blob):",
    re.IGNORECASE,
)

_EXTERNAL_CSS_RESOURCE_PATTERN = re.compile(
    r"url\(\s*(?:[\"']|&(?:quot|#x27);)?\s*(?:https?|file|blob):",
    re.IGNORECASE,
)

_RESOURCE_ELEMENT_PATTERN = re.compile(
    r"<(?:img|image|source|video|audio)\b[^>]*\b(?:src|href|xlink:href)"
    r"\s*=\s*[\"']\s*(?:https?|file|blob):",
    re.IGNORECASE,
)

_STYLE_BLOCK_PATTERN = re.compile(
    r"<style\b[^>]*>(?P<css>[\s\S]*?)</style\s*>",
    re.IGNORECASE,
)

_STYLE_ATTRIBUTE_PATTERN = re.compile(
    r"\bstyle\s*=\s*(?P<quote>[\"'])(?P<css>[\s\S]*?)(?P=quote)",
    re.IGNORECASE,
)

_SVG_EXTERNAL_RESOURCE_PATTERN = re.compile(
    r"<(?:image|use)\b[^>]*\b(?:href|xlink:href)\s*=\s*[\"']\s*"
    r"(?:https?|file|blob):",
    re.IGNORECASE,
)

_STATIC_EXPORT_STYLE = """
<style id="yrkie-static-export-style">
@page { size: 960pt 540pt; margin: 0; }
html, body {
  margin: 0 !important;
  padding: 0 !important;
  background: #ffffff !important;
}
.pptx-canonical-deck {
  align-items: flex-start !important;
  gap: 0 !important;
  padding: 0 !important;
}
.pptx-slide.pptx-canonical-slide { box-shadow: none !important; }
.pptx-slide.pptx-canonical-slide:last-child {
  break-after: auto !important;
  page-break-after: auto !important;
}
@media screen {
  html, body {
    width: 1280px !important;
    height: 720px !important;
    overflow: hidden !important;
  }
}
@media print {
  html, body {
    width: auto !important;
    height: auto !important;
    overflow: visible !important;
  }
}
</style>
"""

_DATA_URL_PATTERN = re.compile(
    r"data:(?P<content_type>[a-zA-Z0-9.+-]+/[a-zA-Z0-9.+-]+);base64,(?P<data>[A-Za-z0-9+/=\r\n]+)"
)

_PERCENT_SVG_DATA_URL_PATTERN = re.compile(
    r"data:image/svg\+xml(?:;charset=[a-zA-Z0-9._-]+)?,"
    r"(?P<data>[A-Za-z0-9%/:;,+_=.\-]+)",
    re.IGNORECASE,
)

_ANY_DATA_URL_PATTERN = re.compile(
    r"data:[a-zA-Z0-9.+-]+/[a-zA-Z0-9.+-]+(?:;[^,\s\"']*)?,",
    re.IGNORECASE,
)

_ASSET_REFERENCE_PATTERN = re.compile(
    r"yrkie-asset-(?P<kind>data|base64)://(?P<asset_id>[0-9a-fA-F]{64})"
)

_TRANSPARENT_PIXEL_DATA_URL = (
    "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
)

_ACTIVE_SVG_TAGS = frozenset(
    {
        "script",
        "foreignobject",
        "iframe",
        "object",
        "embed",
        "audio",
        "video",
        "animate",
        "animatemotion",
        "animatetransform",
        "set",
    }
)

_SAFE_RASTER_DATA_URL_PATTERN = re.compile(
    r"^data:image/(?:png|jpe?g|gif|webp|bmp|avif);base64,"
    r"[A-Za-z0-9+/=\s]+$",
    re.IGNORECASE,
)

_SVG_CSS_URL_PATTERN = re.compile(
    r"url\s*\(\s*(?P<quote>['\"]?)(?P<value>.*?)"
    r"(?P=quote)\s*\)",
    re.IGNORECASE | re.DOTALL,
)

FORBIDDEN_SLIDE_TAGS = {"html", "head", "body", "script", "link", "iframe", "object", "embed", "form"}

VOID_SLIDE_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}

SLIDE_ROOT_TAGS = {"div", "section"}

_DOCUMENT_PADDING_PATTERN = re.compile(
    r"(?:\s|<!--[\s\S]*?-->|<!doctype\b[^>]*>)*\Z",
    re.IGNORECASE,
)
