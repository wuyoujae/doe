# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_text_frame_from_element
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, ET, NAMESPACE, Optional, Paragraph, TextFrame

def _build_text_frame_from_element(
    self,
    shape: BaseShape,
    tf_elem: ET.Element,
    word_wrap: Optional[bool] = None,
    margins: Optional[dict[str, Optional[float]]] = None,
    table_font_props: Optional[dict] = None,
) -> TextFrame:
    body_pr = tf_elem.find(f"{{{NAMESPACE.DML_MAIN}}}bodyPr")
    body_props = self._effective_text_body_props(shape, tf_elem, word_wrap, margins)
    paras = []
    for p_elem in tf_elem.findall(f"{{{NAMESPACE.DML_MAIN}}}p"):
        p_pr = p_elem.find(f"{{{NAMESPACE.DML_MAIN}}}pPr")
        para_level = self._paragraph_level(p_pr)
        default_font_props = self._default_font_props(
            shape, tf_elem, p_elem, para_level, table_font_props
        )
        end_para_font = self._end_para_font(shape, p_elem, default_font_props)
        paragraph_props = self._default_paragraph_props(
            shape, tf_elem, p_elem, para_level
        )
        paras.append(
            Paragraph(
                alignment=paragraph_props.get("alignment", p_pr.get("algn") if p_pr is not None else None),
                level=para_level,
                spacing_before=paragraph_props.get("spacing_before"),
                spacing_after=paragraph_props.get("spacing_after"),
                line_spacing_multiple=paragraph_props.get("line_spacing_multiple"),
                line_spacing_pt=paragraph_props.get("line_spacing_pt"),
                line_spacing_type=paragraph_props.get("line_spacing_type"),
                spacing_before_type=paragraph_props.get("spacing_before_type"),
                spacing_after_type=paragraph_props.get("spacing_after_type"),
                spacing_before_pct=paragraph_props.get("spacing_before_pct"),
                spacing_after_pct=paragraph_props.get("spacing_after_pct"),
                margin_left=paragraph_props.get("margin_left"),
                margin_right=paragraph_props.get("margin_right"),
                indent=paragraph_props.get("indent"),
                default_tab_size=paragraph_props.get("default_tab_size"),
                tab_stops=paragraph_props.get("tab_stops", []),
                font_align=paragraph_props.get("font_align"),
                rtl=paragraph_props.get("rtl"),
                ea_line_break=paragraph_props.get("ea_line_break"),
                latin_line_break=paragraph_props.get("latin_line_break"),
                hanging_punctuation=paragraph_props.get("hanging_punctuation"),
                bullet=paragraph_props.get("bullet"),
                end_para_font=end_para_font,
                runs=self._runs_from_paragraph(shape, p_elem, default_font_props),
            )
        )

    return TextFrame(
        vertical_align=body_props.get("vertical_align"),
        word_wrap=body_props.get("word_wrap", True),
        margins=body_props.get("margins"),
        horizontal_overflow=body_props.get("horizontal_overflow"),
        vertical_overflow=body_props.get("vertical_overflow"),
        vertical_text=body_props.get("vertical_text"),
        rotation=body_props.get("rotation"),
        anchor_center=body_props.get("anchor_center"),
        column_count=body_props.get("column_count"),
        column_spacing=body_props.get("column_spacing"),
        rtl_columns=body_props.get("rtl_columns"),
        compatibility_line_spacing=body_props.get("compatibility_line_spacing"),
        autofit_mode=body_props.get("autofit_mode"),
        autofit_font_scale=body_props.get("autofit_font_scale"),
        autofit_line_spacing_reduction=body_props.get("autofit_line_spacing_reduction"),
        text_warp=body_props.get("text_warp"),
        diagnostics=body_props.get("diagnostics", []),
        style_provenance=self._text_style_provenance(shape, tf_elem, table_font_props),
        paragraphs=paras,
    )

_build_text_frame_from_element.__module__ = 'pptx2html.ir.builder'
_build_text_frame_from_element.__qualname__ = 'PresentationBuilder._build_text_frame_from_element'
