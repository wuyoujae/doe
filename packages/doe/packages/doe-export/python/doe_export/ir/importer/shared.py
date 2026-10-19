from __future__ import annotations
import base64

import colorsys

import copy

import hashlib

import math

import os

import re

import struct

import subprocess

import tempfile

import threading

import xml.etree.ElementTree as ET

from collections import OrderedDict

from io import BytesIO

from pathlib import Path

from typing import Optional

try:
    from PIL import Image, ImageOps
except Exception:  # pragma: no cover - optional runtime dependency
    Image = None
    ImageOps = None

from pptx2html.asset_content import font_content_type_from_magic

from pptx2html.ooxml.color import normalize_hex_color

from pptx2html.ooxml.units import emu_to_pt, percentage_to_float

from pptx2html.ooxml.values import parse_bool

from pptx2html.ooxml.xml import local_name

from pptx2html.ir.geometry import GeometryBuilder

from pptx2html.ir.model import (
    Background,
    AnimationStep,
    Border,
    Bounds,
    BulletInfo,
    ChartInfo,
    ChartSeries,
    EmbeddedFont,
    Fill,
    Font,
    GradientStop,
    ImageInfo,
    Paragraph,
    PlaceholderInfo,
    Presentation as IRPresentation,
    Run,
    Shadow,
    Shape,
    Slide as IRSlide,
    SlideTransition,
    TableCell,
    TableInfo,
    TabStop,
    TextFrame,
    ThreeDInfo,
)

from pptx2html.opc.constants import NAMESPACE, RELATIONSHIP_TYPE, TARGET_MODE

from pptx2html.opc.packuri import PackURI

from pptx2html.pom.presentation import Presentation as PomPresentation

from pptx2html.pom.parts import SlidePart, BaseSlidePart

from pptx2html.pom.shapes import (
    AutoShape,
    BaseShape,
    Connector,
    GraphicFrame,
    GroupShape,
    Picture,
    ShapeTree,
)

from pptx2html.pom.text import TextFrame as PomTextFrame

_METAFILE_CONTENT_TYPES = {
    "image/x-emf",
    "image/emf",
    "application/emf",
    "image/x-wmf",
    "image/wmf",
    "application/wmf",
}

_METAFILE_EXTENSIONS = {".emf", ".wmf"}

_METAFILE_CACHE_MAX_ENTRIES = 64

_METAFILE_CACHE_MAX_BYTES = 64 * 1024 * 1024

_EMF_CONTENT_TYPES = {"image/x-emf", "image/emf", "application/emf"}

_EMF2SVG_DEFAULT_EXECUTABLE = "/usr/bin/emf2svg-conv"

_EMF2SVG_EXECUTABLE_ENV = "YRKIE_EMF2SVG_PATH"

_EMF2SVG_TIMEOUT_SECONDS = 15

_EMF2SVG_MAX_DIMENSION = 4096

_PREVIEW_IMAGE_MAX_PIXELS = 40_000_000

_EMF2SVG_MAX_OUTPUT_BYTES = 16 * 1024 * 1024

_EMF2SVG_MAX_ELEMENTS = 200_000

_EMF2SVG_MAX_COORDINATE = 10_000_000.0

_EMF2SVG_MAX_ROOT_DIMENSION_PT = _EMF2SVG_MAX_DIMENSION * 72.0 / 96.0

_EMF2SVG_SVG_NAMESPACE = "http://www.w3.org/2000/svg"

_EMF2SVG_XLINK_NAMESPACE = "http://www.w3.org/1999/xlink"

_EMF2SVG_XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace"

_EMF2SVG_ALLOWED_ELEMENTS = {
    "circle",
    "clippath",
    "defs",
    "ellipse",
    "g",
    "image",
    "line",
    "lineargradient",
    "path",
    "pattern",
    "polygon",
    "polyline",
    "radialgradient",
    "rect",
    "stop",
    "svg",
    "text",
    "tspan",
}

_EMF2SVG_ALLOWED_ATTRIBUTES = {
    "baseline-shift",
    "clip-path",
    "clip-rule",
    "clippathunits",
    "color",
    "cx",
    "cy",
    "d",
    "direction",
    "display",
    "dominant-baseline",
    "dx",
    "dy",
    "fill",
    "fill-opacity",
    "fill-rule",
    "font-family",
    "font-size",
    "font-stretch",
    "font-style",
    "font-variant",
    "font-weight",
    "gradienttransform",
    "gradientunits",
    "height",
    "href",
    "id",
    "letter-spacing",
    "offset",
    "opacity",
    "patterncontentunits",
    "patterntransform",
    "patternunits",
    "points",
    "preserveaspectratio",
    "r",
    "rx",
    "ry",
    "space",
    "spreadmethod",
    "stop-color",
    "stop-opacity",
    "stroke",
    "stroke-dasharray",
    "stroke-dashoffset",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-miterlimit",
    "stroke-opacity",
    "stroke-width",
    "style",
    "text-anchor",
    "text-decoration",
    "transform",
    "unicode-bidi",
    "vector-effect",
    "version",
    "viewbox",
    "visibility",
    "width",
    "word-spacing",
    "writing-mode",
    "x",
    "x1",
    "x2",
    "y",
    "y1",
    "y2",
}

_EMF2SVG_NUMERIC_ATTRIBUTES = {
    "baseline-shift",
    "cx",
    "cy",
    "d",
    "dx",
    "dy",
    "fill-opacity",
    "font-size",
    "font-weight",
    "height",
    "letter-spacing",
    "offset",
    "opacity",
    "points",
    "r",
    "rx",
    "ry",
    "stop-opacity",
    "stroke-dasharray",
    "stroke-dashoffset",
    "stroke-miterlimit",
    "stroke-opacity",
    "stroke-width",
    "transform",
    "viewbox",
    "width",
    "word-spacing",
    "x",
    "x1",
    "x2",
    "y",
    "y1",
    "y2",
}

_EMF2SVG_NUMBER_PATTERN = re.compile(
    r"[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?"
)

_EMF2SVG_ALLOWED_DATA_IMAGE_PREFIXES = (
    "data:image/png;base64,",
    "data:image/jpeg;base64,",
    "data:image/jpg;base64,",
    "data:image/gif;base64,",
    "data:image/webp;base64,",
    "data:image/bmp;base64,",
    "data:image/x-ms-bmp;base64,",
)

_SVG_CONTENT_TYPES = {"image/svg+xml", "image/svg"}

_DEFAULT_COLOR_MAP = {
    "bg1": "lt1",
    "tx1": "dk1",
    "bg2": "lt2",
    "tx2": "dk2",
}

_DEFAULT_TEXT_MARGINS_PT = {
    "left": 7.2,
    "right": 7.2,
    "top": 3.6,
    "bottom": 3.6,
}

class _BoundedMetafileCache:
    def __init__(self, *, max_entries: int, max_bytes: int):
        self._max_entries = max_entries
        self._max_bytes = max_bytes
        self._entries: OrderedDict[str, tuple[str, bytes]] = OrderedDict()
        self._bytes = 0
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[tuple[str, bytes]]:
        with self._lock:
            cached = self._entries.pop(key, None)
            if cached is None:
                return None
            self._entries[key] = cached
            return cached

    def put(self, key: str, value: tuple[str, bytes]) -> None:
        value_size = len(value[1])
        if value_size > self._max_bytes:
            return
        with self._lock:
            replaced = self._entries.pop(key, None)
            if replaced is not None:
                self._bytes -= len(replaced[1])
            self._entries[key] = value
            self._bytes += value_size
            while len(self._entries) > self._max_entries or self._bytes > self._max_bytes:
                _, evicted = self._entries.popitem(last=False)
                self._bytes -= len(evicted[1])

    def clear(self) -> None:
        with self._lock:
            self._entries.clear()
            self._bytes = 0

    @property
    def total_bytes(self) -> int:
        with self._lock:
            return self._bytes

    def __len__(self) -> int:
        with self._lock:
            return len(self._entries)

_METAFILE_CACHE = _BoundedMetafileCache(
    max_entries=_METAFILE_CACHE_MAX_ENTRIES,
    max_bytes=_METAFILE_CACHE_MAX_BYTES,
)

_BoundedMetafileCache.__module__ = 'pptx2html.ir.builder'
