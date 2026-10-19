# Origin: pptx2html/server/ooxml_pptx_writer.py::RoundtripFallbackRequired
from __future__ import annotations

class RoundtripFallbackRequired(RuntimeError):
    """The requested edit cannot be represented by safe source package patching."""

RoundtripFallbackRequired.__module__ = 'pptx2html.server.ooxml_pptx_writer'
