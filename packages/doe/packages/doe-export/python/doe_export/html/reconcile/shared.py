from __future__ import annotations

import base64

import binascii

import copy

import hashlib

import re

import xml.etree.ElementTree as ET

from html.parser import HTMLParser

from typing import Any

from pptx2html.htmlir.compiler import HtmlCompileError, compile_html

from pptx2html.asset_content import normalize_transient_asset_payloads

from pptx2html.asset_content import ir_contains_inline_asset

from pptx2html.ir.serde import presentation_from_dict

from pptx2html.renderer import CanonicalHtmlRenderer

_CANONICAL_FRAGMENT_PATTERN = re.compile(
    r"(?P<start><!--\s*PPTX2HTML_SLIDE_START:(?P<index>\d+)\s*-->)"
    r"(?P<fragment>[\s\S]*?)"
    r"(?P<end><!--\s*PPTX2HTML_SLIDE_END:(?P=index)\s*-->)",
    re.IGNORECASE,
)

_CANONICAL_MARKER_PATTERN = re.compile(
    r"<!--\s*PPTX2HTML_SLIDE_(?:START|END):\d+\s*-->",
    re.IGNORECASE,
)

_INLINE_DATA_SCHEME_PATTERN = re.compile(
    r"(?:^|[\s('\"=:])data\s*:",
    re.IGNORECASE,
)

_ASSET_REFERENCE_PATTERN = re.compile(
    r"yrkie-asset-(?P<kind>data|base64)://(?P<asset_id>[0-9a-fA-F]{64})"
)

_CANONICAL_PAYLOAD_SCRIPT_PATTERN = re.compile(
    r"(?P<start><script\b[^>]*\bid=[\"']pptx2html-canonical-ir[\"'][^>]*>)"
    r"(?P<content>[\s\S]*?)"
    r"(?P<end></script\s*>)",
    re.IGNORECASE,
)

_STABLE_RECONCILE_DIAGNOSTICS = {
    "canonical-ir-reconciled",
    "canonical-html-lossless",
    "canonical-html-lossless-snapshot",
}

__all__ = ["reconcile_editable_html_with_current_ir"]
