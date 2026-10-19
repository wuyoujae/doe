from __future__ import annotations

import base64
import binascii
import hashlib
import io
import logging
import multiprocessing
import unicodedata
from dataclasses import dataclass
from typing import Any

from fontTools import subset
from fontTools.ttLib import TTFont, TTLibError


BROWSER_FONT_SUBSET_VERSION = "fonttools-v1"
MAX_SOURCE_FONT_BYTES = 32 * 1024 * 1024
MAX_BROWSER_FONT_BYTES = 2 * 1024 * 1024
MAX_UNIQUE_CHARACTERS = 16_384
BROWSER_FONT_SUBSET_TIMEOUT_SECONDS = 12.0

_RESTRICTED_LICENSE_EMBEDDING = 0x0002
_NO_SUBSETTING = 0x0100


class BrowserFontSubsetError(ValueError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


@dataclass(frozen=True)
class BrowserFontSubsetResult:
    content_type: str
    data: bytes
    sha256: str
    source_sha256: str
    glyph_set_sha256: str
    character_count: int
    license_fstype: int
    subsetter_version: str = BROWSER_FONT_SUBSET_VERSION

    def to_dict(self) -> dict[str, Any]:
        return {
            "content_type": self.content_type,
            "data_base64": base64.b64encode(self.data).decode("ascii"),
            "size_bytes": len(self.data),
            "sha256": self.sha256,
            "source_sha256": self.source_sha256,
            "glyph_set_sha256": self.glyph_set_sha256,
            "character_count": self.character_count,
            "license_fstype": self.license_fstype,
            "subsetter_version": self.subsetter_version,
        }


def normalize_subset_characters(value: str) -> str:
    if not isinstance(value, str):
        raise BrowserFontSubsetError(
            "browser-font-invalid-characters",
            "characters must be a string.",
        )
    normalized = unicodedata.normalize("NFC", value)
    characters = sorted(
        {
            character
            for character in normalized
            if character not in {"\x00", "\ufeff"}
            and (character.isspace() or unicodedata.category(character)[0] != "C")
        },
        key=ord,
    )
    if not characters:
        characters = [" "]
    if len(characters) > MAX_UNIQUE_CHARACTERS:
        raise BrowserFontSubsetError(
            "browser-font-too-many-characters",
            f"Font subsetting accepts at most {MAX_UNIQUE_CHARACTERS} unique characters.",
        )
    return "".join(characters)


def decode_source_font(data_base64: str) -> bytes:
    if not isinstance(data_base64, str) or not data_base64:
        raise BrowserFontSubsetError(
            "browser-font-invalid-source",
            "font_data_base64 must be a non-empty string.",
        )
    try:
        raw = base64.b64decode(data_base64, validate=True)
    except (binascii.Error, ValueError) as error:
        raise BrowserFontSubsetError(
            "browser-font-invalid-source",
            "font_data_base64 is invalid.",
        ) from error
    if not raw or len(raw) > MAX_SOURCE_FONT_BYTES:
        raise BrowserFontSubsetError(
            "browser-font-source-too-large",
            f"Source font must contain between 1 and {MAX_SOURCE_FONT_BYTES} bytes.",
        )
    return raw


def subset_browser_font(
    source_font: bytes,
    characters: str,
    *,
    face_index: int = 0,
) -> BrowserFontSubsetResult:
    if not isinstance(source_font, bytes) or not source_font:
        raise BrowserFontSubsetError(
            "browser-font-invalid-source",
            "Source font bytes are required.",
        )
    if len(source_font) > MAX_SOURCE_FONT_BYTES:
        raise BrowserFontSubsetError(
            "browser-font-source-too-large",
            f"Source font cannot exceed {MAX_SOURCE_FONT_BYTES} bytes.",
        )
    if not isinstance(face_index, int) or isinstance(face_index, bool) or face_index < 0:
        raise BrowserFontSubsetError(
            "browser-font-invalid-face-index",
            "face_index must be a non-negative integer.",
        )
    normalized_characters = normalize_subset_characters(characters)
    source_sha256 = hashlib.sha256(source_font).hexdigest()
    glyph_set_sha256 = hashlib.sha256(normalized_characters.encode("utf-8")).hexdigest()

    try:
        font = TTFont(
            io.BytesIO(source_font),
            fontNumber=face_index,
            lazy=False,
            recalcTimestamp=False,
        )
    except (TTLibError, ValueError, IndexError) as error:
        raise BrowserFontSubsetError(
            "browser-font-unsupported-source",
            "Source font cannot be decoded as a supported OpenType font.",
        ) from error

    try:
        license_fstype = int(getattr(font.get("OS/2"), "fsType", 0) or 0)
        if license_fstype & _RESTRICTED_LICENSE_EMBEDDING:
            raise BrowserFontSubsetError(
                "browser-font-license-restricted",
                "The source font license forbids editable embedding.",
            )
        if license_fstype & _NO_SUBSETTING:
            raise BrowserFontSubsetError(
                "browser-font-license-no-subsetting",
                "The source font license forbids subsetting.",
            )

        options = subset.Options()
        options.flavor = "woff2"
        options.with_zopfli = False
        options.hinting = True
        options.desubroutinize = False
        options.recalc_bounds = True
        options.recalc_timestamp = False
        options.canonical_order = True
        options.layout_features = ["*"]
        options.name_IDs = ["*"]
        options.name_legacy = True
        options.name_languages = ["*"]
        options.notdef_glyph = True
        options.notdef_outline = True
        options.recommended_glyphs = True
        options.drop_tables = []

        subsetter = subset.Subsetter(options=options)
        subsetter.populate(text=normalized_characters)
        subsetter.subset(font)
        font.flavor = "woff2"
        output = io.BytesIO()
        font.save(output, reorderTables=True)
        browser_font = output.getvalue()
    except BrowserFontSubsetError:
        raise
    except Exception as error:
        raise BrowserFontSubsetError(
            "browser-font-subset-failed",
            "Source font could not be converted into a browser font subset.",
        ) from error
    finally:
        font.close()

    if not browser_font or len(browser_font) > MAX_BROWSER_FONT_BYTES:
        raise BrowserFontSubsetError(
            "browser-font-subset-too-large",
            f"Browser font subset cannot exceed {MAX_BROWSER_FONT_BYTES} bytes.",
        )
    return BrowserFontSubsetResult(
        content_type="font/woff2",
        data=browser_font,
        sha256=hashlib.sha256(browser_font).hexdigest(),
        source_sha256=source_sha256,
        glyph_set_sha256=glyph_set_sha256,
        character_count=len(normalized_characters),
        license_fstype=license_fstype,
    )


def subset_browser_font_isolated(
    source_font: bytes,
    characters: str,
    *,
    face_index: int = 0,
    timeout_seconds: float = BROWSER_FONT_SUBSET_TIMEOUT_SECONDS,
) -> BrowserFontSubsetResult:
    if not isinstance(timeout_seconds, (int, float)) or timeout_seconds <= 0:
        raise BrowserFontSubsetError(
            "browser-font-invalid-timeout",
            "Font subset timeout must be positive.",
        )
    context = multiprocessing.get_context("spawn")
    receive, send = context.Pipe(duplex=False)
    process = context.Process(
        target=_subset_browser_font_worker,
        args=(source_font, characters, face_index, send),
        daemon=True,
    )
    try:
        process.start()
        send.close()
        if not receive.poll(timeout_seconds):
            process.terminate()
            process.join(timeout=1.0)
            if process.is_alive():
                process.kill()
                process.join(timeout=1.0)
            raise BrowserFontSubsetError(
                "browser-font-subset-timeout",
                "Browser font subsetting exceeded its isolated worker deadline.",
            )
        kind, payload = receive.recv()
        process.join(timeout=1.0)
    except BrowserFontSubsetError:
        raise
    except (EOFError, OSError) as error:
        raise BrowserFontSubsetError(
            "browser-font-worker-failed",
            "Browser font subsetting worker stopped unexpectedly.",
        ) from error
    finally:
        receive.close()
        if process.is_alive():
            process.terminate()
            process.join(timeout=1.0)

    if kind == "ok" and isinstance(payload, BrowserFontSubsetResult):
        return payload
    if (
        kind == "error"
        and isinstance(payload, tuple)
        and len(payload) == 2
        and all(isinstance(value, str) for value in payload)
    ):
        raise BrowserFontSubsetError(payload[0], payload[1])
    raise BrowserFontSubsetError(
        "browser-font-worker-failed",
        "Browser font subsetting worker returned an invalid result.",
    )


def _subset_browser_font_worker(
    source_font: bytes,
    characters: str,
    face_index: int,
    connection: Any,
) -> None:
    try:
        logging.getLogger("fontTools.subset").setLevel(logging.ERROR)
        result = subset_browser_font(
            source_font,
            characters,
            face_index=face_index,
        )
        connection.send(("ok", result))
    except BrowserFontSubsetError as error:
        connection.send(("error", (error.code, str(error))))
    except Exception:
        connection.send(
            (
                "error",
                (
                    "browser-font-worker-failed",
                    "Browser font subsetting worker stopped unexpectedly.",
                ),
            )
        )
    finally:
        connection.close()
