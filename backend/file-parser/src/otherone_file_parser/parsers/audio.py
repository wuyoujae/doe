from __future__ import annotations

from otherone_file_parser.api.errors import ErrorCode, ParserError


def parse_audio_attachment(*_args, **_kwargs):
    """Reserved entry point for a later audio attachment parser."""
    raise ParserError(ErrorCode.NOT_IMPLEMENTED)
