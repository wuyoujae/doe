from __future__ import annotations

import base64
import dataclasses
import hashlib
import re
import sys
import unittest
from pathlib import Path


RUNTIME_ROOT = Path(__file__).resolve().parents[1]
if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from pptx2html.htmlir import reconcile_editable_html_with_current_ir  # noqa: E402
from pptx2html.htmlir.reconcile import _build_ephemeral_canonical_html  # noqa: E402
from pptx2html.ir.model import (  # noqa: E402
    AnimationStep,
    Bounds,
    EmbeddedFont,
    Fill,
    Font,
    ImageInfo,
    Paragraph,
    Presentation,
    Run,
    Shape,
    Slide,
    SlideTransition,
    TextFrame,
)
from pptx2html.renderer import CanonicalHtmlRenderer  # noqa: E402


_EDITABLE_FRAGMENT_PATTERN = re.compile(
    r"<!--\s*PPTX2HTML_SLIDE_START:0\s*-->"
    r"(?P<fragment>[\s\S]*?)"
    r"<!--\s*PPTX2HTML_SLIDE_END:0\s*-->",
    re.IGNORECASE,
)


def _text_frame(value: str, color: str = "112233") -> TextFrame:
    return TextFrame(
        paragraphs=[
            Paragraph(
                runs=[
                    Run(
                        text=value,
                        font=Font(
                            family="Arial",
                            size_pt=20,
                            color=color,
                        ),
                    )
                ]
            )
        ]
    )


def _source_presentation() -> Presentation:
    child = Shape(
        type="auto_shape",
        name="Grouped child",
        shape_id=8,
        source_scope="slide",
        bounds=Bounds(10, 10, 100, 20),
        text=_text_frame("Grouped"),
    )
    group = Shape(
        type="group_shape",
        name="Source group",
        shape_id=7,
        source_scope="slide",
        bounds=Bounds(400, 100, 200, 100),
        group_bounds=Bounds(0, 0, 200, 100),
        shapes=[child],
    )
    title = Shape(
        type="auto_shape",
        name="Title",
        shape_id=42,
        source_scope="slide",
        bounds=Bounds(100, 80, 300, 60),
        fill=Fill(type="solid", color="AABBCC"),
        text=_text_frame("Old title"),
    )
    return Presentation(
        width=960,
        height=540,
        slides=[
            Slide(
                index=0,
                name="Source",
                transition=SlideTransition(
                    type="fade",
                    raw_attrs={"source-transition": "kept"},
                ),
                animations=[
                    AnimationStep(
                        kind="entr",
                        target_shape_id=8,
                        raw_attrs={"source-animation": "kept"},
                    )
                ],
                shapes=[title, group],
            )
        ],
    )


def _editable_fragment(presentation: Presentation) -> str:
    canonical = CanonicalHtmlRenderer(mode="embedded").render(presentation)
    match = _EDITABLE_FRAGMENT_PATTERN.search(canonical)
    if match is None:
        raise AssertionError("Canonical renderer returned no slide fragment.")
    return match.group("fragment").strip()


def _two_shape_presentation() -> Presentation:
    return Presentation(
        width=960,
        height=540,
        slides=[
            Slide(
                index=0,
                name="Structural source",
                transition=SlideTransition(
                    type="fade",
                    raw_attrs={"source-transition": "kept"},
                ),
                animations=[
                    AnimationStep(
                        kind="entr",
                        target_shape_id=102,
                        raw_attrs={"source-animation": "kept"},
                    )
                ],
                shapes=[
                    Shape(
                        type="auto_shape",
                        name="First",
                        shape_id=101,
                        source_scope="slide",
                        bounds=Bounds(40, 40, 240, 80),
                        text=_text_frame("First"),
                    ),
                    Shape(
                        type="auto_shape",
                        name="Second",
                        shape_id=102,
                        source_scope="slide",
                        bounds=Bounds(320, 40, 240, 80),
                        text=_text_frame("Second"),
                    ),
                ],
            )
        ],
    )


def _shape_div_block(source: str, shape_key: int) -> tuple[int, int]:
    marker = source.index(f'data-pptx-shape-key="{shape_key}"')
    start = source.rfind("<div", 0, marker)
    depth = 0
    for match in re.finditer(r"<div\b[^>]*>|</div\s*>", source[start:], re.IGNORECASE):
        token = match.group(0).lower()
        depth += -1 if token.startswith("</") else 1
        if depth == 0:
            return start, start + match.end()
    raise AssertionError(f"shape block {shape_key} is not balanced")


def _delete_shape_block(source: str, shape_key: int) -> str:
    start, end = _shape_div_block(source, shape_key)
    return source[:start] + source[end:]


def _swap_shape_blocks(source: str, first_key: int, second_key: int) -> str:
    first_start, first_end = _shape_div_block(source, first_key)
    second_start, second_end = _shape_div_block(source, second_key)
    if second_start < first_start:
        first_start, first_end, second_start, second_end = (
            second_start,
            second_end,
            first_start,
            first_end,
        )
    first = source[first_start:first_end]
    second = source[second_start:second_end]
    between = source[first_end:second_start]
    return (
        source[:first_start]
        + second
        + between
        + first
        + source[second_end:]
    )


class SlideStorageV2ReconcileTests(unittest.TestCase):
    def test_browser_font_override_never_replaces_current_ir_font_identity(self) -> None:
        presentation = _source_presentation()
        previous = dataclasses.asdict(presentation)
        source_id = "a" * 64
        variant_bytes = b"invalid-test-woff2"
        variant_id = hashlib.sha256(variant_bytes).hexdigest()
        previous["embedded_fonts"] = [
            {
                "typeface": "Source Font",
                "content_type": "font/otf",
                "data": f"yrkie-asset-data://{source_id}",
                "style": "Regular",
            }
        ]

        result = reconcile_editable_html_with_current_ir(
            _editable_fragment(presentation),
            previous,
            asset_payloads={
                variant_id: {
                    "content_type": "font/woff2",
                    "data_base64": base64.b64encode(variant_bytes).decode("ascii"),
                }
            },
            browser_asset_overrides={source_id: variant_id},
        )

        self.assertTrue(result["success"], result.get("diagnostics"))
        self.assertEqual(
            result["presentation"]["embedded_fonts"],
            previous["embedded_fonts"],
        )

    def test_stable_shape_merge_preserves_source_and_unknown_metadata(self) -> None:
        presentation = _source_presentation()
        previous = dataclasses.asdict(presentation)
        previous["future_deck_metadata"] = {"opaque": "deck"}
        previous["slides"][0]["future_slide_metadata"] = {"opaque": "slide"}
        previous["slides"][0]["shapes"][0]["future_shape_metadata"] = {
            "opaque": "shape"
        }
        edited = (
            _editable_fragment(presentation)
            .replace("left:100.000pt", "left:120.000pt", 1)
            .replace("background-color:#AABBCC", "background-color:#DDEEFF", 1)
            .replace("color:#112233", "color:#445566", 1)
            .replace("Old title", "New title", 1)
        )

        result = reconcile_editable_html_with_current_ir(edited, previous)

        self.assertTrue(result["success"])
        self.assertEqual(result["reconcile_mode"], "stable-id-merge")
        self.assertEqual(
            result["diagnostics"][0]["code"],
            "slide-ir-stable-id-merge",
        )
        current = result["presentation"]
        title = current["slides"][0]["shapes"][0]
        group = current["slides"][0]["shapes"][1]
        self.assertAlmostEqual(title["bounds"]["left"], 120.0, places=2)
        self.assertEqual(title["fill"]["color"], "DDEEFF")
        self.assertEqual(
            title["text"]["paragraphs"][0]["runs"][0]["text"],
            "New title",
        )
        self.assertEqual(
            title["text"]["paragraphs"][0]["runs"][0]["font"]["color"],
            "445566",
        )
        self.assertEqual(title["shape_id"], 42)
        self.assertEqual(title["source_scope"], "slide")
        self.assertEqual(group["type"], "group_shape")
        self.assertEqual(group["shapes"][0]["shape_id"], 8)
        self.assertEqual(
            current["slides"][0]["animations"],
            previous["slides"][0]["animations"],
        )
        self.assertEqual(
            current["slides"][0]["transition"],
            previous["slides"][0]["transition"],
        )
        self.assertEqual(current["future_deck_metadata"], {"opaque": "deck"})
        self.assertEqual(
            current["slides"][0]["future_slide_metadata"],
            {"opaque": "slide"},
        )
        self.assertEqual(
            title["future_shape_metadata"],
            {"opaque": "shape"},
        )

    def test_ambiguous_group_hierarchy_change_fails_closed(self) -> None:
        presentation = _source_presentation()
        previous = dataclasses.asdict(presentation)
        edited = _editable_fragment(presentation)
        title_start = edited.index('<div class="pptx-shape"')
        group_start = edited.index(
            '<div class="pptx-shape"',
            title_start + 1,
        )
        edited = edited[:title_start] + edited[group_start:]

        result = reconcile_editable_html_with_current_ir(edited, previous)

        self.assertFalse(result["success"])
        self.assertEqual(
            result["diagnostics"][0]["code"],
            "slide-structure-lossless-unsupported",
        )

    def test_shape_deletion_preserves_source_metadata_and_filters_animation(self) -> None:
        presentation = _two_shape_presentation()
        previous = dataclasses.asdict(presentation)
        previous["future_deck_metadata"] = {"opaque": "deck"}
        previous["slides"][0]["future_slide_metadata"] = {"opaque": "slide"}
        previous["slides"][0]["shapes"][0]["future_shape_metadata"] = {
            "opaque": "deleted"
        }
        previous["slides"][0]["shapes"][1]["future_shape_metadata"] = {
            "opaque": "retained"
        }
        previous["slides"][0]["animations"].append(
            dataclasses.asdict(
                AnimationStep(
                    kind="entr",
                    target_shape_id=101,
                    raw_attrs={"deleted-target": "removed"},
                )
            )
        )
        edited = _delete_shape_block(_editable_fragment(presentation), 0)

        result = reconcile_editable_html_with_current_ir(edited, previous)

        self.assertTrue(result["success"], result.get("diagnostics"))
        self.assertEqual(result["reconcile_mode"], "stable-id-merge")
        current = result["presentation"]
        self.assertEqual(
            [shape["shape_id"] for shape in current["slides"][0]["shapes"]],
            [102],
        )
        self.assertEqual(
            current["slides"][0]["shapes"][0]["future_shape_metadata"],
            {"opaque": "retained"},
        )
        self.assertEqual(
            current["slides"][0]["animations"],
            previous["slides"][0]["animations"][:1],
        )
        self.assertEqual(
            current["slides"][0]["transition"],
            previous["slides"][0]["transition"],
        )
        self.assertEqual(current["future_deck_metadata"], {"opaque": "deck"})
        self.assertEqual(
            current["slides"][0]["future_slide_metadata"],
            {"opaque": "slide"},
        )

    def test_shape_reorder_preserves_source_identity_and_metadata(self) -> None:
        presentation = _two_shape_presentation()
        previous = dataclasses.asdict(presentation)
        previous["slides"][0]["shapes"][0]["future_shape_metadata"] = {
            "opaque": "first"
        }
        previous["slides"][0]["shapes"][1]["future_shape_metadata"] = {
            "opaque": "second"
        }
        edited = _swap_shape_blocks(_editable_fragment(presentation), 0, 1)

        result = reconcile_editable_html_with_current_ir(edited, previous)

        self.assertTrue(result["success"], result.get("diagnostics"))
        self.assertEqual(result["reconcile_mode"], "stable-id-merge")
        shapes = result["presentation"]["slides"][0]["shapes"]
        self.assertEqual([shape["shape_id"] for shape in shapes], [102, 101])
        self.assertEqual(
            [shape["future_shape_metadata"]["opaque"] for shape in shapes],
            ["second", "first"],
        )

    def test_top_level_add_preserves_source_shapes_and_slide_metadata(self) -> None:
        presentation = _two_shape_presentation()
        previous = dataclasses.asdict(presentation)
        previous["future_deck_metadata"] = {"opaque": "deck"}
        previous["slides"][0]["future_slide_metadata"] = {"opaque": "slide"}
        previous["slides"][0]["shapes"][0]["future_shape_metadata"] = {
            "opaque": "first"
        }
        editable = _editable_fragment(presentation)
        insertion = (
            '<div data-yrkie-element-id="new-callout" '
            'element-name="New callout" element-type="text" '
            'style="position:absolute;left:100pt;top:200pt;width:240pt;'
            'height:70pt;background:#ffeeaa;color:#112233;font-size:24pt">'
            "New callout</div>"
        )
        layer_end = editable.rfind("</div>")
        edited = editable[:layer_end] + insertion + editable[layer_end:]

        result = reconcile_editable_html_with_current_ir(edited, previous)

        self.assertTrue(result["success"], result.get("diagnostics"))
        self.assertEqual(result["reconcile_mode"], "semantic-fallback")
        self.assertEqual(
            result["diagnostics"][0]["code"],
            "slide-structure-semantic-fallback-preserved",
        )
        current = result["presentation"]
        shapes = current["slides"][0]["shapes"]
        self.assertEqual([shape["shape_id"] for shape in shapes[:2]], [101, 102])
        self.assertEqual(
            shapes[0]["future_shape_metadata"],
            {"opaque": "first"},
        )
        self.assertTrue(
            any(
                "New callout"
                in run.get("text", "")
                for shape in shapes[2:]
                for paragraph in (shape.get("text") or {}).get("paragraphs", [])
                for run in paragraph.get("runs", [])
            )
        )
        self.assertEqual(
            current["slides"][0]["transition"],
            previous["slides"][0]["transition"],
        )
        self.assertEqual(
            current["slides"][0]["animations"],
            previous["slides"][0]["animations"],
        )
        self.assertEqual(current["future_deck_metadata"], {"opaque": "deck"})
        self.assertEqual(
            current["slides"][0]["future_slide_metadata"],
            {"opaque": "slide"},
        )

    def test_top_level_add_preserves_source_picture_crop_and_provenance(self) -> None:
        png = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNg"
            "YAAAAAMAASsJTYQAAAAASUVORK5CYII="
        )
        asset_id = hashlib.sha256(png).hexdigest()
        presentation = Presentation(
            width=960,
            height=540,
            slides=[
                Slide(
                    index=0,
                    transition=SlideTransition(type="push", direction="l"),
                    animations=[
                        AnimationStep(
                            kind="entr",
                            target_shape_id=5,
                            raw_attrs={"native-timing": "kept"},
                        )
                    ],
                    shapes=[
                        Shape(
                            type="picture",
                            name="Master photo",
                            shape_id=5,
                            source_scope="master",
                            bounds=Bounds(0, 0, 480, 540),
                            image=ImageInfo(
                                content_type="image/png",
                                data=f"yrkie-asset-base64://{asset_id}",
                                crop_left=0.21,
                                crop_right=0.07,
                                crop_top=0.11,
                                alpha=0.72,
                                effects=[{"type": "grayscale", "alpha": 0.4}],
                            ),
                        )
                    ],
                )
            ],
        )
        previous = dataclasses.asdict(presentation)
        previous["slides"][0]["shapes"][0]["future_source_xml"] = {
            "relationship_id": "rId9",
            "opaque": True,
        }
        previous["slides"][0]["shapes"][0]["image"]["future_image_metadata"] = {
            "native_crop": "kept"
        }
        editable = _editable_fragment(presentation)
        insertion = (
            '<div data-yrkie-element-id="new-note" element-type="text" '
            'style="position:absolute;left:560pt;top:100pt;width:240pt;'
            'height:80pt;color:#222222;font-size:22pt">Added note</div>'
        )
        layer_end = editable.rfind("</div>")
        edited = editable[:layer_end] + insertion + editable[layer_end:]

        result = reconcile_editable_html_with_current_ir(
            edited,
            previous,
            asset_payloads={
                asset_id: {
                    "content_type": "image/png",
                    "data_base64": base64.b64encode(png).decode("ascii"),
                }
            },
        )

        self.assertTrue(result["success"], result.get("diagnostics"))
        self.assertEqual(result["reconcile_mode"], "semantic-fallback")
        picture = result["presentation"]["slides"][0]["shapes"][0]
        self.assertEqual(picture["shape_id"], 5)
        self.assertEqual(picture["source_scope"], "master")
        self.assertEqual(
            picture["future_source_xml"],
            previous["slides"][0]["shapes"][0]["future_source_xml"],
        )
        self.assertEqual(
            picture["image"],
            previous["slides"][0]["shapes"][0]["image"],
        )
        self.assertEqual(
            result["presentation"]["slides"][0]["animations"],
            previous["slides"][0]["animations"],
        )
        self.assertEqual(
            result["presentation"]["slides"][0]["transition"],
            previous["slides"][0]["transition"],
        )

    def test_group_operation_returns_explicit_lossless_gate(self) -> None:
        presentation = _two_shape_presentation()
        editable = _editable_fragment(presentation)
        start, end = _shape_div_block(editable, 0)
        edited = (
            editable[:start]
            + '<div data-yrkie-element-id="new-group" element-type="group">'
            + editable[start:end]
            + "</div>"
            + editable[end:]
        )

        result = reconcile_editable_html_with_current_ir(
            edited,
            dataclasses.asdict(presentation),
        )

        self.assertFalse(result["success"])
        self.assertEqual(
            result["diagnostics"][0]["code"],
            "slide-structure-lossless-unsupported",
        )
        self.assertIn("group", result["diagnostics"][0]["message"].lower())

    def test_ungroup_operation_returns_explicit_lossless_gate(self) -> None:
        presentation = _source_presentation()
        editable = _editable_fragment(presentation)
        group_marker = editable.index('data-pptx-shape-key="1"')
        group_start = editable.rfind("<div", 0, group_marker)
        group_end = _shape_div_block(editable, 1)[1]
        open_end = editable.index(">", group_start) + 1
        close_start = editable.rfind("</div>", group_start, group_end)
        edited = (
            editable[:group_start]
            + editable[open_end:close_start]
            + editable[group_end:]
        )

        result = reconcile_editable_html_with_current_ir(
            edited,
            dataclasses.asdict(presentation),
        )

        self.assertFalse(result["success"])
        self.assertEqual(
            result["diagnostics"][0]["code"],
            "slide-structure-lossless-unsupported",
        )
        self.assertIn("group", result["diagnostics"][0]["message"].lower())

    def test_ephemeral_canonical_keeps_asset_references_external(self) -> None:
        png = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNg"
            "YAAAAAMAASsJTYQAAAAASUVORK5CYII="
        )
        font = b"wOF2" + (b"\0" * 44)
        image_asset_id = hashlib.sha256(png).hexdigest()
        font_asset_id = hashlib.sha256(font).hexdigest()
        presentation = Presentation(
            width=960,
            height=540,
            embedded_fonts=[
                EmbeddedFont(
                    typeface="Private Font",
                    content_type="font/woff2",
                    data=f"yrkie-asset-base64://{font_asset_id}",
                )
            ],
            slides=[
                Slide(
                    index=0,
                    shapes=[
                        Shape(
                            type="picture",
                            shape_id=3,
                            bounds=Bounds(0, 0, 960, 540),
                            image=ImageInfo(
                                content_type="image/png",
                                data=f"yrkie-asset-base64://{image_asset_id}",
                            ),
                        )
                    ],
                )
            ],
        )
        previous = dataclasses.asdict(presentation)
        editable = _editable_fragment(presentation)

        ephemeral = _build_ephemeral_canonical_html(
            editable,
            previous,
            asset_payloads={
                image_asset_id: {
                    "content_type": "image/png",
                    "data_base64": base64.b64encode(png).decode("ascii"),
                },
                font_asset_id: {
                    "content_type": "font/woff2",
                    "data_base64": base64.b64encode(font).decode("ascii"),
                },
            },
        )

        self.assertNotIn("<script", editable.lower())
        self.assertIn('id="pptx2html-canonical-ir"', ephemeral)
        self.assertNotIn(f"yrkie-asset-data://{image_asset_id}", ephemeral)
        self.assertIn(f"yrkie-asset-base64://{image_asset_id}", ephemeral)
        self.assertIn("data:image/png;base64,", ephemeral)
        self.assertIn("data:font/woff2;base64,", ephemeral)

    def test_real_asset_payload_is_transiently_materialized_for_reconcile(self) -> None:
        png = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNg"
            "YAAAAAMAASsJTYQAAAAASUVORK5CYII="
        )
        asset_id = hashlib.sha256(png).hexdigest()
        presentation = Presentation(
            width=960,
            height=540,
            slides=[
                Slide(
                    index=0,
                    shapes=[
                        Shape(
                            type="picture",
                            name="Photo",
                            shape_id=3,
                            bounds=Bounds(0, 0, 320, 180),
                            image=ImageInfo(
                                content_type="image/png",
                                data=f"yrkie-asset-base64://{asset_id}",
                            ),
                        )
                    ],
                )
            ],
        )
        previous = dataclasses.asdict(presentation)
        editable = _editable_fragment(presentation).replace(
            'element-name="Photo"',
            'element-name="Edited photo"',
            1,
        )

        result = reconcile_editable_html_with_current_ir(
            editable,
            previous,
            asset_payloads={
                asset_id: {
                    "content_type": "image/png",
                    "data_base64": base64.b64encode(png).decode("ascii"),
                }
            },
        )

        self.assertTrue(result["success"], result.get("diagnostics"))
        self.assertEqual(result["reconcile_mode"], "stable-id-merge")
        image = result["presentation"]["slides"][0]["shapes"][0]["image"]
        self.assertEqual(image["data"], f"yrkie-asset-base64://{asset_id}")

    def test_asset_payload_digest_mismatch_is_rejected(self) -> None:
        presentation = _source_presentation()
        previous = dataclasses.asdict(presentation)
        asset_id = "a" * 64

        result = reconcile_editable_html_with_current_ir(
            _editable_fragment(presentation),
            previous,
            asset_payloads={
                asset_id: {
                    "content_type": "image/png",
                    "data_base64": base64.b64encode(b"not-a-match").decode("ascii"),
                }
            },
        )

        self.assertFalse(result["success"])
        self.assertEqual(
            result["diagnostics"][0]["code"],
            "slide-reconcile-invalid-input",
        )

    def test_inline_asset_is_rejected_before_browser_compilation(self) -> None:
        previous = dataclasses.asdict(_source_presentation())
        edited = _editable_fragment(_source_presentation()).replace(
            "</section>",
            '<img src="data:image/png;base64,AA=="></section>',
            1,
        )

        result = reconcile_editable_html_with_current_ir(edited, previous)

        self.assertFalse(result["success"])
        self.assertEqual(
            result["diagnostics"][0]["code"],
            "slide-reconcile-inline-asset",
        )

    def test_data_url_shaped_run_text_is_not_treated_as_inline_binary(self) -> None:
        presentation = _source_presentation()
        literal = "data:image/png;base64,AA== is visible text"
        presentation.slides[0].shapes[0].text.paragraphs[0].runs[0].text = literal
        previous = dataclasses.asdict(presentation)

        result = reconcile_editable_html_with_current_ir(
            _editable_fragment(presentation),
            previous,
        )

        self.assertTrue(result["success"], result.get("diagnostics"))
        self.assertEqual(result["reconcile_mode"], "stable-id-merge")
        self.assertEqual(
            result["presentation"]["slides"][0]["shapes"][0]["text"]
            ["paragraphs"][0]["runs"][0]["text"],
            literal,
        )

    def test_inline_binary_in_typed_image_field_is_still_rejected(self) -> None:
        previous = dataclasses.asdict(_source_presentation())
        previous["slides"][0]["shapes"][0]["image"] = {
            "content_type": "image/png",
            "data": "data:image/png;base64,AA==",
        }

        result = reconcile_editable_html_with_current_ir(
            _editable_fragment(_source_presentation()),
            previous,
        )

        self.assertFalse(result["success"])
        self.assertEqual(
            result["diagnostics"][0]["code"],
            "slide-reconcile-inline-ir-asset",
        )

    def test_stable_merge_persists_text_paragraph_and_shape_styles(self) -> None:
        presentation = _source_presentation()
        previous = dataclasses.asdict(presentation)
        edited = _editable_fragment(presentation)
        edited = edited.replace(
            (
                'style="left:100.000pt; top:80.000pt; width:300.000pt; '
                'height:60.000pt; background-color:#AABBCC"'
            ),
            (
                'style="left:120pt;top:90pt;width:320pt;height:80pt;'
                'background-color:rgba(10,20,30,0.5);'
                'border:2pt dashed #ff0000;'
                'box-shadow:4pt 6pt 8pt rgba(0,0,0,0.4);'
                'opacity:0.75;transform:scaleX(-1) rotate(25deg)"'
            ),
            1,
        )
        edited = edited.replace(
            'style="line-height:1"',
            (
                'style="line-height:40px;text-align:right;margin:4px 6px;'
                'padding:2px 3px;text-indent:10px;direction:rtl;'
                'list-style-type:square"'
            ),
            1,
        )
        edited = edited.replace(
            'color:#112233; font-kerning:normal"',
            (
                'color:rgba(17,34,51,0.6);font-kerning:normal;'
                'font-family:&quot;Courier New&quot;;font-size:24pt;'
                'font-weight:700;font-style:italic;letter-spacing:2px;'
                'text-decoration-line:underline line-through;'
                'text-decoration-style:dashed;'
                'text-decoration-color:#00ff00;vertical-align:super"'
            ),
            1,
        )

        result = reconcile_editable_html_with_current_ir(edited, previous)

        self.assertTrue(result["success"], result.get("diagnostics"))
        self.assertEqual(result["reconcile_mode"], "stable-id-merge")
        shape = result["presentation"]["slides"][0]["shapes"][0]
        self.assertAlmostEqual(shape["bounds"]["left"], 120.0, places=2)
        self.assertAlmostEqual(shape["bounds"]["width"], 320.0, places=2)
        self.assertAlmostEqual(shape["rotation"], 25.0, places=2)
        self.assertEqual(shape["fill"]["color"], "0A141E")
        self.assertAlmostEqual(shape["fill"]["alpha"], 0.375, places=2)
        self.assertEqual(shape["border"]["color"], "FF0000")
        self.assertEqual(shape["border"]["dash"], "dash")
        self.assertEqual(shape["shadow"]["color"], "000000")
        paragraph = shape["text"]["paragraphs"][0]
        self.assertEqual(paragraph["alignment"], "r")
        self.assertTrue(paragraph["rtl"])
        self.assertEqual(paragraph["bullet"]["kind"], "char")
        self.assertEqual(paragraph["bullet"]["char"], "\u25aa")
        self.assertAlmostEqual(paragraph["line_spacing_pt"], 30.0, places=2)
        run = paragraph["runs"][0]
        self.assertEqual(run["font"]["family"], "Courier New")
        self.assertEqual(run["font"]["latin_family"], "Courier New")
        self.assertAlmostEqual(run["font"]["size_pt"], 24.0, places=2)
        self.assertTrue(run["font"]["bold"])
        self.assertTrue(run["font"]["italic"])
        self.assertEqual(run["font"]["underline"], "dash")
        self.assertEqual(run["font"]["strike"], "sngStrike")
        self.assertEqual(run["font"]["underline_color"], "00FF00")
        self.assertAlmostEqual(run["font"]["char_spacing_pt"], 1.5, places=2)
        self.assertAlmostEqual(run["font"]["baseline"], 0.3, places=2)

    def test_set_fill_and_opacity_are_combined_once(self) -> None:
        presentation = _source_presentation()
        edited = _editable_fragment(presentation).replace(
            "background-color:#AABBCC",
            "background-color:#010203;opacity:0.4",
            1,
        )

        result = reconcile_editable_html_with_current_ir(
            edited,
            dataclasses.asdict(presentation),
        )

        self.assertTrue(result["success"], result.get("diagnostics"))
        shape = result["presentation"]["slides"][0]["shapes"][0]
        self.assertEqual(shape["fill"]["color"], "010203")
        self.assertAlmostEqual(shape["fill"]["alpha"], 0.4, places=2)

    def test_group_child_bounds_are_reconciled_in_group_coordinates(self) -> None:
        presentation = _source_presentation()
        edited = _editable_fragment(presentation).replace(
            (
                'style="left:10.000pt; top:10.000pt; width:100.000pt; '
                'height:20.000pt"'
            ),
            'style="left:20pt;top:30pt;width:120pt;height:40pt"',
            1,
        )

        result = reconcile_editable_html_with_current_ir(
            edited,
            dataclasses.asdict(presentation),
        )

        self.assertTrue(result["success"], result.get("diagnostics"))
        child = result["presentation"]["slides"][0]["shapes"][1]["shapes"][0]
        self.assertAlmostEqual(child["bounds"]["left"], 20.0, places=2)
        self.assertAlmostEqual(child["bounds"]["top"], 30.0, places=2)
        self.assertAlmostEqual(child["bounds"]["width"], 120.0, places=2)
        self.assertAlmostEqual(child["bounds"]["height"], 40.0, places=2)

    def test_nested_added_element_fails_closed_without_native_ir_operation(self) -> None:
        presentation = _source_presentation()
        edited = _editable_fragment(presentation).replace(
            "Old title</span>",
            (
                'Old title</span><span data-yrkie-element-id="new-caption" '
                'style="display:block">Added caption</span>'
            ),
            1,
        )

        result = reconcile_editable_html_with_current_ir(
            edited,
            dataclasses.asdict(presentation),
        )

        self.assertFalse(result["success"])
        self.assertEqual(
            result["diagnostics"][0]["code"],
            "slide-structure-lossless-unsupported",
        )


if __name__ == "__main__":
    unittest.main()
