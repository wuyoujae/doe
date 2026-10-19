"""Audit Yrkie Copyist PPTX -> canonical HTML -> IR -> PPTX fidelity.

The report is intentionally anonymous: source decks are identified only by
their SHA-256 filename/digest. Generated screenshots and reports should live
under the repository test task directory.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import re
import statistics
import sys
import time
import zipfile
from io import BytesIO
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageStat


RUNTIME_ROOT = Path(__file__).resolve().parents[1]
if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from pptx_pipeline import (  # noqa: E402
    _static_export_html,
    extract_editable_slide_html,
    export_ir_to_pptx,
    import_pptx_to_canonical,
)
from pptx2html.htmlir import capture_html_screenshots, compile_html  # noqa: E402
from pptx2html import Presentation as PomPresentation  # noqa: E402
from pptx2html.ir.builder import PresentationBuilder  # noqa: E402
from pptx2html.opc.archive_guard import validate_pptx_archive  # noqa: E402


_CANONICAL_PAYLOAD_PATTERN = re.compile(
    r'<script\b[^>]*\bid=["\']pptx2html-canonical-ir["\'][^>]*>'
    r'(?P<payload>[\s\S]*?)</script\s*>',
    re.IGNORECASE,
)


def _sha256(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def _canonical_payload(html: str) -> dict[str, Any]:
    match = _CANONICAL_PAYLOAD_PATTERN.search(html)
    if match is None:
        raise ValueError("Canonical HTML is missing its PresentationIR payload.")
    payload = json.loads(match.group("payload").strip())
    presentation = payload.get("presentation")
    if not isinstance(presentation, dict):
        raise ValueError("Canonical HTML contains an invalid PresentationIR payload.")
    return presentation


def _expand_assets(html: str, assets: dict[str, dict[str, Any]]) -> str:
    expanded = html
    for asset_id, asset in assets.items():
        encoded = str(asset["data_base64"])
        content_type = str(asset["content_type"])
        expanded = expanded.replace(
            f"yrkie-asset-data://{asset_id}",
            f"data:{content_type};base64,{encoded}",
        )
        expanded = expanded.replace(
            f"yrkie-asset-base64://{asset_id}",
            encoded,
        )
    if "yrkie-asset-" in expanded:
        raise ValueError("Canonical HTML still contains unresolved asset references.")
    return expanded


def _image_mae(actual: bytes, reference_path: Path) -> float:
    with Image.open(BytesIO(actual)) as source_image:
        actual_image = source_image.convert("RGB")
    with Image.open(reference_path) as source_reference:
        reference = source_reference.convert("RGB")
    if actual_image.size != reference.size:
        actual_image = actual_image.resize(reference.size, Image.Resampling.LANCZOS)
    difference = ImageChops.difference(actual_image, reference)
    return round(sum(ImageStat.Stat(difference).mean) / 3.0, 4)


def _first_editable_shape(presentation: dict[str, Any]) -> tuple[int, dict[str, Any], str]:
    # Prefer ordinary text. It exercises the highest-value editing path and
    # avoids accidentally selecting a master-derived background or a merged
    # table cell when a normal slide-owned text box exists later in the tree.
    for slide_index, slide in enumerate(presentation.get("slides") or []):
        for shape in slide.get("shapes") or []:
            if shape.get("source_scope") in {"layout", "master"}:
                continue
            text = shape.get("text")
            if isinstance(text, dict):
                for paragraph in text.get("paragraphs") or []:
                    for run in paragraph.get("runs") or []:
                        if run.get("kind") in {None, "text"} and isinstance(run.get("text"), str):
                            run["text"] += "\u2060"
                            return slide_index, shape, "text"

    # Then use a simple slide-owned shape move. Group/table/master recovery
    # shapes are deliberately skipped because they exercise a different
    # structural fallback rather than the normal Canvas property edit path.
    for slide_index, slide in enumerate(presentation.get("slides") or []):
        for shape in slide.get("shapes") or []:
            if shape.get("source_scope") in {"layout", "master"}:
                continue
            if shape.get("type") in {"group_shape", "graphic_frame", "table"}:
                continue
            bounds = shape.get("bounds")
            if isinstance(bounds, dict) and float(bounds.get("width") or 0) > 0:
                bounds["left"] = float(bounds.get("left") or 0) + 0.25
                return slide_index, shape, "bounds"

    # A native table is the final editable fallback.
    for slide_index, slide in enumerate(presentation.get("slides") or []):
        for shape in slide.get("shapes") or []:
            if shape.get("source_scope") in {"layout", "master"}:
                continue
            table = shape.get("table")
            if isinstance(table, dict):
                for row in table.get("rows") or []:
                    for cell in row:
                        frame = cell.get("text_frame") if isinstance(cell, dict) else None
                        if not isinstance(frame, dict):
                            continue
                        for paragraph in frame.get("paragraphs") or []:
                            for run in paragraph.get("runs") or []:
                                if run.get("kind") in {None, "text"} and isinstance(run.get("text"), str):
                                    run["text"] += "\u2060"
                                    return slide_index, shape, "table-text"
    raise ValueError("Presentation has no editable top-level shape.")


def _audit_edited_export(
    source: bytes,
    original: dict[str, Any],
) -> dict[str, Any]:
    current = copy.deepcopy(original)
    for index, slide in enumerate(current.get("slides") or []):
        slide["_yrkie_source_slide_index"] = index
    edited_slide_index, _edited_shape, edit_kind = _first_editable_shape(current)
    exported = export_ir_to_pptx(
        current,
        source_pptx=source,
        original_ir=original,
        export_watermark=False,
    )
    with zipfile.ZipFile(BytesIO(source)) as before, zipfile.ZipFile(
        BytesIO(exported)
    ) as after:
        validate_pptx_archive(after)
        presentation_part_preserved = (
            before.read("ppt/presentation.xml")
            == after.read("ppt/presentation.xml")
        )
        edited_name = f"ppt/slides/slide{edited_slide_index + 1}.xml"
        edited_slide_changed = before.read(edited_name) != after.read(edited_name)
        unchanged_slides_preserved = all(
            before.read(f"ppt/slides/slide{index + 1}.xml")
            == after.read(f"ppt/slides/slide{index + 1}.xml")
            for index in range(len(original.get("slides") or []))
            if index != edited_slide_index
        )
    with PomPresentation.open(BytesIO(exported)) as pom:
        reparsed = PresentationBuilder().build(pom)
    return {
        "success": (
            presentation_part_preserved
            and edited_slide_changed
            and unchanged_slides_preserved
            and len(reparsed.slides) == len(original.get("slides") or [])
        ),
        "editKind": edit_kind,
        "editedSlide": edited_slide_index + 1,
        "presentationPartPreserved": presentation_part_preserved,
        "editedSlideChanged": edited_slide_changed,
        "unchangedSlidesPreserved": unchanged_slides_preserved,
        "reimportedSlideCount": len(reparsed.slides),
    }


def _percentile(values: list[float], quantile: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    position = (len(ordered) - 1) * quantile
    lower = int(position)
    upper = min(len(ordered) - 1, lower + 1)
    fraction = position - lower
    return round(
        ordered[lower] * (1.0 - fraction) + ordered[upper] * fraction,
        4,
    )


def _write_report(output_dir: Path, report: dict[str, Any]) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    target = output_dir / "copyist-roundtrip-report.json"
    target.write_text(
        json.dumps(report, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def _audit_deck(
    path: Path,
    reference_root: Path | None,
    output_dir: Path,
    *,
    visual: bool,
    screenshot_batch_size: int,
    edited_smoke: bool,
) -> dict[str, Any]:
    started = time.perf_counter()
    source = path.read_bytes()
    digest = _sha256(source)
    if path.stem.lower() != digest:
        raise ValueError("Corpus files must use anonymous SHA-256 filenames.")

    imported = import_pptx_to_canonical(source)
    slides = imported["slides"]
    assets = {
        str(asset["asset_id"]).lower(): asset
        for asset in imported.get("assets") or []
    }

    roundtrip_failures: list[int] = []
    v2_document_failures: list[int] = []
    canonical_bytes = 0
    editable_html_bytes = 0
    for slide in slides:
        html = str(slide["html"])
        canonical_bytes += len(html.encode("utf-8"))
        expected = _canonical_payload(html)
        v2_document = extract_editable_slide_html(html)
        editable_html = str(v2_document["editable_html"])
        editable_html_bytes += len(editable_html.encode("utf-8"))
        if (
            not v2_document.get("canonical_ir_valid")
            or v2_document.get("current_ir") != expected
            or v2_document.get("editable_html_sha256")
            != slide.get("editable_html_sha256")
            or "pptx2html-canonical-ir" in editable_html
            or "<html" in editable_html.lower()
        ):
            v2_document_failures.append(int(slide["index"]) + 1)
        compiled = compile_html(html, include_ast=True)
        if (
            compiled.get("presentation") != expected
            or (compiled.get("ast") or {}).get("kind") != "htmlir-canonical-lossless"
        ):
            roundtrip_failures.append(int(slide["index"]) + 1)

    exported = export_ir_to_pptx(
        imported["presentation"],
        source_pptx=source,
        original_ir=imported["presentation"],
        export_watermark=False,
    )
    export_sha256 = _sha256(exported)
    zero_edit_byte_identical = exported == source
    edited_export = (
        _audit_edited_export(source, imported["presentation"])
        if edited_smoke
        else None
    )

    maes: list[float] = []
    visual_mae_by_slide: list[dict[str, Any]] = []
    missing_references: list[int] = []
    screenshot_failures: list[dict[str, Any]] = []
    if visual:
        screenshot_dir = output_dir / "html" / digest
        screenshot_dir.mkdir(parents=True, exist_ok=True)
        for start in range(0, len(slides), screenshot_batch_size):
            batch = slides[start : start + screenshot_batch_size]
            items = []
            positions: list[int] = []
            for slide in batch:
                position = int(slide["index"]) + 1
                expanded = _expand_assets(str(slide["html"]), assets)
                items.append(
                    {
                        "id": str(position),
                        "source": _static_export_html(
                            expanded,
                            export_watermark=False,
                        ),
                    }
                )
                positions.append(position)
            try:
                screenshots = capture_html_screenshots(
                    items,
                    viewport=(1280, 720),
                    device_scale_factor=1.0,
                    timeout_ms=60000,
                    concurrency=2,
                )
            except Exception as error:  # pragma: no cover - corpus diagnostic path
                # A browser worker can be recycled after a large or damaged
                # presentation exhausts its page budget. Do not discard every
                # slide in the batch: retry each page in a fresh capture call
                # so one pathological page cannot hide otherwise valid visual
                # comparisons.
                batch_error = f"{type(error).__name__}: {error}"
                recovered_positions: list[int] = []
                recovered_screenshots: list[bytes] = []
                for position, item in zip(positions, items, strict=True):
                    try:
                        recovered = capture_html_screenshots(
                            [item],
                            viewport=(1280, 720),
                            device_scale_factor=1.0,
                            timeout_ms=60000,
                            concurrency=1,
                        )
                    except Exception as retry_error:
                        screenshot_failures.append(
                            {
                                "start": position,
                                "end": position,
                                "error": (
                                    f"{type(retry_error).__name__}: {retry_error}"
                                ),
                                "batchError": batch_error,
                            }
                        )
                        continue
                    recovered_positions.append(position)
                    recovered_screenshots.append(recovered[0])
                positions = recovered_positions
                screenshots = recovered_screenshots
            for position, png in zip(positions, screenshots, strict=True):
                screenshot_path = screenshot_dir / f"slide-{position:03d}.png"
                screenshot_path.write_bytes(png)
                if reference_root is None:
                    continue
                reference = reference_root / digest / f"slide-{position:03d}.png"
                if not reference.is_file():
                    missing_references.append(position)
                    continue
                mae = _image_mae(png, reference)
                maes.append(mae)
                visual_mae_by_slide.append({"slide": position, "mae": mae})

    return {
        "sha256": digest,
        "slides": len(slides),
        "assets": len(assets),
        "canonicalHtmlBytes": canonical_bytes,
        "editableHtmlBytes": editable_html_bytes,
        "v2SlideDocumentsValid": not v2_document_failures,
        "v2SlideDocumentFailureSlides": v2_document_failures,
        "canonicalRoundtripLossless": not roundtrip_failures,
        "canonicalRoundtripFailureSlides": roundtrip_failures,
        "zeroEditPptxByteIdentical": zero_edit_byte_identical,
        "editedExport": edited_export,
        "sourceSha256": digest,
        "exportSha256": export_sha256,
        "visualSlidesCompared": len(maes),
        "visualMeanMae": round(statistics.fmean(maes), 4) if maes else None,
        "visualMaxMae": round(max(maes), 4) if maes else None,
        "visualPagesOver12": sum(value > 12 for value in maes),
        "visualPagesOver20": sum(value > 20 for value in maes),
        "visualMaeBySlide": visual_mae_by_slide,
        "missingReferenceSlides": missing_references,
        "screenshotFailures": screenshot_failures,
        "elapsedSec": round(time.perf_counter() - started, 3),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("corpus", type=Path)
    parser.add_argument("--reference-root", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--visual", action="store_true")
    parser.add_argument("--edited-smoke", action="store_true")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--sha256-prefix")
    parser.add_argument("--screenshot-batch-size", type=int, default=8)
    args = parser.parse_args()

    paths = sorted(
        path
        for path in args.corpus.resolve().glob("*.pptx")
        if not path.name.startswith("~$")
    )
    if args.sha256_prefix:
        prefix = args.sha256_prefix.strip().lower()
        paths = [path for path in paths if path.stem.lower().startswith(prefix)]
    if args.limit is not None:
        paths = paths[: max(0, args.limit)]
    if not paths:
        parser.error("No PPTX files found.")

    output_dir = args.output.resolve()
    report: dict[str, Any] = {
        "schemaVersion": 2,
        "privacy": "anonymous-sha256-only",
        "corpus": str(args.corpus.resolve()),
        "visualEnabled": bool(args.visual),
        "decks": [],
    }
    _write_report(output_dir, report)

    for index, path in enumerate(paths, start=1):
        try:
            result = _audit_deck(
                path,
                args.reference_root.resolve() if args.reference_root else None,
                output_dir,
                visual=bool(args.visual),
                screenshot_batch_size=max(1, min(args.screenshot_batch_size, 16)),
                edited_smoke=bool(args.edited_smoke),
            )
        except Exception as error:  # pragma: no cover - corpus diagnostic path
            result = {
                "sha256": path.stem.lower(),
                "error": f"{type(error).__name__}: {error}",
            }
        report["decks"].append(result)
        _write_report(output_dir, report)
        state = "PASS" if "error" not in result else "FAIL"
        print(
            f"[{index:02d}/{len(paths):02d}] {state} "
            f"{path.stem[:12]} slides={result.get('slides', '?')} "
            f"html={result.get('canonicalRoundtripLossless', '?')} "
            f"pptx={result.get('zeroEditPptxByteIdentical', '?')} "
            f"mae={result.get('visualMeanMae', '?')}",
            flush=True,
        )

    decks = report["decks"]
    successful = [item for item in decks if "error" not in item]
    all_mae = [
        float(item["visualMeanMae"])
        for item in successful
        if item.get("visualMeanMae") is not None
    ]
    weighted_mae_values = [
        float(item["visualMeanMae"])
        for item in successful
        for _ in range(int(item.get("visualSlidesCompared") or 0))
        if item.get("visualMeanMae") is not None
    ]
    report["summary"] = {
        "decks": len(decks),
        "successfulDecks": len(successful),
        "failedDecks": len(decks) - len(successful),
        "slides": sum(int(item.get("slides") or 0) for item in successful),
        "canonicalRoundtripPassedDecks": sum(
            bool(item.get("canonicalRoundtripLossless")) for item in successful
        ),
        "v2SlideDocumentPassedDecks": sum(
            bool(item.get("v2SlideDocumentsValid")) for item in successful
        ),
        "zeroEditByteIdenticalDecks": sum(
            bool(item.get("zeroEditPptxByteIdentical")) for item in successful
        ),
        "editedExportPassedDecks": sum(
            bool((item.get("editedExport") or {}).get("success"))
            for item in successful
        ),
        "visualSlidesCompared": sum(
            int(item.get("visualSlidesCompared") or 0) for item in successful
        ),
        "visualWeightedMeanMae": (
            round(statistics.fmean(weighted_mae_values), 4)
            if weighted_mae_values
            else None
        ),
        "visualDeckMedianMae": (
            round(statistics.median(all_mae), 4) if all_mae else None
        ),
        "visualDeckP90Mae": _percentile(all_mae, 0.90) if all_mae else None,
        "visualMaxMae": max(
            (float(item.get("visualMaxMae") or 0.0) for item in successful),
            default=None,
        ),
        "visualPagesOver12": sum(
            int(item.get("visualPagesOver12") or 0) for item in successful
        ),
        "visualPagesOver20": sum(
            int(item.get("visualPagesOver20") or 0) for item in successful
        ),
        "screenshotFailureBatches": sum(
            len(item.get("screenshotFailures") or []) for item in successful
        ),
    }
    _write_report(output_dir, report)
    print(json.dumps(report["summary"], ensure_ascii=False), flush=True)

    summary = report["summary"]
    ok = (
        summary["failedDecks"] == 0
        and summary["canonicalRoundtripPassedDecks"] == summary["decks"]
        and summary["v2SlideDocumentPassedDecks"] == summary["decks"]
        and summary["zeroEditByteIdenticalDecks"] == summary["decks"]
        and (
            not args.edited_smoke
            or summary["editedExportPassedDecks"] == summary["decks"]
        )
        and summary["screenshotFailureBatches"] == 0
    )
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
