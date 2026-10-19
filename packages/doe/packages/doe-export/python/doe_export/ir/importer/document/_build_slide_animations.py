# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_slide_animations
from __future__ import annotations
from doe_export.ir.importer.shared import AnimationStep, ET, NAMESPACE, SlidePart, local_name

def _build_slide_animations(self, slide_part: SlidePart) -> list[AnimationStep]:
    _P = NAMESPACE.PML_MAIN
    timing = slide_part.element.find(f"{{{_P}}}timing")
    if timing is None:
        return []

    steps: list[AnimationStep] = []
    behavior_names = {"set", "anim", "animEffect", "animScale", "animMotion"}
    next_click_index = 1

    def visit(elem: ET.Element, base_ms: int, click_index: int, group: dict[str, str]) -> None:
        nonlocal next_click_index
        kind = local_name(elem.tag)
        if kind in behavior_names:
            c_bhvr = elem.find(f"{{{_P}}}cBhvr")
            c_tn = c_bhvr.find(f"{{{_P}}}cTn") if c_bhvr is not None else None
            target = c_bhvr.find(f".//{{{_P}}}spTgt") if c_bhvr is not None else None
            cond = self._first_start_condition(c_tn)
            behavior_delay = self._ctn_start_delay_ms(c_tn)
            start_ms = base_ms + behavior_delay
            step = AnimationStep(
                kind=kind,
                order=len(steps),
                target_shape_id=self._optional_int(target.get("spid")) if target is not None else None,
                start_ms=start_ms,
                click_index=click_index,
                group_id=group.get("id"),
                node_type=group.get("nodeType"),
                preset_id=group.get("presetID"),
                preset_class=group.get("presetClass"),
                preset_subtype=group.get("presetSubtype"),
                transition=elem.get("transition"),
                filter=elem.get("filter"),
                duration_ms=self._duration_ms(c_tn.get("dur") if c_tn is not None else None),
                delay_ms=behavior_delay if cond is not None else None,
                trigger=cond.get("evt") if cond is not None else group.get("nodeType"),
                fill=c_tn.get("fill") if c_tn is not None else None,
                attr_names=self._animation_attr_names(c_bhvr),
                from_value=self._animation_value_at(elem, "0"),
                to_value=self._animation_to_value(elem) or self._animation_value_at(elem, "100000"),
                motion_path=elem.get("path"),
                raw_attrs=self._animation_raw_attrs(elem, c_tn, group),
            )
            self._populate_animation_motion(step)
            self._populate_animation_scale(step, elem)
            steps.append(step)
            return

        c_tn = elem.find(f"{{{_P}}}cTn")
        current_click = click_index
        node_start_ms = base_ms + self._ctn_start_delay_ms(c_tn)
        if self._ctn_is_click_trigger(c_tn):
            current_click = next_click_index
            next_click_index += 1
            node_start_ms = self._ctn_start_delay_ms(c_tn)

        next_group = self._animation_group_meta(c_tn, group)
        child_tn_lst = c_tn.find(f"{{{_P}}}childTnLst") if c_tn is not None else None
        if child_tn_lst is not None:
            children = list(child_tn_lst)
        else:
            children = [
                child
                for child in list(elem)
                if local_name(child.tag) not in {"cTn", "stCondLst", "endCondLst"}
            ]
        for child in children:
            visit(child, node_start_ms, current_click, next_group)

    tn_lst = timing.find(f"{{{_P}}}tnLst")
    roots = list(tn_lst) if tn_lst is not None else list(timing)
    for root in roots:
        visit(root, 0, 0, {})
    return steps

_build_slide_animations.__module__ = 'pptx2html.ir.builder'
_build_slide_animations.__qualname__ = 'PresentationBuilder._build_slide_animations'
