from __future__ import annotations

import copy
import functools
import os
import sys
import tempfile
import unittest
import zipfile
import xml.etree.ElementTree as ET
from io import BytesIO
from pathlib import Path
from typing import Any, Iterator


RUNTIME_ROOT = Path(__file__).resolve().parents[1]
if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from pptx2html.htmlir.compiler import (  # noqa: E402
    _layout_item_right_limit,
    _text_frame_from_node,
    compile_slide_fragment,
)
from pptx2html.ir.text_layout_snapshot import (  # noqa: E402
    layout_snapshot_is_valid,
    make_text_container_metrics,
)
from pptx2html.server.pptx_writer import write_pptx_from_ir  # noqa: E402
from pptx_pipeline import export_ir_to_pptx  # noqa: E402


A = "http://schemas.openxmlformats.org/drawingml/2006/main"
P = "http://schemas.openxmlformats.org/presentationml/2006/main"
NS = {"a": A, "p": P}


# This is the slide supplied with the regression report. Keep its authored
# line breaks and Flex geometry intact: it is the acceptance fixture for the
# Chromium-vs-PowerPoint width mismatch that changed two lines into three.
USER_REPORTED_FRAGMENT = r"""
<div class="w-full h-full bg-[#FCFBF7] relative overflow-hidden flex px-[120px] py-[100px]">
    <!-- Background Decor -->
    <div class="absolute left-[-100px] top-[-100px] w-[600px] h-[600px] bg-[#EAE2CE]/40 rounded-full blur-[120px] pointer-events-none" z-index="0"></div>
    <div class="absolute right-[50px] bottom-[-200px] w-[800px] h-[800px] bg-[#D1C6AC]/20 rounded-full blur-[150px] pointer-events-none" z-index="0"></div>

    <div class="absolute top-[80px] right-[100px] z-0 opacity-[0.05] pointer-events-none">
        <i class="w-[500px] h-[500px] text-[#282521] -rotate-12" data-lucide="flag" element-name="bg-icon"></i>
    </div>

    <!-- Main Content Container: Asymmetrical Split -->
    <div class="relative z-10 w-full flex h-full items-center">

        <!-- Left Side: Section Title -->
        <div class="w-[40%] flex flex-col pr-20 relative">
            <div class="flex items-center space-x-6 mb-8">
                <div class="w-4 h-4 rounded-full bg-[#C0B298]" element-name="title-dot" element-type="shape"></div>
                <p class="text-[28px] font-sans-cn text-[#6A6357] tracking-widest uppercase" element-name="section-label" element-type="text">KEY BATTLEFIELDS</p>
            </div>

            <h1 class="text-[80px] font-serif-cn text-[#282521] leading-[1.2] mb-12" element-name="main-title" element-type="text">
                我们在关键战场<br />赢得了胜利
            </h1>

            <div class="w-24 h-[4px] bg-[#282521]" element-name="divider" element-type="shape"></div>
        </div>

        <!-- Right Side: Structured List -->
        <div class="w-[60%] flex flex-col space-y-16 pl-10 border-l border-[#EAE2CE]">

            <!-- Item 1 -->
            <div class="flex items-start space-x-12 group" element-name="battle-item-1" element-type="group">
                <div class="text-[110px] font-serif-cn text-[#D1C6AC] leading-[0.8] tracking-tighter opacity-60 group-hover:text-[#282521] transition-colors shrink-0" element-type="text">
                    01
                </div>
                <div class="flex flex-col pt-2">
                    <h2 class="text-[42px] font-sans-cn font-bold text-[#282521] mb-4" element-type="text">产品升级</h2>
                    <p class="text-[30px] font-sans-cn text-[#6A6357] leading-[1.6]" element-type="text">
                        完成了 V3.0 版本的彻底重构，<br/>技术不再是瓶颈
                    </p>
                </div>
            </div>

            <!-- Item 2 -->
            <div class="flex items-start space-x-12 group" element-name="battle-item-2" element-type="group">
                <div class="text-[110px] font-serif-cn text-[#D1C6AC] leading-[0.8] tracking-tighter opacity-60 group-hover:text-[#282521] transition-colors shrink-0" element-type="text">
                    02
                </div>
                <div class="flex flex-col pt-2">
                    <h2 class="text-[42px] font-sans-cn font-bold text-[#282521] mb-4" element-type="text">品牌重塑</h2>
                    <p class="text-[30px] font-sans-cn text-[#6A6357] leading-[1.6]" element-type="text">
                        品牌声量环比提升 40%，<br/>成功破圈高净值人群
                    </p>
                </div>
            </div>

            <!-- Item 3 -->
            <div class="flex items-start space-x-12 group" element-name="battle-item-3" element-type="group">
                <div class="text-[110px] font-serif-cn text-[#D1C6AC] leading-[0.8] tracking-tighter opacity-60 group-hover:text-[#282521] transition-colors shrink-0" element-type="text">
                    03
                </div>
                <div class="flex flex-col pt-2">
                    <h2 class="text-[42px] font-sans-cn font-bold text-[#282521] mb-4" element-type="text">降本增效</h2>
                    <p class="text-[30px] font-sans-cn text-[#6A6357] leading-[1.6]" element-type="text">
                        通过自动化流程<br/>节省了 15% 的显性运营成本
                    </p>
                </div>
            </div>

        </div>
    </div>
</div>
"""


CONTRACT_FRAGMENT = r"""
<div class="w-full h-full relative overflow-hidden bg-white">
  <p element-name="hard-break" element-type="text"
       class="absolute left-[80px] top-[60px] w-[700px] text-[30px] leading-[1.4]">
    作者指定第一行<br/>Author specified second line
  </p>
  <div element-name="soft-cjk-latin" element-type="text"
       class="absolute left-[80px] top-[180px] w-[235px] text-[30px] leading-[1.4]">
    这是需要浏览器自动换行的 CJK and Latin mixed content
  </div>
  <div element-name="rich-soft-wrap" element-type="text"
       class="absolute left-[430px] top-[180px] w-[270px] text-[30px] leading-[1.4]">
    普通文本<span class="font-bold text-[#B42318]">加粗 Rich😀Run</span><em>斜体尾部继续换行</em>
  </div>
  <div element-name="true-multiline" element-type="text"
       class="absolute left-[80px] top-[390px] w-[180px] text-[30px] leading-[1.4]">
    真正需要很多视觉行的长段落 long paragraph must remain exactly like Chromium
  </div>
</div>
"""


ROTATED_NO_WRAP_FRAGMENT = r"""
<div class="w-full h-full relative overflow-hidden bg-white">
  <div element-name="rotated-watermark" element-type="text"
       class="absolute left-[120px] top-[180px] w-[720px] text-[210px] leading-none"
       style="white-space: nowrap; transform: rotate(12deg); opacity: 0.03;">
    RESULTS
  </div>
</div>
"""


AUTHORED_BREAK_INDENT_FRAGMENT = r"""
<div class="w-full h-full relative overflow-hidden bg-white">
  <h1 element-name="formatted-title" element-type="text"
      class="absolute left-[100px] top-[120px] w-[1200px] text-[120px] leading-[1.1]">
    From Momentum to Scale:<br>
    Our 2026 Journey
  </h1>
</div>
"""


BASELINE_FLEX_FRAGMENT = r"""
<div class="w-full h-full relative overflow-hidden bg-white">
  <div class="absolute right-[100px] bottom-[100px] flex items-baseline gap-4">
    <span element-name="page-label" element-type="text"
          class="text-[18px] leading-none"
          style="font-family: Outfit;">PAGE</span>
    <span element-name="page-number" element-type="text"
          class="text-[80px] leading-none font-bold"
          style="font-family: Fraunces;">01</span>
  </div>
</div>
"""


REPORTED_LINES = (
    ("完成了 V3.0 版本的彻底重构，", "技术不再是瓶颈"),
    ("品牌声量环比提升 40%，", "成功破圈高净值人群"),
    ("通过自动化流程", "节省了 15% 的显性运营成本"),
)


def _iter_shapes(shapes: list[dict[str, Any]]) -> Iterator[dict[str, Any]]:
    for shape in shapes:
        yield shape
        yield from _iter_shapes(shape.get("shapes") or shape.get("children") or [])


def _runs(shape: dict[str, Any]) -> list[dict[str, Any]]:
    frame = shape.get("text") or shape.get("text_frame") or {}
    return [
        run
        for paragraph in frame.get("paragraphs") or []
        for run in paragraph.get("runs") or []
    ]


def _shape_text(shape: dict[str, Any]) -> str:
    return "".join(str(run.get("text") or "") for run in _runs(shape) if run.get("kind") != "break")


def _normalized_text(value: str) -> str:
    return " ".join(str(value or "").replace("\v", " ").replace("\r", " ").replace("\n", " ").split())


def _find_text_shape(presentation: dict[str, Any], *needles: str) -> dict[str, Any]:
    shapes = presentation["slides"][0]["shapes"]
    matches = [
        shape
        for shape in _iter_shapes(shapes)
        if (shape.get("text") or shape.get("text_frame"))
        and all(_normalized_text(needle) in _normalized_text(_shape_text(shape)) for needle in needles)
    ]
    if not matches:
        raise AssertionError(f"No text shape contains {needles!r}")
    return min(matches, key=lambda item: len(_normalized_text(_shape_text(item))))


def _break_count(shape: dict[str, Any]) -> int:
    return sum(1 for run in _runs(shape) if run.get("kind") == "break")


def _shape_metrics(shape: dict[str, Any]) -> dict[str, Any]:
    bounds = shape["bounds"]
    return make_text_container_metrics(bounds["width"], bounds["height"])


@functools.lru_cache(maxsize=1)
def _compile_user_report() -> dict[str, Any]:
    return compile_slide_fragment(
        USER_REPORTED_FRAGMENT,
        include_ast=True,
        include_browser_screenshot=False,
        viewport=(1920, 1080),
        timeout_ms=30_000,
    )


@functools.lru_cache(maxsize=1)
def _compile_contract_fixture() -> dict[str, Any]:
    return compile_slide_fragment(
        CONTRACT_FRAGMENT,
        include_ast=True,
        include_browser_screenshot=False,
        viewport=(1920, 1080),
        timeout_ms=30_000,
    )


@functools.lru_cache(maxsize=1)
def _compile_authored_break_indent_fixture() -> dict[str, Any]:
    return compile_slide_fragment(
        AUTHORED_BREAK_INDENT_FRAGMENT,
        include_ast=True,
        include_browser_screenshot=False,
        viewport=(1920, 1080),
        timeout_ms=30_000,
    )


@functools.lru_cache(maxsize=1)
def _compile_baseline_flex_fixture() -> dict[str, Any]:
    return compile_slide_fragment(
        BASELINE_FLEX_FRAGMENT,
        include_ast=True,
        include_browser_screenshot=False,
        viewport=(1920, 1080),
        timeout_ms=30_000,
    )


def _slide_shape_xml(root: ET.Element, *needles: str) -> ET.Element:
    for shape in root.findall(".//p:sp", NS):
        text = "".join(item.text or "" for item in shape.findall(".//a:t", NS))
        if all(_normalized_text(needle) in _normalized_text(text) for needle in needles):
            return shape
    raise AssertionError(f"No DrawingML text shape contains {needles!r}")


def _write_user_report_pptx(path: Path) -> dict[str, Any]:
    presentation = _compile_user_report()["presentation"]
    write_pptx_from_ir(presentation, path)
    return presentation


def _base_computed_style() -> dict[str, str]:
    return {
        "color": "rgb(40, 37, 33)",
        "display": "block",
        "fontFamily": "Arial, sans-serif",
        "fontSize": "30px",
        "fontStyle": "normal",
        "fontWeight": "400",
        "letterSpacing": "0px",
        "lineHeight": "42px",
        "opacity": "1",
        "overflow": "visible",
        "overflowX": "visible",
        "overflowY": "visible",
        "paddingBottom": "0px",
        "paddingLeft": "0px",
        "paddingRight": "0px",
        "paddingTop": "0px",
        "textAlign": "left",
        "textTransform": "none",
        "whiteSpace": "normal",
        "wordBreak": "normal",
        "overflowWrap": "normal",
    }


def _layout_node(
    path: str,
    *,
    left: float,
    top: float,
    width: float,
    height: float,
    display: str = "block",
    flex_direction: str = "row",
    overflow_x: str = "visible",
) -> dict[str, Any]:
    return {
        "path": path,
        "visible": True,
        "rect": {
            "left": left,
            "top": top,
            "width": width,
            "height": height,
            "right": left + width,
            "bottom": top + height,
        },
        "computed": {
            "display": display,
            "flexDirection": flex_direction,
            "overflowX": overflow_x,
            "overflow": overflow_x,
            "position": "static",
            "paddingRight": "0px",
            "borderRightWidth": "0px",
        },
    }


class HtmlTextWrapFidelityTests(unittest.TestCase):
    def test_baseline_flex_offset_and_fonts_survive_pptx_export(self) -> None:
        presentation = _compile_baseline_flex_fixture()["presentation"]
        label = _find_text_shape(presentation, "PAGE")
        number = _find_text_shape(presentation, "01")
        label_frame = label.get("text") or label["text_frame"]
        number_frame = number.get("text") or number["text_frame"]
        label_top_offset = float(label_frame.get("baseline_top_offset") or 0)
        top_offset = float(number_frame.get("baseline_top_offset") or 0)

        self.assertGreaterEqual(label_top_offset, 0)
        self.assertGreater(top_offset, 0)
        self.assertGreater(top_offset, label_top_offset)

        payload = export_ir_to_pptx(presentation, export_watermark=False)
        with zipfile.ZipFile(BytesIO(payload)) as package:
            root = ET.fromstring(package.read("ppt/slides/slide1.xml"))
            presentation_xml = package.read("ppt/presentation.xml")
            font_parts = [
                name
                for name in package.namelist()
                if name.startswith("ppt/fonts/") and name.endswith(".fntdata")
            ]

        xml_shape = _slide_shape_xml(root, "01")
        body_pr = xml_shape.find("p:txBody/a:bodyPr", NS)
        self.assertIsNotNone(body_pr)
        self.assertEqual(int(body_pr.get("tIns") or 0), round(top_offset * 12_700))
        self.assertIn(b'typeface="Fraunces"', presentation_xml)
        self.assertIn(b'typeface="Outfit"', presentation_xml)
        self.assertGreaterEqual(len(font_parts), 2)

        with tempfile.TemporaryDirectory(prefix="yrkie-traditional-font-export-") as temp_dir:
            output = Path(temp_dir) / "baseline-fonts.pptx"
            persisted_payload = export_ir_to_pptx(
                presentation,
                output_path=output,
                export_watermark=False,
            )
            self.assertEqual(output.read_bytes(), persisted_payload)
            with zipfile.ZipFile(output) as package:
                self.assertTrue(
                    any(name.startswith("ppt/fonts/") for name in package.namelist())
                )

    def test_collapsible_source_indentation_is_trimmed_after_authored_break(self) -> None:
        presentation = _compile_authored_break_indent_fixture()["presentation"]
        shape = _find_text_shape(presentation, "From Momentum", "Our 2026 Journey")
        frame = shape.get("text") or shape["text_frame"]
        runs = _runs(shape)
        break_index = next(index for index, run in enumerate(runs) if run.get("kind") == "break")

        self.assertEqual(runs[break_index - 1]["text"], "From Momentum to Scale:")
        self.assertEqual(runs[break_index + 1]["text"], "Our 2026 Journey")
        self.assertTrue(
            layout_snapshot_is_valid(frame, container_metrics=_shape_metrics(shape))
        )

        with tempfile.TemporaryDirectory(prefix="yrkie-authored-break-indent-") as temp_dir:
            output = Path(temp_dir) / "authored-break-indent.pptx"
            write_pptx_from_ir(presentation, output)
            with zipfile.ZipFile(output) as package:
                root = ET.fromstring(package.read("ppt/slides/slide1.xml"))
            xml_shape = _slide_shape_xml(root, "From Momentum", "Our 2026 Journey")
            self.assertFalse(
                any((text.text or "").startswith(" ") for text in xml_shape.findall(".//a:t", NS))
            )

    def test_preserved_white_space_keeps_authored_post_break_indent(self) -> None:
        computed = _base_computed_style()
        computed["whiteSpace"] = "pre-wrap"
        node = {
            "computed": computed,
            "effectiveOpacity": 1.0,
            "layout": {"offsetHeight": 84.0, "offsetWidth": 600.0},
            "rect": {"height": 84.0, "width": 600.0},
            "textRect": {"height": 84.0, "width": 300.0},
            "tag": "div",
            "richTextRuns": [
                {"kind": "text", "text": "First", "computed": computed},
                {"kind": "break", "breakKind": "line"},
                {"kind": "text", "text": "  Second", "computed": computed},
            ],
        }

        frame = _text_frame_from_node("First\n  Second", node, 0.5, 0.5)

        self.assertEqual(frame.paragraphs[0].runs[2].text, "  Second")

    def test_rotated_no_wrap_watermark_gets_deterministic_snapshot(self) -> None:
        presentation = compile_slide_fragment(
            ROTATED_NO_WRAP_FRAGMENT,
            include_ast=False,
            include_browser_screenshot=False,
            viewport=(1920, 1080),
        )["presentation"]
        shape = _find_text_shape(presentation, "RESULTS")
        frame = shape.get("text") or shape["text_frame"]
        snapshot = frame.get("layout_snapshot") or {}

        self.assertFalse(frame["word_wrap"])
        self.assertEqual(snapshot.get("provider"), "deterministic-no-wrap")
        self.assertEqual(snapshot.get("soft_breaks"), [])
        self.assertFalse(frame.get("layout_snapshot_dirty"))
        self.assertTrue(
            layout_snapshot_is_valid(frame, container_metrics=_shape_metrics(shape))
        )

    def test_nested_visible_flex_column_can_borrow_outer_row_free_right(self) -> None:
        outer_path = "html > body > div#outer"
        item_path = f"{outer_path} > div#item"
        text_path = f"{item_path} > p#text"
        nodes = {
            outer_path: _layout_node(
                outer_path,
                left=0,
                top=0,
                width=900,
                height=300,
                display="flex",
                flex_direction="row",
            ),
            item_path: _layout_node(
                item_path,
                left=100,
                top=40,
                width=200,
                height=180,
                display="flex",
                flex_direction="column",
            ),
            text_path: _layout_node(
                text_path,
                left=100,
                top=80,
                width=200,
                height=40,
            ),
        }

        limit = _layout_item_right_limit(nodes[text_path], nodes, 1.0, 1.0)

        self.assertEqual(limit, 900.0)
        self.assertGreaterEqual(limit, 100.0 + 200.0 * 1.12)

    def test_clipped_nested_flex_column_is_a_hard_right_cap(self) -> None:
        outer_path = "html > body > div#outer"
        item_path = f"{outer_path} > div#item"
        text_path = f"{item_path} > p#text"
        nodes = {
            outer_path: _layout_node(
                outer_path,
                left=0,
                top=0,
                width=900,
                height=300,
                display="flex",
                flex_direction="row",
            ),
            item_path: _layout_node(
                item_path,
                left=100,
                top=40,
                width=200,
                height=180,
                display="flex",
                flex_direction="column",
                overflow_x="hidden",
            ),
            text_path: _layout_node(
                text_path,
                left=100,
                top=80,
                width=200,
                height=40,
            ),
        }

        limit = _layout_item_right_limit(nodes[text_path], nodes, 1.0, 1.0)

        self.assertEqual(limit, 300.0)

    def test_row_sibling_and_grid_track_bound_expansion(self) -> None:
        outer_path = "html > body > div#outer"
        item_path = f"{outer_path} > div#item"
        text_path = f"{item_path} > p#text"
        sibling_path = f"{outer_path} > div#sibling"
        base_nodes = {
            outer_path: _layout_node(
                outer_path,
                left=0,
                top=0,
                width=900,
                height=300,
                display="flex",
                flex_direction="row",
            ),
            item_path: _layout_node(
                item_path,
                left=100,
                top=40,
                width=200,
                height=180,
                display="flex",
                flex_direction="column",
            ),
            text_path: _layout_node(
                text_path,
                left=100,
                top=80,
                width=200,
                height=40,
            ),
            sibling_path: _layout_node(
                sibling_path,
                left=360,
                top=40,
                width=220,
                height=180,
            ),
        }

        sibling_limit = _layout_item_right_limit(
            base_nodes[text_path],
            base_nodes,
            1.0,
            1.0,
        )
        self.assertEqual(sibling_limit, 360.0)

        grid_nodes = copy.deepcopy(base_nodes)
        grid_nodes.pop(sibling_path)
        grid_nodes[outer_path]["computed"]["display"] = "grid"
        grid_limit = _layout_item_right_limit(
            grid_nodes[text_path],
            grid_nodes,
            1.0,
            1.0,
        )
        self.assertEqual(grid_limit, 300.0)

    def test_browser_visual_line_contract_uses_unicode_code_point_offsets(self) -> None:
        ast_nodes = _compile_contract_fixture()["ast"]["nodes"]
        node = next(
            item
            for item in ast_nodes
            if (item.get("attributes") or {}).get("element-name") == "rich-soft-wrap"
        )
        layout = node.get("visualTextLayout") or {}
        source_text = str(layout.get("sourceText") or "")
        offsets = [
            int(value)
            for value in (layout.get("authoredBreakOffsets") or []) + (layout.get("softBreakOffsets") or [])
        ]
        line_offsets = [
            int(value)
            for line in layout.get("lines") or []
            for value in (line.get("start"), line.get("end"))
        ]

        self.assertEqual(layout.get("version"), 1)
        self.assertTrue(layout.get("reliable"))
        self.assertIn("😀", source_text)
        self.assertGreaterEqual(len(layout.get("lines") or []), 2)
        self.assertTrue(layout.get("softBreakOffsets"))
        self.assertTrue(all(0 <= value <= len(source_text) for value in offsets + line_offsets))
        self.assertEqual(int(layout["lines"][-1]["end"]), len(source_text))

    def test_user_reported_hard_break_lines_are_hash_bound_in_ir(self) -> None:
        presentation = _compile_user_report()["presentation"]

        for first_line, second_line in REPORTED_LINES:
            with self.subTest(first_line=first_line):
                shape = _find_text_shape(presentation, first_line, second_line)
                frame = shape.get("text") or shape["text_frame"]
                snapshot = frame.get("layout_snapshot") or {}
                self.assertTrue(frame["word_wrap"])
                self.assertEqual(_break_count(shape), 1)
                self.assertEqual(snapshot.get("version"), 1)
                self.assertEqual(snapshot.get("provider"), "chromium")
                self.assertEqual(snapshot.get("soft_breaks"), [])
                self.assertFalse(frame.get("layout_snapshot_dirty"))
                self.assertRegex(str(snapshot.get("source_sha256") or ""), r"^[0-9a-f]{64}$")
                self.assertRegex(str(snapshot.get("metrics_sha256") or ""), r"^[0-9a-f]{64}$")
                self.assertTrue(
                    layout_snapshot_is_valid(frame, container_metrics=_shape_metrics(shape))
                )
                self.assertEqual(
                    _normalized_text(_shape_text(shape)),
                    _normalized_text(first_line + second_line),
                )

    def test_user_reported_source_free_pptx_writes_no_reflow_contract(self) -> None:
        with tempfile.TemporaryDirectory(prefix="yrkie-text-wrap-") as temp_dir:
            output = Path(temp_dir) / "user-reported-wrap.pptx"
            _write_user_report_pptx(output)

            with zipfile.ZipFile(output) as package:
                root = ET.fromstring(package.read("ppt/slides/slide1.xml"))

            for first_line, second_line in REPORTED_LINES:
                with self.subTest(first_line=first_line):
                    shape = _slide_shape_xml(root, first_line, second_line)
                    body_pr = shape.find(".//a:bodyPr", NS)
                    self.assertIsNotNone(body_pr)
                    self.assertEqual(body_pr.get("wrap"), "none")
                    self.assertEqual(len(shape.findall(".//a:br", NS)), 1)

    def test_visual_soft_lines_are_materialized_for_cjk_latin_and_real_multiline_text(self) -> None:
        presentation = _compile_contract_fixture()["presentation"]

        for expected in (
            "这是需要浏览器自动换行的 CJK and Latin mixed content",
            "真正需要很多视觉行的长段落 long paragraph must remain exactly like Chromium",
        ):
            with self.subTest(expected=expected):
                shape = _find_text_shape(presentation, expected)
                frame = shape.get("text") or shape["text_frame"]
                snapshot = frame.get("layout_snapshot") or {}
                self.assertEqual(_break_count(shape), 0)
                self.assertTrue(frame["word_wrap"])
                self.assertGreaterEqual(len(snapshot.get("soft_breaks") or []), 1)
                self.assertRegex(str(snapshot.get("source_sha256") or ""), r"^[0-9a-f]{64}$")
                self.assertRegex(str(snapshot.get("metrics_sha256") or ""), r"^[0-9a-f]{64}$")
                self.assertTrue(
                    layout_snapshot_is_valid(frame, container_metrics=_shape_metrics(shape))
                )
                self.assertEqual(_normalized_text(_shape_text(shape)), _normalized_text(expected))

    def test_materialized_soft_break_preserves_mixed_rich_run_styles_and_unicode(self) -> None:
        presentation = _compile_contract_fixture()["presentation"]
        shape = _find_text_shape(presentation, "普通文本", "Rich😀Run", "斜体尾部")
        runs = _runs(shape)

        self.assertEqual(_break_count(shape), 0)
        frame = shape.get("text") or shape["text_frame"]
        snapshot = frame.get("layout_snapshot") or {}
        self.assertTrue(frame["word_wrap"])
        self.assertGreaterEqual(len(snapshot.get("soft_breaks") or []), 1)
        self.assertIn("Rich😀Run", _shape_text(shape))
        self.assertTrue(
            any(
                "加粗" in str(run.get("text") or "")
                and bool((run.get("font") or {}).get("bold"))
                for run in runs
            )
        )
        paragraphs = frame["paragraphs"]
        for soft_break in snapshot["soft_breaks"]:
            paragraph_index = int(soft_break["paragraph_index"])
            run_index = int(soft_break["run_index"])
            offset_utf16 = int(soft_break["offset_utf16"])
            run_text = str(paragraphs[paragraph_index]["runs"][run_index].get("text") or "")
            utf16_length = len(run_text.encode("utf-16-le")) // 2
            self.assertGreaterEqual(offset_utf16, 0)
            self.assertLessEqual(offset_utf16, utf16_length)
        self.assertTrue(
            any(
                "斜体" in str(run.get("text") or "")
                and bool((run.get("font") or {}).get("italic"))
                for run in runs
            )
        )

    def test_stale_visual_line_contract_is_ignored_after_text_edit(self) -> None:
        computed = _base_computed_style()
        edited_text = "edited content remains dynamically wrappable"
        node = {
            "computed": computed,
            "effectiveOpacity": 1.0,
            "layout": {"offsetHeight": 84.0, "offsetWidth": 600.0},
            "rect": {"height": 84.0, "width": 600.0},
            "textRect": {"height": 84.0, "width": 300.0},
            "tag": "div",
            "richTextRuns": [
                {
                    "kind": "text",
                    "text": edited_text,
                    "computed": computed,
                    "effectiveOpacity": 1.0,
                }
            ],
            "visualTextLayout": {
                "version": 1,
                "reliable": True,
                "sourceText": "old content that used to wrap",
                "authoredBreakOffsets": [],
                "softBreakOffsets": [12],
                "lines": [
                    {"start": 0, "end": 12, "rect": {"left": 0, "top": 0, "width": 100, "height": 42}},
                    {"start": 12, "end": 29, "rect": {"left": 0, "top": 42, "width": 140, "height": 42}},
                ],
            },
        }

        frame = _text_frame_from_node(edited_text, node, 0.5, 0.5)

        self.assertTrue(frame.word_wrap)
        self.assertIsNone(frame.layout_snapshot)
        self.assertEqual(
            sum(1 for paragraph in frame.paragraphs for run in paragraph.runs if run.kind == "break"),
            0,
        )

    def test_writer_consumes_only_a_hash_matching_visual_layout_snapshot(self) -> None:
        original = _compile_contract_fixture()["presentation"]
        original_shape = _find_text_shape(original, "这是需要浏览器自动换行的 CJK and Latin mixed content")
        original_breaks = len((original_shape.get("text") or {})["layout_snapshot"]["soft_breaks"])

        with tempfile.TemporaryDirectory(prefix="yrkie-text-layout-hash-") as temp_dir:
            temp = Path(temp_dir)
            intact_path = temp / "intact.pptx"
            write_pptx_from_ir(original, intact_path)
            with zipfile.ZipFile(intact_path) as package:
                intact_root = ET.fromstring(package.read("ppt/slides/slide1.xml"))
            intact_shape = _slide_shape_xml(
                intact_root,
                "这是需要浏览器自动换行的 CJK and Latin mixed content",
            )
            intact_body_pr = intact_shape.find(".//a:bodyPr", NS)
            self.assertIsNotNone(intact_body_pr)
            self.assertEqual(intact_body_pr.get("wrap"), "none")
            self.assertEqual(len(intact_shape.findall(".//a:br", NS)), original_breaks)

            edited = copy.deepcopy(original)
            edited_shape = _find_text_shape(
                edited,
                "这是需要浏览器自动换行的 CJK and Latin mixed content",
            )
            edited_frame = edited_shape.get("text") or edited_shape["text_frame"]
            edited_run = next(
                run
                for paragraph in edited_frame["paragraphs"]
                for run in paragraph["runs"]
                if run.get("kind") != "break" and run.get("text")
            )
            edited_run["text"] += " edited"
            self.assertFalse(
                layout_snapshot_is_valid(
                    edited_frame,
                    container_metrics=_shape_metrics(edited_shape),
                )
            )
            edited_path = temp / "content-edited.pptx"
            write_pptx_from_ir(edited, edited_path)
            with zipfile.ZipFile(edited_path) as package:
                edited_root = ET.fromstring(package.read("ppt/slides/slide1.xml"))
            edited_xml_shape = _slide_shape_xml(edited_root, "mixed content edited")
            edited_body_pr = edited_xml_shape.find(".//a:bodyPr", NS)
            self.assertIsNotNone(edited_body_pr)
            self.assertEqual(edited_body_pr.get("wrap"), "square")
            self.assertEqual(len(edited_xml_shape.findall(".//a:br", NS)), 0)

            resized = copy.deepcopy(original)
            resized_shape = _find_text_shape(
                resized,
                "这是需要浏览器自动换行的 CJK and Latin mixed content",
            )
            resized_shape["bounds"]["width"] = float(resized_shape["bounds"]["width"]) + 48.0
            resized_frame = resized_shape.get("text") or resized_shape["text_frame"]
            self.assertFalse(
                layout_snapshot_is_valid(
                    resized_frame,
                    container_metrics=_shape_metrics(resized_shape),
                )
            )
            resized_path = temp / "metrics-edited.pptx"
            write_pptx_from_ir(resized, resized_path)
            with zipfile.ZipFile(resized_path) as package:
                resized_root = ET.fromstring(package.read("ppt/slides/slide1.xml"))
            resized_xml_shape = _slide_shape_xml(
                resized_root,
                "这是需要浏览器自动换行的 CJK and Latin mixed content",
            )
            resized_body_pr = resized_xml_shape.find(".//a:bodyPr", NS)
            self.assertIsNotNone(resized_body_pr)
            self.assertEqual(resized_body_pr.get("wrap"), "square")
            self.assertEqual(len(resized_xml_shape.findall(".//a:br", NS)), 0)

            explicitly_dirty = copy.deepcopy(original)
            dirty_shape = _find_text_shape(
                explicitly_dirty,
                "这是需要浏览器自动换行的 CJK and Latin mixed content",
            )
            dirty_frame = dirty_shape.get("text") or dirty_shape["text_frame"]
            dirty_frame["layout_snapshot_dirty"] = True
            self.assertFalse(
                layout_snapshot_is_valid(
                    dirty_frame,
                    container_metrics=_shape_metrics(dirty_shape),
                )
            )
            dirty_path = temp / "explicitly-dirty.pptx"
            write_pptx_from_ir(explicitly_dirty, dirty_path)
            with zipfile.ZipFile(dirty_path) as package:
                dirty_root = ET.fromstring(package.read("ppt/slides/slide1.xml"))
            dirty_xml_shape = _slide_shape_xml(
                dirty_root,
                "这是需要浏览器自动换行的 CJK and Latin mixed content",
            )
            dirty_body_pr = dirty_xml_shape.find(".//a:bodyPr", NS)
            self.assertIsNotNone(dirty_body_pr)
            self.assertEqual(dirty_body_pr.get("wrap"), "square")
            self.assertEqual(len(dirty_xml_shape.findall(".//a:br", NS)), 0)


@unittest.skipUnless(
    os.name == "nt" and os.environ.get("YRKIE_TEST_POWERPOINT_COM") == "1",
    "Set YRKIE_TEST_POWERPOINT_COM=1 on a Windows host with PowerPoint to run COM acceptance.",
)
class PowerPointTextWrapAcceptanceTests(unittest.TestCase):
    def test_reported_descriptions_remain_exactly_two_lines_in_powerpoint(self) -> None:
        try:
            import pythoncom
            import win32com.client
        except ImportError as error:  # pragma: no cover - host capability gate
            self.fail(f"PowerPoint COM acceptance was requested but pywin32 is unavailable: {error}")

        with tempfile.TemporaryDirectory(prefix="yrkie-text-wrap-com-") as temp_dir:
            output = Path(temp_dir) / "user-reported-wrap-com.pptx"
            presentation_ir = _write_user_report_pptx(output)
            expected_bounds = {
                first: _find_text_shape(presentation_ir, first, second)["bounds"]
                for first, second in REPORTED_LINES
            }

            pythoncom.CoInitialize()
            app = None
            presentation = None
            try:
                app = win32com.client.DispatchEx("PowerPoint.Application")
                presentation = app.Presentations.Open(str(output), ReadOnly=True, WithWindow=False)
                slide = presentation.Slides(1)
                observations: dict[str, tuple[int, float]] = {}
                for index in range(1, slide.Shapes.Count + 1):
                    shape = slide.Shapes(index)
                    try:
                        if not shape.HasTextFrame or not shape.TextFrame2.HasText:
                            continue
                        text = _normalized_text(shape.TextFrame2.TextRange.Text)
                    except Exception:
                        continue
                    for first_line, second_line in REPORTED_LINES:
                        if _normalized_text(first_line) in text and _normalized_text(second_line) in text:
                            observations[first_line] = (
                                int(shape.TextFrame.TextRange.Lines().Count),
                                float(shape.TextFrame2.TextRange.BoundHeight),
                            )

                for first_line, _second_line in REPORTED_LINES:
                    with self.subTest(first_line=first_line):
                        self.assertIn(first_line, observations)
                        line_count, bound_height = observations[first_line]
                        self.assertEqual(line_count, 2)
                        self.assertGreater(bound_height, 0.0)
                        self.assertLessEqual(bound_height, float(expected_bounds[first_line]["height"]) + 3.0)
            finally:
                if presentation is not None:
                    presentation.Close()
                if app is not None:
                    app.Quit()
                pythoncom.CoUninitialize()


if __name__ == "__main__":
    unittest.main()
