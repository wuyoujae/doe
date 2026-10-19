from __future__ import annotations

import dataclasses

import atexit

import base64

import copy

import hashlib

import json

import math

import os

import queue

import re

import signal

import shutil

import stat

import subprocess

import threading

from collections import deque

from dataclasses import dataclass

from functools import lru_cache

from io import BytesIO

from pathlib import Path

from typing import Any

from PIL import Image as PILImage

from pptx2html.ir.model import (
    Background,
    Border,
    Bounds,
    BulletInfo,
    Fill,
    GeometryPath,
    GradientStop,
    ImageInfo,
    IconInfo,
    Font,
    Paragraph,
    Presentation,
    Run,
    Shadow,
    Shape,
    Slide,
    TableCell,
    TableInfo,
    TextFrame,
)

from pptx2html.server.image_payload import image_payload

from pptx2html.ir.serde import presentation_from_dict

from pptx2html.ir.text_layout_snapshot import (
    InvalidTextLayoutSnapshot,
    create_layout_snapshot,
    layout_snapshot_is_valid,
    make_text_container_metrics,
    refresh_no_wrap_layout_snapshot,
)

SLIDE_WIDTH = 960.0

SLIDE_HEIGHT = 540.0

DEFAULT_VIEWPORT = (1280, 720)

CANONICAL_VIEWPORT = (1920, 1080)

DEFAULT_TIMEOUT_MS = 20000

DEFAULT_MAX_DOM_NODES = 5000

BROWSER_WORKER_MAX_REQUESTS = 8

BROWSER_WORKER_MAX_RSS_BYTES = 2 * 1024 * 1024 * 1024

_BROWSER_ENV_ALLOWLIST = frozenset(
    {
        "APPDATA",
        "COMSPEC",
        "FONTCONFIG_FILE",
        "FONTCONFIG_PATH",
        "HOME",
        "LANG",
        "LANGUAGE",
        "LC_ALL",
        "LOCALAPPDATA",
        "PATH",
        "PATHEXT",
        "PLAYWRIGHT_BROWSERS_PATH",
        "SYSTEMROOT",
        "TEMP",
        "TMP",
        "TMPDIR",
        "TZ",
        "USERPROFILE",
        "WINDIR",
        "XDG_CACHE_HOME",
        "XDG_CONFIG_HOME",
        "XDG_RUNTIME_DIR",
        "YRKIE_HTMLIR_CHROMIUM_SANDBOX_REQUIRED",
        "YRKIE_DOE_PUBLIC_ROOT",
    }
)

HTML_TEXT_WIDTH_SAFETY = 1.12

CSS_PX_TO_PT = 0.75

CANONICAL_SLIDE_SELECTOR = "section[data-pptx2html-slide]"

_SCRIPT_ELEMENT_PATTERN = re.compile(
    r"<script\b(?P<attributes>[^>]*)>[\s\S]*?</script\s*>",
    re.IGNORECASE,
)

_SCRIPT_OPEN_PATTERN = re.compile(
    r"<script\b(?P<attributes>[^>]*)>",
    re.IGNORECASE,
)

_CANONICAL_SCRIPT_ID_PATTERN = re.compile(
    r"\bid\s*=\s*([\"'])pptx2html-canonical-ir\1",
    re.IGNORECASE,
)

_CANONICAL_SCRIPT_TYPE_PATTERN = re.compile(
    r"\btype\s*=\s*([\"'])application/json\1",
    re.IGNORECASE,
)

_CANONICAL_SCRIPT_MARKER_PATTERN = re.compile(
    r"\bdata-pptx2html-ir\s*=\s*([\"'])1\1",
    re.IGNORECASE,
)

_ESCAPED_HTML_ATTRIBUTE_PATTERN = re.compile(
    r"<[A-Za-z][^<>]{0,8192}\b[A-Za-z_:][\w:.-]*\s*=\s*\\[\"']",
    re.IGNORECASE,
)

_HTML_TAG_PATTERN = re.compile(
    r"<!--[\s\S]*?-->|<![^<>]*>|</?[A-Za-z][^<>]*>",
    re.IGNORECASE,
)

_MARKDOWN_HTML_FENCE_PATTERN = re.compile(
    r"^\s*```(?:html?)?\s*(?P<html>[\s\S]*?)\s*```\s*$",
    re.IGNORECASE,
)

TEXT_TAGS = {"h1", "h2", "h3", "h4", "h5", "h6", "p", "label", "button", "summary"}

INLINE_TEXT_TAGS = {
    "a",
    "abbr",
    "b",
    "bdi",
    "bdo",
    "cite",
    "code",
    "data",
    "dfn",
    "em",
    "i",
    "kbd",
    "mark",
    "q",
    "rp",
    "rt",
    "ruby",
    "s",
    "samp",
    "small",
    "span",
    "strong",
    "sub",
    "sup",
    "time",
    "u",
    "var",
    "wbr",
}

SKIP_TAGS = {"html", "head", "meta", "title", "style", "script", "link", "base", "noscript", "template"}

VOID_TEXT_TAGS = {"img", "svg", "canvas", "video", "audio", "iframe", "object", "embed"}

SVG_GRAPHIC_CHILD_TAGS = {"path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "g", "defs", "clippath", "mask"}

TABLE_TAGS = {"table", "caption", "colgroup", "col", "thead", "tbody", "tfoot", "tr", "td", "th"}

TABLE_CELL_TAGS = {"td", "th"}

TABLE_NATIVE_TEXT_CHILD_TAGS = INLINE_TEXT_TAGS | {"br"}

GENERIC_TEXT_CONTAINER_TAGS = {"div", "li", "td", "th", "caption", "figcaption", "blockquote", "section", "article", "header", "footer"}

EDITABLE_HTML_TAGS = frozenset(
    {
        "a",
        "abbr",
        "article",
        "b",
        "bdi",
        "bdo",
        "blockquote",
        "br",
        "caption",
        "cite",
        "code",
        "col",
        "colgroup",
        "data",
        "dfn",
        "div",
        "ellipse",
        "em",
        "figcaption",
        "footer",
        "g",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "header",
        "hr",
        "i",
        "img",
        "kbd",
        "label",
        "li",
        "line",
        "mark",
        "menu",
        "ol",
        "p",
        "path",
        "polygon",
        "polyline",
        "rect",
        "s",
        "samp",
        "section",
        "small",
        "span",
        "style",
        "strong",
        "sub",
        "sup",
        "svg",
        "table",
        "tbody",
        "td",
        "tfoot",
        "th",
        "thead",
        "time",
        "tr",
        "u",
        "ul",
        "var",
        "wbr",
        "circle",
    }
)

EDITABLE_SVG_TAGS = frozenset(
    {"svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon"}
)

ALWAYS_UNSUPPORTED_EDITABLE_TAGS = frozenset({"q", "ruby", "rp", "rt", "summary"})

SVG_NAMESPACE = "http://www.w3.org/2000/svg"

UNSUPPORTED_SVG_ATTRIBUTES = frozenset(
    {
        "clip",
        "clip-path",
        "clip-rule",
        "filter",
        "fill-rule",
        "marker-end",
        "marker-mid",
        "marker-start",
        "mask",
        "paint-order",
        "pathlength",
        "stroke-dashoffset",
        "transform",
        "vector-effect",
    }
)

def _parent_path(path: str) -> str:
    return path.rsplit(" > ", 1)[0] if " > " in path else ""

_SVG_PATH_TOKEN_RE = re.compile(r"[AaCcHhLlMmQqSsTtVvZz]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?")

__file__ = str(Path(__file__).resolve().parents[3] / 'pptx2html/htmlir/compiler.py')
