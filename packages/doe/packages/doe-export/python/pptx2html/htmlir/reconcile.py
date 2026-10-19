"""Public compatibility API for the modular DOE html/reconcile engine."""
from __future__ import annotations
from doe_export.html.reconcile.shared import (
    Any,
    CanonicalHtmlRenderer,
    ET,
    HTMLParser,
    HtmlCompileError,
    _ASSET_REFERENCE_PATTERN,
    _CANONICAL_FRAGMENT_PATTERN,
    _CANONICAL_MARKER_PATTERN,
    _CANONICAL_PAYLOAD_SCRIPT_PATTERN,
    _INLINE_DATA_SCHEME_PATTERN,
    _STABLE_RECONCILE_DIAGNOSTICS,
    __all__,
    base64,
    binascii,
    compile_html,
    copy,
    hashlib,
    ir_contains_inline_asset,
    normalize_transient_asset_payloads,
    presentation_from_dict,
    re,
)
from doe_export.html.reconcile.validation._EditableHtmlAssetGuard import _EditableHtmlAssetGuard
from doe_export.html.reconcile.identity._StableElementTreeParser import _StableElementTreeParser
from doe_export.html.reconcile.identity._stable_element_records import _stable_element_records
from doe_export.html.reconcile.document.reconcile_editable_html_with_current_ir import reconcile_editable_html_with_current_ir
from doe_export.html.reconcile.document._build_ephemeral_canonical_html import _build_ephemeral_canonical_html
from doe_export.html.reconcile.assets._materialize_ephemeral_assets import _materialize_ephemeral_assets
from doe_export.html.reconcile.assets._normalize_browser_asset_overrides import _normalize_browser_asset_overrides
from doe_export.html.reconcile.assets._project_browser_fonts import _project_browser_fonts
from doe_export.html.reconcile.assets._normalize_browser_asset_suppressions import _normalize_browser_asset_suppressions
from doe_export.html.reconcile.assets._managed_asset_id import _managed_asset_id
from doe_export.html.reconcile.assets._embedded_fonts_use_managed_references import _embedded_fonts_use_managed_references
from doe_export.html.reconcile.validation._validate_inputs import _validate_inputs
from doe_export.html.reconcile.validation._current_ir_contains_inline_binary import _current_ir_contains_inline_binary
from doe_export.html.reconcile.metadata._restore_unknown_metadata import _restore_unknown_metadata
from doe_export.html.reconcile.metadata._restore_structural_fallback_metadata import _restore_structural_fallback_metadata
from doe_export.html.reconcile.document._iter_shape_dicts_with_keys import _iter_shape_dicts_with_keys
from doe_export.html.reconcile.identity._semantic_shape_identity import _semantic_shape_identity
from doe_export.html.reconcile.identity._shape_ids import _shape_ids
from doe_export.html.reconcile.identity._normalize_new_shape_ids import _normalize_new_shape_ids
from doe_export.html.reconcile.metadata._strip_semantic_identity_diagnostics import _strip_semantic_identity_diagnostics
from doe_export.html.reconcile.metadata._restore_composed_picture_metadata import _restore_composed_picture_metadata
from doe_export.html.reconcile.assets._composed_svg_uses_source_asset import _composed_svg_uses_source_asset
from doe_export.html.reconcile.diagnostics._diagnostic import _diagnostic
from doe_export.html.reconcile.diagnostics._failure import _failure
