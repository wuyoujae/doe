"""Public compatibility API for the modular DOE service engine."""
from __future__ import annotations
from doe_export.service.shared import (
    ALLOWED_HOSTS_ENV,
    Any,
    BaseHTTPRequestHandler,
    BrowserFontSubsetError,
    HTTPStatus,
    HtmlCompileError,
    Image,
    JSON_CONTENT_TYPES,
    MAX_BATCH_CONCURRENCY,
    MAX_BATCH_ITEMS,
    MAX_BROWSER_TIMEOUT_MS,
    MAX_COPYIST_EXPORT_BODY_BYTES,
    MAX_COPYIST_V2_BODY_BYTES,
    MAX_DOM_NODES,
    MAX_HTML_EXPORT_BYTES,
    MAX_JSON_BODY_BYTES,
    MAX_JSON_DEPTH,
    MAX_JSON_NODES,
    MAX_PPTX_IMPORT_BYTES,
    MAX_PRESENTATION_SLIDES,
    MAX_PREVIEW_THUMBNAIL_EDGE,
    MAX_SOURCE_PPTX_BYTES,
    MAX_VIEWPORT_DIMENSION,
    MIN_RUNTIME_TOKEN_BYTES,
    OperationalErrorReporter,
    PALETTE_VERSION,
    POST_ROUTES,
    PPTX_CONTENT_TYPES,
    Path,
    RUNTIME_ROOT,
    RUNTIME_TOKEN_ENV,
    SOCKET_TIMEOUT_SECONDS,
    SchemaV4ExportError,
    SlideRepairRenderGateError,
    ThreadingHTTPServer,
    argparse,
    base64,
    binascii,
    decode_source_font,
    defaultdict,
    export_ir_to_html,
    export_ir_to_pdf,
    export_ir_to_png_zip,
    export_ir_to_pptx,
    export_schema_v4_deck_to_pptx,
    extract_editable_slide_html,
    hmac,
    html_to_pptx,
    import_pptx_to_canonical,
    io,
    ipaddress,
    json,
    os,
    parse_html_to_ir,
    parse_slide_fragments_to_ir,
    reconcile_editable_html_with_current_ir,
    render_ir_preview_png,
    render_ir_to_canonical,
    render_ir_to_slide_document,
    render_schema_v4_thumbnail,
    subset_browser_font_isolated,
    sys,
    threading,
    urlparse,
    validate_slide_repair_deck,
    warm_browser_snapshot_worker,
)
from doe_export.service.access._runtime_token_from_environment import _runtime_token_from_environment
from doe_export.service.access._normalize_host import _normalize_host
from doe_export.service.access._allowed_hosts import _allowed_hosts
from doe_export.service.validation._bounded_int import _bounded_int
from doe_export.service.validation._validate_json_budget import _validate_json_budget
from doe_export.service.validation._validate_presentation import _validate_presentation
from doe_export.service.validation._json_response import _json_response
from doe_export.service.validation._viewport_from_payload import _viewport_from_payload
from doe_export.service.validation._export_embed_fonts import _export_embed_fonts
from doe_export.service.validation._optional_base64_bytes import _optional_base64_bytes
from doe_export.service.thumbnail._dominant_region_color import _dominant_region_color
from doe_export.service.thumbnail._preview_palette import _preview_palette
from doe_export.service.thumbnail._thumbnail_webp_and_palette import _thumbnail_webp_and_palette
from doe_export.service.http.HtmlIrRequestHandler import HtmlIrRequestHandler
from doe_export.service.http.HtmlIrHttpServer import HtmlIrHttpServer
from doe_export.service.cli.run_server import run_server
from doe_export.service.cli.run_check import run_check
from doe_export.service.cli.main import main
if __name__ == "__main__":
    main()

