# Origin: pptx2html/ir/builder.py::PresentationBuilder._parse_three_d
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional, ThreeDInfo, emu_to_pt

def _parse_three_d(self, container: Optional[ET.Element]) -> Optional[ThreeDInfo]:
    if container is None:
        return None
    _A = NAMESPACE.DML_MAIN
    scene = container.find(f"{{{_A}}}scene3d")
    sp3d = container.find(f"{{{_A}}}sp3d")
    if scene is None and sp3d is None:
        return None

    info = ThreeDInfo()
    if scene is not None:
        camera = scene.find(f"{{{_A}}}camera")
        if camera is not None:
            info.camera_preset = camera.get("prst")
        light = scene.find(f"{{{_A}}}lightRig")
        if light is not None:
            info.light_rig = light.get("rig")
            info.light_direction = light.get("dir")

    if sp3d is not None:
        info.preset_material = sp3d.get("prstMaterial")
        info.extrusion_height = emu_to_pt(sp3d.get("extrusionH"))
        info.contour_width = emu_to_pt(sp3d.get("contourW"))
        bevel_top = sp3d.find(f"{{{_A}}}bevelT")
        if bevel_top is not None:
            info.bevel_top_width = emu_to_pt(bevel_top.get("w"))
            info.bevel_top_height = emu_to_pt(bevel_top.get("h"))
            info.bevel_top_preset = bevel_top.get("prst")
        bevel_bottom = sp3d.find(f"{{{_A}}}bevelB")
        if bevel_bottom is not None:
            info.bevel_bottom_width = emu_to_pt(bevel_bottom.get("w"))
            info.bevel_bottom_height = emu_to_pt(bevel_bottom.get("h"))
            info.bevel_bottom_preset = bevel_bottom.get("prst")
        extrusion = sp3d.find(f"{{{_A}}}extrusionClr")
        if extrusion is not None:
            info.extrusion_color, info.extrusion_alpha = self._color_from_fill_elem(extrusion)
        contour = sp3d.find(f"{{{_A}}}contourClr")
        if contour is not None:
            info.contour_color, info.contour_alpha = self._color_from_fill_elem(contour)

    info.diagnostics.append("3D effect rendered with a first-pass Canvas bevel/extrusion approximation")
    return info

_parse_three_d.__module__ = 'pptx2html.ir.builder'
_parse_three_d.__qualname__ = 'PresentationBuilder._parse_three_d'
