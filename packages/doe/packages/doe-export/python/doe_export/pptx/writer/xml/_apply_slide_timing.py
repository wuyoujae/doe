# Origin: pptx2html/server/pptx_writer.py::_apply_slide_timing
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import OxmlElement, qn
from doe_export.pptx.writer.xml._append_start_condition import _append_start_condition
from doe_export.pptx.writer.xml._build_animation_wrapper import _build_animation_wrapper
from doe_export.pptx.writer.xml._ctn import _ctn
from doe_export.pptx.writer.xml._insert_slide_child_before import _insert_slide_child_before
from doe_export.pptx.writer.xml._normalize_animation_step import _normalize_animation_step
from doe_export.pptx.writer.xml._remove_children import _remove_children
from doe_export.pptx.writer.xml._slide_target import _slide_target

def _apply_slide_timing(slide, animations: list[dict[str, Any]], shape_id_map: dict[int, int]) -> None:
    root = slide._element
    _remove_children(root, ("p:timing",))
    steps = [_normalize_animation_step(step, shape_id_map) for step in animations if isinstance(step, dict)]
    steps = [step for step in steps if step is not None]
    if not steps:
        return

    next_ctn_id = 1

    def next_id() -> str:
        nonlocal next_ctn_id
        value = str(next_ctn_id)
        next_ctn_id += 1
        return value

    timing = OxmlElement("p:timing")
    tn_lst = OxmlElement("p:tnLst")
    timing.append(tn_lst)
    root_par = OxmlElement("p:par")
    tn_lst.append(root_par)
    root_ctn = _ctn(next_id(), {"dur": "indefinite", "restart": "never", "nodeType": "tmRoot"})
    root_par.append(root_ctn)
    root_children = OxmlElement("p:childTnLst")
    root_ctn.append(root_children)
    main_seq = OxmlElement("p:seq")
    main_seq.set("concurrent", "1")
    main_seq.set("nextAc", "seek")
    root_children.append(main_seq)
    main_ctn = _ctn(next_id(), {"dur": "indefinite", "nodeType": "mainSeq"})
    main_seq.append(main_ctn)
    main_children = OxmlElement("p:childTnLst")
    main_ctn.append(main_children)

    for click_index in sorted({step["click_index"] for step in steps}):
        click_steps = [step for step in steps if step["click_index"] == click_index]
        click_steps.sort(key=lambda item: (item.get("order", 0), item.get("start_ms", 0)))
        group_par = OxmlElement("p:par")
        main_children.append(group_par)
        group_attrs = {"fill": "hold", "nodeType": "withEffect" if click_index == 0 else "clickEffect"}
        group_ctn = _ctn(next_id(), group_attrs)
        group_par.append(group_ctn)
        _append_start_condition(group_ctn, 0)
        group_children = OxmlElement("p:childTnLst")
        group_ctn.append(group_children)
        for step in click_steps:
            wrapper = _build_animation_wrapper(step, next_id)
            if wrapper is not None:
                group_children.append(wrapper)

    prev_cond_lst = OxmlElement("p:prevCondLst")
    prev_cond = OxmlElement("p:cond")
    prev_cond.set("evt", "onPrev")
    prev_cond.set("delay", "0")
    prev_cond.append(_slide_target())
    prev_cond_lst.append(prev_cond)
    main_seq.append(prev_cond_lst)

    next_cond_lst = OxmlElement("p:nextCondLst")
    next_cond = OxmlElement("p:cond")
    next_cond.set("evt", "onNext")
    next_cond.set("delay", "0")
    next_cond.append(_slide_target())
    next_cond_lst.append(next_cond)
    main_seq.append(next_cond_lst)

    bld_lst = OxmlElement("p:bldLst")
    seen_targets: set[int] = set()
    for step in steps:
        spid = int(step["spid"])
        if spid in seen_targets:
            continue
        seen_targets.add(spid)
        bld = OxmlElement("p:bldP")
        bld.set("spid", str(spid))
        bld.set("grpId", "0")
        bld_lst.append(bld)
    if len(bld_lst):
        timing.append(bld_lst)

    _insert_slide_child_before(root, timing, (qn("p:extLst"),))

_apply_slide_timing.__module__ = 'pptx2html.server.pptx_writer'
