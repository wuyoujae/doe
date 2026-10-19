# Origin: pptx2html/htmlir/reconcile.py::_build_ephemeral_canonical_html
from __future__ import annotations
from doe_export.html.reconcile.shared import Any, CanonicalHtmlRenderer, _CANONICAL_FRAGMENT_PATTERN, presentation_from_dict
from doe_export.html.reconcile.assets._materialize_ephemeral_assets import _materialize_ephemeral_assets
from doe_export.html.reconcile.assets._project_browser_fonts import _project_browser_fonts

def _build_ephemeral_canonical_html(
    editable_html: str,
    previous_current_ir: dict[str, Any],
    *,
    asset_payloads: dict[str, Any] | None = None,
    browser_asset_overrides: dict[str, str] | None = None,
    browser_asset_suppressions: list[str] | None = None,
) -> str:
    """Return a one-use Canonical shell containing the old IR and edited DOM."""

    projected_ir = _project_browser_fonts(
        previous_current_ir,
        browser_asset_overrides,
        browser_asset_suppressions,
    )
    presentation = presentation_from_dict(projected_ir)
    if len(presentation.slides) != 1:
        raise ValueError("Current IR reconciliation accepts exactly one slide.")
    canonical = CanonicalHtmlRenderer(mode="embedded").render(presentation)
    match = _CANONICAL_FRAGMENT_PATTERN.search(canonical)
    if match is None:
        raise ValueError("Current IR renderer produced no canonical slide fragment.")
    fragment = editable_html.strip()
    shell = (
        canonical[: match.start("fragment")]
        + "\n"
        + fragment
        + "\n"
        + canonical[match.end("fragment") :]
    )
    return _materialize_ephemeral_assets(
        shell,
        asset_payloads or {},
        asset_overrides=browser_asset_overrides,
    )

_build_ephemeral_canonical_html.__module__ = 'pptx2html.htmlir.reconcile'
