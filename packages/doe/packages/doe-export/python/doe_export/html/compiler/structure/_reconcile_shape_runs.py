# Origin: pptx2html/htmlir/compiler.py::_reconcile_shape_runs
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Shape
from doe_export.html.compiler.shared import CSS_PX_TO_PT, Font, dataclasses
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_color import _css_color
from doe_export.html.compiler.css._css_float import _css_float
from doe_export.html.compiler.css._css_px import _css_px
from doe_export.html.compiler.css._element_opacity import _element_opacity
from doe_export.html.compiler.typography._strike_from_text_decoration_style import _strike_from_text_decoration_style
from doe_export.html.compiler.typography._text_decoration_color import _text_decoration_color
from doe_export.html.compiler.typography._text_decoration_lines import _text_decoration_lines
from doe_export.html.compiler.typography._text_decoration_style import _text_decoration_style
from doe_export.html.compiler.typography._text_decoration_thickness_pt import _text_decoration_thickness_pt
from doe_export.html.compiler.typography._underline_from_text_decoration_style import _underline_from_text_decoration_style

def _reconcile_shape_runs(
    shape: Shape,
    root_node: dict[str, Any],
    nodes: list[dict[str, Any]],
    shape_paths: set[str],
) -> bool:
    if shape.text is None:
        return True
    root_path = str(root_node.get("path") or "")
    run_nodes = []
    for node in nodes:
        path = str(node.get("path") or "")
        if not path.startswith(root_path + " > "):
            continue
        if any(path.startswith(other + " > ") for other in shape_paths if other != root_path and other.startswith(root_path + " > ")):
            continue
        attrs = node.get("attributes") if isinstance(node.get("attributes"), dict) else {}
        classes = str(attrs.get("class") or "").split()
        if "pptx-run" in classes:
            run_nodes.append(node)
    ir_runs = [run for paragraph in shape.text.paragraphs for run in paragraph.runs if run.kind != "break"]
    if len(run_nodes) != len(ir_runs):
        return False
    metrics_changed = False
    for run, node in zip(ir_runs, run_nodes):
        before_text = run.text
        before_font = dataclasses.asdict(run.font) if run.font is not None else None
        text = node.get("innerTextRaw")
        if isinstance(text, str):
            run.text = text
        computed = _computed(node)
        if run.font is None:
            run.font = Font()
        color = _css_color(computed.get("color"))
        if color:
            run.font.color = color[0]
            alpha = color[1] * _element_opacity(node)
            run.font.alpha = alpha if alpha < 0.999 else None
        font_size = _css_px(computed.get("fontSize"))
        if font_size > 0:
            run.font.size_pt = font_size * CSS_PX_TO_PT
        family = str(computed.get("fontFamily") or "").split(",", 1)[0].strip(" '\"")
        existing_families = {
            value
            for value in (
                run.font.family,
                run.font.latin_family,
                run.font.ea_family,
                run.font.cs_family,
                run.font.sym_family,
            )
            if value
        }
        if family and family not in existing_families:
            run.font.family = family
            run.font.latin_family = family
            run.font.ea_family = family
            run.font.cs_family = family
            run.font.sym_family = family
        weight = str(computed.get("fontWeight") or "").strip().lower()
        if weight:
            try:
                run.font.bold = int(float(weight)) >= 600
            except ValueError:
                run.font.bold = weight in {"bold", "bolder"}
        style = str(computed.get("fontStyle") or "").lower()
        if style:
            run.font.italic = style in {"italic", "oblique"}
        letter_spacing = str(computed.get("letterSpacing") or "").strip().lower()
        if letter_spacing and letter_spacing != "normal":
            run.font.char_spacing_pt = _css_px(letter_spacing) * CSS_PX_TO_PT
        elif letter_spacing == "normal":
            run.font.char_spacing_pt = None
        word_spacing = str(computed.get("wordSpacing") or "").strip().lower()
        if word_spacing and word_spacing != "normal":
            run.font.word_spacing_pt = _css_px(word_spacing) * CSS_PX_TO_PT
        elif word_spacing == "normal":
            run.font.word_spacing_pt = None
        decoration_lines = _text_decoration_lines(computed)
        decoration_style = _text_decoration_style(
            computed.get("textDecorationStyle")
        )
        decoration_width = _text_decoration_thickness_pt(
            computed,
            run.font.size_pt or 12.0,
        )
        decoration_color, decoration_alpha = _text_decoration_color(
            computed,
            _element_opacity(node),
        )
        if "underline" in decoration_lines:
            run.font.underline = _underline_from_text_decoration_style(
                decoration_style,
                decoration_width,
            )
            run.font.underline_color = decoration_color
            run.font.underline_alpha = (
                decoration_alpha if decoration_alpha < 0.999 else None
            )
            run.font.underline_width_pt = decoration_width
        else:
            run.font.underline = None
            run.font.underline_color = None
            run.font.underline_alpha = None
            run.font.underline_width_pt = None
        if "line-through" in decoration_lines:
            run.font.strike = _strike_from_text_decoration_style(
                decoration_style
            )
            run.font.strike_color = decoration_color
            run.font.strike_alpha = (
                decoration_alpha if decoration_alpha < 0.999 else None
            )
            run.font.strike_width_pt = decoration_width
            run.font.strike_style = decoration_style
        else:
            run.font.strike = None
            run.font.strike_color = None
            run.font.strike_alpha = None
            run.font.strike_width_pt = None
            run.font.strike_style = None
        vertical_align = str(computed.get("verticalAlign") or "").strip().lower()
        if vertical_align in {"super", "sup"}:
            run.font.baseline = 0.3
        elif vertical_align in {"sub"}:
            run.font.baseline = -0.25
        elif vertical_align in {"baseline", "middle", "top", "bottom"}:
            run.font.baseline = None
        elif vertical_align.endswith("%"):
            run.font.baseline = _css_float(vertical_align[:-1], 0.0) / 100.0
        elif vertical_align:
            shift_pt = _css_px(vertical_align) * CSS_PX_TO_PT
            size_pt = max(1.0, float(run.font.size_pt or 12.0))
            run.font.baseline = shift_pt / size_pt
        transform = str(computed.get("textTransform") or "").strip().lower()
        variant = str(computed.get("fontVariant") or "").strip().lower()
        if transform == "uppercase":
            run.font.capitalization = "all"
        elif variant in {"small-caps", "all-small-caps"}:
            run.font.capitalization = "small"
        elif transform == "lowercase":
            run.font.capitalization = None
            run.text = run.text.lower()
        elif transform == "capitalize":
            run.font.capitalization = None
            run.text = run.text.title()
        elif transform in {"none", ""} and variant in {"normal", ""}:
            run.font.capitalization = None
        if run.text != before_text or dataclasses.asdict(run.font) != before_font:
            metrics_changed = True
    if run_nodes:
        computed = _computed(run_nodes[0])
        shape.text.white_space = (
            str(computed.get("whiteSpace") or "").strip().lower() or None
        )
        shape.text.word_break = (
            str(computed.get("wordBreak") or "").strip().lower() or None
        )
        shape.text.overflow_wrap = (
            str(computed.get("overflowWrap") or "").strip().lower() or None
        )
        shape.text.word_wrap = shape.text.white_space not in {"nowrap", "pre"}
    if metrics_changed:
        shape.text.layout_snapshot_dirty = True
    return True

_reconcile_shape_runs.__module__ = 'pptx2html.htmlir.compiler'
