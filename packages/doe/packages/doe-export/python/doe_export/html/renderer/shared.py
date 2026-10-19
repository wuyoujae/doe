from __future__ import annotations
import base64

import html

import math

import os

import re

from io import BytesIO

from typing import Optional

from urllib.parse import quote

from PIL import Image

from pptx2html.asset_content import css_font_format

from pptx2html.ooxml.color import normalize_hex_color

from pptx2html.ir.model import (
    Border,
    Fill,
    Presentation as IRPresentation,
    Shape,
    TableCell,
    TextFrame,
)

from pptx2html.renderer.css import VIEWER_CSS, GEOMETRY_CSS

from pptx2html.renderer.js import VIEWER_JS

