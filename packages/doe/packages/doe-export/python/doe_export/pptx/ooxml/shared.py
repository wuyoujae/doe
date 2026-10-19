from __future__ import annotations

import copy

import io

import json

import math

import posixpath

import re

import zipfile

from dataclasses import dataclass

from pathlib import Path

from typing import Any

import xml.etree.ElementTree as ET

from PIL import Image as PILImage

from PIL import UnidentifiedImageError

from pptx2html.ir.text_layout_snapshot import (
    InvalidTextLayoutSnapshot,
    make_text_container_metrics,
    materialize_layout_snapshot,
    normalize_htmlir_export_line_edges,
)

from pptx2html.ooxml.safe_xml import parse_xml

from pptx2html.opc.archive_guard import read_archive_entry, validate_pptx_archive

from pptx2html.server.image_payload import MAX_IMAGE_PAYLOAD_BYTES, PPTX_NATIVE_IMAGE_TYPES, has_image_payload, image_payload

P = "http://schemas.openxmlformats.org/presentationml/2006/main"

A = "http://schemas.openxmlformats.org/drawingml/2006/main"

R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

REL = "http://schemas.openxmlformats.org/package/2006/relationships"

CT = "http://schemas.openxmlformats.org/package/2006/content-types"

MC = "http://schemas.openxmlformats.org/markup-compatibility/2006"

XML = "http://www.w3.org/XML/1998/namespace"

ASVG = "http://schemas.microsoft.com/office/drawing/2016/SVG/main"

IMAGE_REL_TYPE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"

SLIDE_REL_TYPE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide"

NOTES_SLIDE_REL_TYPE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide"

TABLE_URI = "http://schemas.openxmlformats.org/drawingml/2006/table"

SVG_BLIP_EXT_URI = "{96DAC541-7B7A-43D3-8B79-37D633B846F1}"

OOXML_PERCENT_MIN = -(2**31)

OOXML_PERCENT_MAX = 2**31 - 1

ET.register_namespace("p", P)

ET.register_namespace("a", A)

ET.register_namespace("r", R)

ET.register_namespace("mc", MC)

EMU_PER_PT = 12700

SVG_PATH_TOKEN_RE = re.compile(r"[A-Za-z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?")

XMLNS_DECL_RE = re.compile(rb"\sxmlns:([A-Za-z_][\w.-]*)=[\"']([^\"']+)[\"']")

RESERVED_GENERATED_PREFIX_RE = re.compile(r"ns\d+$")
