from __future__ import annotations


from dataclasses import dataclass

import hashlib

from io import BytesIO

import os

import posixpath

import re

import struct

import tempfile

import threading

from pathlib import Path

from typing import Any, Iterable

from zipfile import ZIP_DEFLATED, ZipFile


from fontTools import subset

from fontTools.ttLib import TTFont

from fontTools.varLib.instancer import instantiateVariableFont

from lxml import etree



FONT_RELATIONSHIP_TYPE = (
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/font"
)

FONT_CONTENT_TYPE = "application/x-fontdata"

PML_NS = "http://schemas.openxmlformats.org/presentationml/2006/main"

OFFICE_REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

PACKAGE_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"

CONTENT_TYPES_NS = "http://schemas.openxmlformats.org/package/2006/content-types"

MAX_FONT_SOURCE_BYTES = 32 * 1024 * 1024

MAX_FONT_SUBSET_BYTES = 32 * 1024 * 1024

BASE_CODEPOINTS = frozenset({0x00A0, *range(0x20, 0x7F)})

FONT_CACHE_CONTRACT = "powerpoint-font-subset-v2"

_FONT_CACHE_LOCK = threading.RLock()



@dataclass(frozen=True)
class TrustedFontFace:
    family: str
    style: str
    weight: int
    slot: str
    path: Path
    source_families: tuple[str, ...] = ()



@dataclass(frozen=True)
class PreparedFontFace:
    family: str
    style: str
    weight: int
    slot: str
    font_part_bytes: bytes
    panose: str
    used_codepoints: int
    missing_codepoints: tuple[int, ...]



__all__ = [
    "embed_schema_v4_fonts",
    "embed_traditional_slide_fonts",
    "remove_embedded_fonts",
    "trusted_schema_v4_fonts",
    "trusted_traditional_slide_fonts",
]

TrustedFontFace.__module__ = 'schema_v4_fonts'
PreparedFontFace.__module__ = 'schema_v4_fonts'
