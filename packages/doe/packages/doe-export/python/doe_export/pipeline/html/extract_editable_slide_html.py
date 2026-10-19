# Origin: pptx_pipeline.py::extract_editable_slide_html
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import _CANONICAL_EDITABLE_FRAGMENT_PATTERN, hashlib, normalize_transient_asset_payloads, recover_serialized_html_source
from doe_export.pipeline.assets._assert_no_inline_binary_html import _assert_no_inline_binary_html
from doe_export.pipeline.assets._assert_no_inline_binary_ir import _assert_no_inline_binary_ir
from doe_export.pipeline.canonical._current_ir_storage_sha256 import _current_ir_storage_sha256
from doe_export.pipeline.assets._externalize_canonical_assets import _externalize_canonical_assets
from doe_export.pipeline.assets._externalize_ir_assets import _externalize_ir_assets
from doe_export.pipeline.validation._validated_canonical_slide_ir import _validated_canonical_slide_ir
from doe_export.pipeline.html.normalize_slide_fragment import normalize_slide_fragment

def extract_editable_slide_html(
    canonical_html: str,
    *,
    slide_position: int = 0,
    known_asset_ids: set[str] | None = None,
    asset_payloads: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Extract one safe, single-root editable fragment from Canonical HTML.

    The returned HTML never contains the document shell or embedded Canonical
    IR payload. A hash-validated one-slide Current IR is returned separately;
    stale payloads are never surfaced as current state.
    """

    if not isinstance(canonical_html, str) or not canonical_html.strip():
        raise ValueError("canonical_html is required.")
    if not isinstance(slide_position, int) or isinstance(slide_position, bool):
        raise ValueError("slide_position must be an integer.")
    source = recover_serialized_html_source(canonical_html).strip()
    matches = list(_CANONICAL_EDITABLE_FRAGMENT_PATTERN.finditer(source))
    if not matches:
        raise ValueError("Canonical HTML contains no marked slide fragments.")
    if slide_position < 0 or slide_position >= len(matches):
        raise ValueError(
            f"slide_position must be between 0 and {len(matches) - 1}."
        )

    resolver_assets = normalize_transient_asset_payloads(asset_payloads)
    effective_known_asset_ids = set(known_asset_ids or ())
    effective_known_asset_ids.update(resolver_assets)
    assets: dict[str, dict[str, Any]] = {}
    fragment = normalize_slide_fragment(matches[slide_position].group("fragment").strip())
    resource_diagnostics: list[dict[str, str]] = []
    fragment = _externalize_canonical_assets(
        fragment,
        assets,
        known_asset_ids=effective_known_asset_ids,
        resolver_assets=resolver_assets,
        diagnostics=resource_diagnostics,
    )
    fragment = normalize_slide_fragment(fragment)
    _assert_no_inline_binary_html(fragment)

    result: dict[str, Any] = {
        "success": True,
        "editable_html": fragment,
        "editable_html_sha256": hashlib.sha256(
            fragment.encode("utf-8")
        ).hexdigest(),
        "assets": list(assets.values()),
        "resource_diagnostics": resource_diagnostics,
        "canonical_ir_valid": False,
    }
    current_ir = _validated_canonical_slide_ir(source, matches, slide_position)
    if current_ir is not None:
        externalized_ir = _externalize_ir_assets(
            current_ir,
            assets,
            known_asset_ids=effective_known_asset_ids,
            diagnostics=resource_diagnostics,
        )
        _assert_no_inline_binary_ir(externalized_ir)
        result.update(
            {
                "assets": list(assets.values()),
                "canonical_ir_valid": True,
                "current_ir": externalized_ir,
                "current_ir_sha256": _current_ir_storage_sha256(externalized_ir),
            }
        )
    return result

extract_editable_slide_html.__module__ = 'pptx_pipeline'
