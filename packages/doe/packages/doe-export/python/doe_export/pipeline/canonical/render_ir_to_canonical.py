# Origin: pptx_pipeline.py::render_ir_to_canonical
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import CanonicalHtmlRenderer, dataclasses, hashlib, normalize_transient_asset_payloads, presentation_from_dict
from doe_export.pipeline.assets._apply_browser_asset_overrides_to_ir import _apply_browser_asset_overrides_to_ir
from doe_export.pipeline.canonical._canonical_payload_presentation_dict import _canonical_payload_presentation_dict
from doe_export.pipeline.assets._externalize_canonical_assets import _externalize_canonical_assets
from doe_export.pipeline.assets._externalize_ir_assets import _externalize_ir_assets
from doe_export.pipeline.text_layout._normalize_editor_text_layout import _normalize_editor_text_layout
from doe_export.pipeline.text_layout._presentation_ir_with_legacy_layout_dirty import _presentation_ir_with_legacy_layout_dirty

def render_ir_to_canonical(
    presentation_ir: dict[str, Any],
    known_asset_ids: set[str] | None = None,
    *,
    normalize_text_layout: bool = False,
    asset_payloads: dict[str, Any] | None = None,
    browser_asset_overrides: dict[str, str] | None = None,
    browser_asset_suppressions: list[str] | None = None,
) -> dict[str, Any]:
    """Render editable IR back to compact canonical HTML for database persistence."""

    if not isinstance(presentation_ir, dict):
        raise ValueError("PresentationIR object is required.")
    if not isinstance(normalize_text_layout, bool):
        raise ValueError("normalize_text_layout must be a boolean.")
    upgraded_ir = _presentation_ir_with_legacy_layout_dirty(presentation_ir)
    render_ir = _apply_browser_asset_overrides_to_ir(
        upgraded_ir,
        browser_asset_overrides,
        browser_asset_suppressions,
    )
    presentation = presentation_from_dict(render_ir)
    if len(presentation.slides) != 1:
        raise ValueError("Editor persistence accepts exactly one slide at a time.")
    normalized_frame_count = 0
    unresolved_frame_count = 0
    if normalize_text_layout:
        (
            presentation,
            normalized_frame_count,
            unresolved_frame_count,
        ) = _normalize_editor_text_layout(presentation)
    resolver_assets = normalize_transient_asset_payloads(asset_payloads)
    effective_known_asset_ids = set(known_asset_ids or ())
    effective_known_asset_ids.update(resolver_assets)
    assets: dict[str, dict[str, Any]] = {}
    resource_diagnostics: list[dict[str, str]] = []
    externalized_ir = _externalize_ir_assets(
        dataclasses.asdict(presentation),
        assets,
        known_asset_ids=effective_known_asset_ids,
        diagnostics=resource_diagnostics,
    )
    resolver_assets.update(assets)
    presentation = presentation_from_dict(externalized_ir)
    html = _externalize_canonical_assets(
        CanonicalHtmlRenderer(mode="embedded").render(presentation),
        assets,
        known_asset_ids=effective_known_asset_ids,
        resolver_assets=resolver_assets,
        diagnostics=resource_diagnostics,
    )
    result = {
        "success": True,
        "html": html,
        "content_hash": hashlib.sha256(html.encode("utf-8")).hexdigest(),
        "assets": list(assets.values()),
        "resource_diagnostics": resource_diagnostics,
    }
    if normalize_text_layout:
        compact_presentation = _canonical_payload_presentation_dict(html)
        if compact_presentation is None:
            raise ValueError("Canonical HTML did not contain its compact PresentationIR payload.")
        result.update(
            {
                "presentation": compact_presentation,
                "text_layout_normalized": unresolved_frame_count == 0,
                "normalized_text_frame_count": normalized_frame_count,
                "unresolved_text_frame_count": unresolved_frame_count,
            }
        )
    return result

render_ir_to_canonical.__module__ = 'pptx_pipeline'
