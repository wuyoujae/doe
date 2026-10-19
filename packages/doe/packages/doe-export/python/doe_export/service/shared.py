from __future__ import annotations

import argparse

import base64

import binascii

import hmac

import ipaddress

import io

import json

import os

import sys

import threading

from collections import defaultdict

from http import HTTPStatus

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from pathlib import Path

from typing import Any

from urllib.parse import urlparse

from PIL import Image

from operational_error_reporter import OperationalErrorReporter

from browser_font_subset import (
    BrowserFontSubsetError,
    decode_source_font,
    subset_browser_font_isolated,
)

RUNTIME_ROOT = Path(__file__).resolve().parents[2]

if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from pptx2html.htmlir import (  # noqa: E402
    HtmlCompileError,
    reconcile_editable_html_with_current_ir,
    warm_browser_snapshot_worker,
)

from pptx_pipeline import (  # noqa: E402
    extract_editable_slide_html,
    export_ir_to_pptx,
    export_ir_to_pdf,
    export_ir_to_png_zip,
    export_ir_to_html,
    html_to_pptx,
    import_pptx_to_canonical,
    render_ir_to_slide_document,
    render_ir_to_canonical,
    render_ir_preview_png,
    parse_html_to_ir,
    parse_slide_fragments_to_ir,
)

from schema_v4_export import (  # noqa: E402
    SchemaV4ExportError,
    export_schema_v4_deck_to_pptx,
    render_schema_v4_thumbnail,
)

from slide_repair_render_gate import (  # noqa: E402
    SlideRepairRenderGateError,
    validate_slide_repair_deck,
)

RUNTIME_TOKEN_ENV = "YRKIE_HTMLIR_RUNTIME_TOKEN"

ALLOWED_HOSTS_ENV = "YRKIE_HTMLIR_ALLOWED_HOSTS"

MIN_RUNTIME_TOKEN_BYTES = 32

MAX_JSON_BODY_BYTES = 48 * 1024 * 1024

MAX_COPYIST_EXPORT_BODY_BYTES = 150 * 1024 * 1024

MAX_COPYIST_V2_BODY_BYTES = 150 * 1024 * 1024

MAX_HTML_EXPORT_BYTES = 256 * 1024 * 1024

MAX_PPTX_IMPORT_BYTES = 100 * 1024 * 1024

MAX_SOURCE_PPTX_BYTES = 100 * 1024 * 1024

MAX_BATCH_ITEMS = 32

MAX_BATCH_CONCURRENCY = 4

MAX_BROWSER_TIMEOUT_MS = 30_000

MAX_DOM_NODES = 5_000

MAX_VIEWPORT_DIMENSION = 4_096

MAX_JSON_NODES = 250_000

MAX_JSON_DEPTH = 64

MAX_PRESENTATION_SLIDES = 300

MAX_PREVIEW_THUMBNAIL_EDGE = 320

SOCKET_TIMEOUT_SECONDS = 30

JSON_CONTENT_TYPES = frozenset({"application/json"})

PPTX_CONTENT_TYPES = frozenset(
    {
        "application/octet-stream",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    }
)

POST_ROUTES = frozenset(
    {
        "/api/html/compile",
        "/api/pptx/import",
        "/api/ir/canonical-html",
        "/api/ir/export-html",
        "/api/v2/slides/extract-editable",
        "/api/v2/slides/compile",
        "/api/v2/slides/render",
        "/api/v2/fonts/subset",
        "/api/v1/slides/compile-batch",
        "/api/ir/export-pptx",
        "/api/ir/export-pdf",
        "/api/ir/export-png-zip",
        "/api/html/export-pptx",
        "/api/schema-v4/export-pptx",
        "/api/schema-v4/export-pdf",
        "/api/schema-v4/render-thumbnail",
        "/api/schema-v4/inspect-slide",
        "/api/schema-v4/validate-repair",
    }
)

PALETTE_VERSION = "six-region-v1"
