from __future__ import annotations

import sys
import unittest
from pathlib import Path


RUNTIME_ROOT = Path(__file__).resolve().parents[1]
if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from pptx2html.htmlir.compiler import (  # noqa: E402
    _background_fills_from_node,
    _custom_clip_path_polygon_paths_from_node,
    _element_opacity,
    _font_from_computed,
    _reconcile_canonical_presentation,
    _svg_graphic_shapes_from_node,
    _svg_fill_from_node,
    _svg_paint_color,
    _svg_path_to_normalized_d,
    _text_frame_from_node,
    _visual_scale,
)
from pptx2html.ir.model import (  # noqa: E402
    Bounds,
    BulletInfo,
    Fill,
    Font,
    GradientStop,
    Paragraph,
    Presentation,
    Run,
    Shape,
    Slide,
    TextFrame,
)
from pptx2html.renderer.canonical_html_renderer import CanonicalHtmlRenderer  # noqa: E402
from pptx2html.renderer.css import VIEWER_CSS  # noqa: E402


def text_node(*, font_size: str = "96px", line_height: str = "110.4px") -> dict:
    return {
        "computed": {
            "color": "rgb(255, 255, 255)",
            "display": "block",
            "fontFamily": '"Noto Sans SC", sans-serif',
            "fontSize": font_size,
            "fontStyle": "normal",
            "fontWeight": "700",
            "letterSpacing": "0px",
            "lineHeight": line_height,
            "opacity": "1",
            "overflow": "visible",
            "paddingBottom": "0px",
            "paddingLeft": "0px",
            "paddingRight": "0px",
            "paddingTop": "0px",
            "textAlign": "left",
            "textTransform": "none",
            "whiteSpace": "nowrap",
            "wordBreak": "normal",
        },
        "effectiveOpacity": 1.0,
        "layout": {"offsetHeight": 110.4, "offsetWidth": 1400},
        "rect": {"height": 110.4, "width": 1400},
        "tag": "span",
    }


class SlideFidelityCompilerTests(unittest.TestCase):
    def test_visual_scale_uses_fractional_computed_box_instead_of_rounded_offset_size(self) -> None:
        node = {
            "computed": {
                "boxSizing": "border-box",
                "width": "1184px",
                "height": "54.5938px",
            },
            "layout": {
                "offsetWidth": 1184,
                "offsetHeight": 55,
                "boxModel": {},
            },
            "rect": {"width": 1184, "height": 54.594},
        }

        self.assertAlmostEqual(_visual_scale(node), 1.0, places=5)

    def test_visual_scale_preserves_real_ancestor_transform(self) -> None:
        node = {
            "computed": {
                "boxSizing": "content-box",
                "width": "100px",
                "height": "50px",
            },
            "layout": {
                "offsetWidth": 112,
                "offsetHeight": 62,
                "boxModel": {
                    "paddingLeft": 5,
                    "paddingRight": 5,
                    "paddingTop": 5,
                    "paddingBottom": 5,
                    "borderLeft": 1,
                    "borderRight": 1,
                    "borderTop": 1,
                    "borderBottom": 1,
                },
            },
            "rect": {"width": 84, "height": 46.5},
        }

        self.assertAlmostEqual(_visual_scale(node), 0.75)

    def test_drawingml_gradient_angle_is_converted_to_css_coordinates(self) -> None:
        renderer = CanonicalHtmlRenderer()
        vertical = renderer._css_gradient_fill(
            Fill(
                type="gradient",
                gradient_angle=270,
                gradient_stops=[
                    GradientStop(position=0, color="0000FF"),
                    GradientStop(position=1, color="FFFFFF"),
                ],
            )
        )
        horizontal = renderer._css_gradient_fill(
            Fill(
                type="gradient",
                gradient_angle=0,
                gradient_stops=[
                    GradientStop(position=0, color="0000FF"),
                    GradientStop(position=1, color="FFFFFF"),
                ],
            )
        )

        self.assertTrue(vertical.startswith("linear-gradient(0.0deg,"))
        self.assertTrue(horizontal.startswith("linear-gradient(270.0deg,"))

    def test_powerpoint_placeholder_bounds_are_not_drawn(self) -> None:
        self.assertRegex(
            VIEWER_CSS,
            r"\.pptx-placeholder\s*\{\s*outline:\s*none;",
        )

    def test_powerpoint_ignores_outer_paragraph_spacing_at_text_frame_edges(self) -> None:
        presentation = Presentation(
            width=960,
            height=540,
            slides=[
                Slide(
                    index=0,
                    shapes=[
                        Shape(
                            type="auto_shape",
                            bounds=Bounds(20, 20, 400, 180),
                            text=TextFrame(
                                paragraphs=[
                                    Paragraph(
                                        spacing_before=10,
                                        spacing_after=5,
                                        runs=[Run(text="First", font=Font(size_pt=20))],
                                    ),
                                    Paragraph(
                                        spacing_before=12,
                                        spacing_after=8,
                                        runs=[Run(text="Second", font=Font(size_pt=20))],
                                    ),
                                ]
                            ),
                        )
                    ],
                )
            ],
        )

        source = CanonicalHtmlRenderer().render(presentation)

        self.assertNotIn("margin-top:10.00pt", source)
        self.assertIn("margin-bottom:5.00pt", source)
        self.assertIn("margin-top:12.00pt", source)
        self.assertNotIn("margin-bottom:8.00pt", source)

    def test_auto_numbered_bullets_increment_across_paragraphs(self) -> None:
        bullet = BulletInfo(kind="auto", auto_number_scheme="arabicPeriod")
        presentation = Presentation(
            width=960,
            height=540,
            slides=[
                Slide(
                    index=0,
                    shapes=[
                        Shape(
                            type="auto_shape",
                            bounds=Bounds(20, 20, 400, 180),
                            text=TextFrame(
                                paragraphs=[
                                    Paragraph(bullet=bullet, runs=[Run(text="One")]),
                                    Paragraph(bullet=bullet, runs=[Run(text="Two")]),
                                    Paragraph(bullet=bullet, runs=[Run(text="Three")]),
                                ]
                            ),
                        )
                    ],
                )
            ],
        )

        source = CanonicalHtmlRenderer().render(presentation)

        self.assertIn(">1. </span>", source)
        self.assertIn(">2. </span>", source)
        self.assertIn(">3. </span>", source)

    def test_canonical_shape_keys_disambiguate_duplicate_master_shape_ids(self) -> None:
        presentation = Presentation(
            width=960,
            height=540,
            slides=[
                Slide(
                    index=0,
                    shapes=[
                        Shape(name="Master watermark", shape_id=2, bounds=Bounds(0, 0, 960, 540)),
                        Shape(name="Slide title", shape_id=2, bounds=Bounds(48, 72, 360, 60)),
                    ],
                )
            ],
        )
        source = CanonicalHtmlRenderer().render(presentation)
        self.assertIn('data-pptx-shape-id="2" data-pptx-shape-key="0"', source)
        self.assertIn('data-pptx-shape-id="2" data-pptx-shape-key="1"', source)

        slide_node = {
            "path": "html > body > main > section",
            "nodeType": "element",
            "attributes": {"data-pptx2html-slide": "1"},
            "rect": {"left": 0, "top": 0, "width": 1280, "height": 720},
        }
        nodes = [
            slide_node,
            {
                "path": "html > body > main > section > div > div:nth-child(1)",
                "attributes": {"data-pptx-shape-id": "2", "data-pptx-shape-key": "0"},
                "rect": {"left": 0, "top": 0, "width": 1280, "height": 720},
                "computed": {},
            },
            {
                "path": "html > body > main > section > div > div:nth-child(2)",
                "attributes": {"data-pptx-shape-id": "2", "data-pptx-shape-key": "1"},
                "rect": {"left": 80, "top": 120, "width": 480, "height": 80},
                "computed": {},
            },
        ]

        reconciled = _reconcile_canonical_presentation(source, nodes, [slide_node], 0)

        self.assertIsNotNone(reconciled)
        result, inspected = reconciled
        self.assertEqual(inspected, 2)
        self.assertEqual(result.slides[0].shapes[0].bounds, Bounds(0, 0, 960, 540))
        self.assertEqual(result.slides[0].shapes[1].bounds, Bounds(60, 90, 360, 60))

    def test_1920_viewport_scales_css_font_with_slide_coordinates(self) -> None:
        frame = _text_frame_from_node("Title", text_node(), 0.5, 0.5)

        run = frame.paragraphs[0].runs[0]
        self.assertEqual(run.font.size_pt, 48.0)
        self.assertAlmostEqual(frame.paragraphs[0].line_spacing_pt, 55.2, places=3)

    def test_1280_viewport_preserves_existing_css_to_point_scale(self) -> None:
        frame = _text_frame_from_node("Title", text_node(), 0.75, 0.75)

        run = frame.paragraphs[0].runs[0]
        self.assertEqual(run.font.size_pt, 72.0)
        self.assertAlmostEqual(frame.paragraphs[0].line_spacing_pt, 82.8, places=3)

    def test_effective_opacity_includes_ancestor_opacity(self) -> None:
        node = {"computed": {"opacity": "1"}, "effectiveOpacity": 0.03}

        self.assertEqual(_element_opacity(node), 0.03)

    def test_background_clip_text_is_not_emitted_as_box_fill(self) -> None:
        node = {
            "computed": {
                "backgroundClip": "text",
                "backgroundColor": "rgba(0, 0, 0, 0)",
                "backgroundImage": "linear-gradient(to right, rgb(255, 255, 255), rgb(56, 189, 248))",
                "opacity": "1",
            },
            "effectiveOpacity": 1.0,
        }

        self.assertEqual(_background_fills_from_node(node), [])
        font = _font_from_computed(node["computed"], 48.0, 1.0, visual_scale=2.0 / 3.0)
        self.assertEqual(font.color, "38BDF8")
        self.assertIsNone(font.alpha)

    def test_svg_paint_server_does_not_fall_back_to_opaque_black(self) -> None:
        path_node = {
            "attributes": {"fill": "url(#grid-pattern)"},
            "computed": {"fill": "url(\"#grid-pattern\")"},
        }

        self.assertIsNone(_svg_paint_color(path_node, {}, "fill"))

    def test_svg_effective_opacity_is_not_applied_twice(self) -> None:
        path_node = {
            "attributes": {"fill": "#ffffff"},
            "computed": {"fill": "rgb(255, 255, 255)", "opacity": "1"},
            "effectiveOpacity": 0.03,
        }
        svg_node = {"computed": {"opacity": "0.03"}, "effectiveOpacity": 0.03}

        fill = _svg_fill_from_node(path_node, svg_node, "rect")

        self.assertIsNotNone(fill)
        self.assertEqual(fill.alpha, 0.03)

    def test_lucide_svg_children_compile_as_one_editable_icon(self) -> None:
        svg_node = {
            "path": "html > body > main > svg",
            "tag": "svg",
            "attributes": {
                "data-lucide": "rocket",
                "viewBox": "0 0 24 24",
                "fill": "none",
                "stroke": "currentColor",
                "stroke-width": "2",
                "stroke-linecap": "round",
                "stroke-linejoin": "round",
            },
            "computed": {"color": "rgb(14, 165, 233)", "opacity": "1"},
            "effectiveOpacity": 1.0,
        }
        nodes = [
            svg_node,
            {
                "path": "html > body > main > svg > path:nth-of-type(1)",
                "tag": "path",
                "attributes": {"d": "M 4 12 L 20 12"},
                "computed": {"stroke": "rgb(14, 165, 233)", "opacity": "1"},
                "effectiveOpacity": 1.0,
                "visible": False,
            },
            {
                "path": "html > body > main > svg > circle",
                "tag": "circle",
                "attributes": {"cx": "12", "cy": "12", "r": "4"},
                "computed": {"stroke": "rgb(14, 165, 233)", "opacity": "1"},
                "effectiveOpacity": 1.0,
                "visible": True,
            },
        ]

        shapes, next_shape_id = _svg_graphic_shapes_from_node(
            svg_node,
            nodes,
            svg_node["path"],
            Bounds(120, 80, 72, 72),
            7,
        )

        self.assertEqual(len(shapes), 1)
        self.assertEqual(next_shape_id, 8)
        self.assertEqual(len(shapes[0].geometry_paths), 2)
        self.assertEqual(shapes[0].border.width, 6.0)
        self.assertEqual(shapes[0].border.cap, "rnd")
        self.assertEqual(shapes[0].border.join, "round")
        self.assertEqual(shapes[0].icon.source, "lucide")
        self.assertEqual(shapes[0].icon.name, "rocket")
        self.assertEqual(shapes[0].icon.variant, "outline")

        source = CanonicalHtmlRenderer().render(
            Presentation(width=960, height=540, slides=[Slide(index=0, shapes=shapes)])
        )
        self.assertIn('element-type="icon"', source)

    def test_nested_lucide_icon_is_not_duplicated_by_enclosing_artwork(self) -> None:
        stroke = {"stroke": "rgb(14, 165, 233)", "fill": "rgb(200, 220, 240)", "opacity": "1"}
        art = {
            "path": "html > body > svg",
            "tag": "svg",
            "attributes": {"viewBox": "0 0 100 100"},
            "computed": {"opacity": "1"},
            "effectiveOpacity": 1.0,
            "rect": {"left": 0, "top": 0, "width": 100, "height": 100},
        }
        icon = {
            "path": "html > body > svg > g > svg",
            "tag": "svg",
            "attributes": {"data-lucide": "box", "viewBox": "0 0 24 24", "fill": "none",
                           "stroke": "currentColor", "stroke-width": "2"},
            "computed": {"color": "rgb(14, 165, 233)", "opacity": "1"},
            "effectiveOpacity": 1.0,
        }
        nodes = [
            art,
            {"path": "html > body > svg > circle", "tag": "circle", "visible": True,
             "attributes": {"cx": "50", "cy": "50", "r": "40"}, "computed": stroke, "effectiveOpacity": 1.0},
            {"path": "html > body > svg > g", "tag": "g", "visible": True, "attributes": {}, "computed": stroke},
            icon,
            {"path": "html > body > svg > g > svg > path", "tag": "path", "visible": True,
             "attributes": {"d": "M 4 12 L 20 12"}, "computed": stroke, "effectiveOpacity": 1.0},
        ]

        art_shapes, next_shape_id = _svg_graphic_shapes_from_node(art, nodes, art["path"], Bounds(0, 0, 100, 100), 1)
        icon_shapes, _ = _svg_graphic_shapes_from_node(icon, nodes, icon["path"], Bounds(38, 38, 24, 24), next_shape_id)

        self.assertEqual(len(art_shapes), 1)
        self.assertIn("htmlir:svg-circle", art_shapes[0].diagnostics)
        self.assertEqual(len(icon_shapes), 1)
        self.assertEqual(icon_shapes[0].icon.name, "box")

    def test_lucide_zap_compact_arc_flags_compile_to_editable_geometry(self) -> None:
        path = (
            "M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9"
            "A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666"
            "L8.086 20a1.5 1.5 0 002.475 1.56l9-9"
            "A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z"
        )

        normalized = _svg_path_to_normalized_d(path, (0, 0, 24, 24))

        self.assertIsNotNone(normalized)
        self.assertTrue(normalized.startswith("M 66.308 16.667"))
        self.assertTrue(normalized.endswith("Z"))

    def test_css_clip_path_polygon_calc_compiles_to_editable_custom_geometry(self) -> None:
        node = {
            "rect": {"left": 48, "top": 410, "width": 1184, "height": 38},
            "computed": {
                "clipPath": (
                    "polygon(0px 0px, calc(100% - 30px) 0px, 100% 50%, "
                    "calc(100% - 30px) 100%, 0px 100%)"
                )
            },
        }

        paths = _custom_clip_path_polygon_paths_from_node(
            node,
            Bounds(36, 307.5, 888, 28.5),
        )

        self.assertEqual(len(paths), 1)
        self.assertEqual(paths[0].fill, "norm")
        self.assertEqual(
            paths[0].d,
            "M 0 0 L 97.466 0 L 100 50 L 97.466 100 L 0 100 Z",
        )


if __name__ == "__main__":
    unittest.main()
