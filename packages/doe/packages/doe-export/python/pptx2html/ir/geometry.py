"""DrawingML geometry parsing and first-pass SVG path generation."""

from __future__ import annotations

from dataclasses import dataclass, field
from functools import lru_cache
import math
from pathlib import Path
import xml.etree.ElementTree as ET

from pptx2html.ir.model import GeometryPath, GeometryRect
from pptx2html.ooxml.safe_xml import parse_xml_file
from pptx2html.ooxml.values import parse_bool
from pptx2html.ooxml.xml import local_name


@dataclass
class BuiltGeometry:
    """Parsed geometry ready for renderer consumption."""

    source: str | None = None
    adjustments: dict[str, float] = field(default_factory=dict)
    paths: list[GeometryPath] = field(default_factory=list)
    text_rect: GeometryRect | None = None
    diagnostics: list[str] = field(default_factory=list)


class GeometryBuilder:
    """Build normalized 0-100 SVG geometry from DrawingML geometry XML."""

    def build(
        self,
        sp_pr: ET.Element | None,
        preset: str | None = None,
        width: float | None = None,
        height: float | None = None,
    ) -> BuiltGeometry:
        if sp_pr is None:
            return BuiltGeometry()

        cust_geom = _find_child(sp_pr, "custGeom")
        if cust_geom is not None:
            return self._build_from_definition(cust_geom, "custom")

        prst_geom = _find_child(sp_pr, "prstGeom")
        if prst_geom is not None:
            preset_name = prst_geom.get("prst")
            if preset_name:
                return self._build_preset(preset_name, prst_geom, width, height)

        prst_cxn = _find_child(sp_pr, "prstCxn")
        if prst_cxn is not None:
            preset_name = prst_cxn.get("prst") or preset
            if preset_name:
                built = self._build_preset(preset_name, prst_cxn, width, height)
                built.source = "connector"
                return built

        if preset:
            return self._build_preset(preset, None, width, height)

        return BuiltGeometry()

    def _build_preset(
        self,
        preset: str,
        local_geom: ET.Element | None,
        width: float | None = None,
        height: float | None = None,
    ) -> BuiltGeometry:
        definition = _preset_definition(preset)
        adjustments = _guide_values(_find_child(local_geom, "avLst"))
        if definition is None:
            return BuiltGeometry(
                source="preset",
                adjustments=adjustments,
                diagnostics=[f"unsupported preset geometry: {preset}"],
            )

        built = self._build_from_definition(definition, "preset", adjustments, width, height)
        built.adjustments.update(adjustments)
        return built

    def _build_from_definition(
        self,
        geom: ET.Element,
        source: str,
        local_adjustments: dict[str, float] | None = None,
        width: float | None = None,
        height: float | None = None,
    ) -> BuiltGeometry:
        diagnostics: list[str] = []
        width, height = _definition_size(geom, source, width, height)
        ctx = _base_context(width, height)

        adjustments = _guide_values(_find_child(geom, "avLst"), ctx)
        if local_adjustments:
            adjustments.update(local_adjustments)
        ctx.update(adjustments)

        for gd in _iter_guides(_find_child(geom, "gdLst")):
            name = gd.get("name")
            if name:
                ctx[name] = _eval_formula(gd.get("fmla"), ctx, diagnostics)

        text_rect = self._parse_text_rect(_find_child(geom, "rect"), ctx, width, height, diagnostics)
        paths = self._parse_path_list(_find_child(geom, "pathLst"), ctx, width, height, diagnostics)
        return BuiltGeometry(
            source=source,
            adjustments=adjustments,
            paths=paths,
            text_rect=text_rect,
            diagnostics=diagnostics,
        )

    def _parse_text_rect(
        self,
        rect: ET.Element | None,
        ctx: dict[str, float],
        width: float,
        height: float,
        diagnostics: list[str],
    ) -> GeometryRect | None:
        if rect is None:
            return None
        def norm_x(value: float) -> float:
            return value / width * 100.0 if width else value

        def norm_y(value: float) -> float:
            return value / height * 100.0 if height else value

        return GeometryRect(
            left=norm_x(_eval_value(rect.get("l", "l"), ctx, diagnostics)),
            top=norm_y(_eval_value(rect.get("t", "t"), ctx, diagnostics)),
            right=norm_x(_eval_value(rect.get("r", "r"), ctx, diagnostics)),
            bottom=norm_y(_eval_value(rect.get("b", "b"), ctx, diagnostics)),
        )

    def _parse_path_list(
        self,
        path_lst: ET.Element | None,
        base_ctx: dict[str, float],
        default_width: float,
        default_height: float,
        diagnostics: list[str],
    ) -> list[GeometryPath]:
        if path_lst is None:
            return []

        paths: list[GeometryPath] = []
        for path in _children(path_lst, "path"):
            width = _positive_float(path.get("w")) or default_width
            height = _positive_float(path.get("h")) or default_height
            ctx = _base_context(width, height)
            ctx.update({k: v for k, v in base_ctx.items() if k not in {"w", "h", "r", "b", "hc", "vc"}})
            ctx.update(_dimension_context(width, height))
            d = self._path_d(path, ctx, width, height, diagnostics)
            if not d:
                continue
            stroke = parse_bool(path.get("stroke"))
            paths.append(
                GeometryPath(
                    d=d,
                    fill=path.get("fill") or "norm",
                    stroke=True if stroke is None else stroke,
                )
            )
        return paths

    def _path_d(
        self,
        path: ET.Element,
        ctx: dict[str, float],
        width: float,
        height: float,
        diagnostics: list[str],
    ) -> str:
        commands: list[str] = []
        current: tuple[float, float] | None = None

        def norm_x(value: float) -> float:
            return value / width * 100.0 if width else value

        def norm_y(value: float) -> float:
            return value / height * 100.0 if height else value

        def point(elem: ET.Element | None) -> tuple[float, float]:
            if elem is None:
                return 0.0, 0.0
            return (
                norm_x(_eval_value(elem.get("x", "0"), ctx, diagnostics)),
                norm_y(_eval_value(elem.get("y", "0"), ctx, diagnostics)),
            )

        for cmd in list(path):
            name = local_name(cmd.tag)
            if name in ("moveTo", "lnTo"):
                x, y = point(_find_child(cmd, "pt"))
                commands.append(f"{'M' if name == 'moveTo' else 'L'} {_fmt(x)} {_fmt(y)}")
                current = (x, y)
            elif name == "quadBezTo":
                pts = [point(pt) for pt in _children(cmd, "pt")]
                if len(pts) >= 2:
                    commands.append(f"Q {_fmt(pts[0][0])} {_fmt(pts[0][1])} {_fmt(pts[1][0])} {_fmt(pts[1][1])}")
                    current = pts[1]
                else:
                    diagnostics.append("quadBezTo missing points")
            elif name == "cubicBezTo":
                pts = [point(pt) for pt in _children(cmd, "pt")]
                if len(pts) >= 3:
                    commands.append(
                        "C "
                        f"{_fmt(pts[0][0])} {_fmt(pts[0][1])} "
                        f"{_fmt(pts[1][0])} {_fmt(pts[1][1])} "
                        f"{_fmt(pts[2][0])} {_fmt(pts[2][1])}"
                    )
                    current = pts[2]
                else:
                    diagnostics.append("cubicBezTo missing points")
            elif name == "arcTo":
                if current is None:
                    diagnostics.append("arcTo without current point")
                    continue
                arc = self._arc_to_svg(cmd, current, ctx, width, height, diagnostics)
                if arc:
                    commands.append(arc[0])
                    current = arc[1]
            elif name == "close":
                commands.append("Z")

        return " ".join(commands)

    def _arc_to_svg(
        self,
        cmd: ET.Element,
        current: tuple[float, float],
        ctx: dict[str, float],
        width: float,
        height: float,
        diagnostics: list[str],
    ) -> tuple[str, tuple[float, float]] | None:
        rx_raw = abs(_eval_value(cmd.get("wR", "0"), ctx, diagnostics))
        ry_raw = abs(_eval_value(cmd.get("hR", "0"), ctx, diagnostics))
        rx = rx_raw / width * 100.0 if width else rx_raw
        ry = ry_raw / height * 100.0 if height else ry_raw
        if rx <= 0 or ry <= 0:
            return None

        start = math.radians(_eval_value(cmd.get("stAng", "0"), ctx, diagnostics) / 60000.0)
        sweep_value = _eval_value(cmd.get("swAng", "0"), ctx, diagnostics)
        sweep = math.radians(sweep_value / 60000.0)
        center_x = current[0] - rx * math.cos(start)
        center_y = current[1] - ry * math.sin(start)
        end_ang = start + sweep
        end = (
            center_x + rx * math.cos(end_ang),
            center_y + ry * math.sin(end_ang),
        )
        large = 1 if abs(sweep_value) > 10800000 else 0
        sweep_flag = 1 if sweep_value > 0 else 0
        return (
            f"A {_fmt(rx)} {_fmt(ry)} 0 {large} {sweep_flag} {_fmt(end[0])} {_fmt(end[1])}",
            end,
        )


def _find_child(parent: ET.Element | None, name: str) -> ET.Element | None:
    if parent is None:
        return None
    for child in list(parent):
        if local_name(child.tag) == name:
            return child
    return None


def _children(parent: ET.Element | None, name: str) -> list[ET.Element]:
    if parent is None:
        return []
    return [child for child in list(parent) if local_name(child.tag) == name]


def _iter_guides(parent: ET.Element | None) -> list[ET.Element]:
    return _children(parent, "gd")


def _guide_values(parent: ET.Element | None, ctx: dict[str, float] | None = None) -> dict[str, float]:
    result: dict[str, float] = {}
    eval_ctx = dict(ctx or {})
    for gd in _iter_guides(parent):
        name = gd.get("name")
        if not name:
            continue
        value = _eval_formula(gd.get("fmla"), eval_ctx, [])
        result[name] = value
        eval_ctx[name] = value
    return result


def _definition_size(
    geom: ET.Element,
    source: str,
    width: float | None = None,
    height: float | None = None,
) -> tuple[float, float]:
    if source != "custom":
        if width is not None and height is not None and width > 0 and height > 0:
            return width, height
        return 100.0, 100.0
    path_lst = _find_child(geom, "pathLst")
    if path_lst is None:
        return 100.0, 100.0
    first_path = _find_child(path_lst, "path")
    if first_path is None:
        return 100.0, 100.0
    return (
        _positive_float(first_path.get("w")) or 100.0,
        _positive_float(first_path.get("h")) or 100.0,
    )


def _eval_formula(fmla: str | None, ctx: dict[str, float], diagnostics: list[str]) -> float:
    if not fmla:
        return 0.0
    parts = fmla.split()
    if not parts:
        return 0.0
    op = parts[0]
    args = [_eval_value(part, ctx, diagnostics) for part in parts[1:]]
    try:
        if op == "val":
            return args[0] if args else 0.0
        if op == "+-":
            return args[0] + args[1] - args[2]
        if op == "+/":
            return (args[0] + args[1]) / args[2] if args[2] else 0.0
        if op == "*/":
            return args[0] * args[1] / args[2] if args[2] else 0.0
        if op == "?:":
            return args[1] if args[0] > 0 else args[2]
        if op == "pin":
            return min(max(args[1], args[0]), args[2])
        if op == "abs":
            return abs(args[0])
        if op == "sqrt":
            return math.sqrt(max(0.0, args[0]))
        if op == "max":
            return max(args)
        if op == "min":
            return min(args)
        if op == "sin":
            return args[0] * math.sin(math.radians(args[1] / 60000.0))
        if op == "cos":
            return args[0] * math.cos(math.radians(args[1] / 60000.0))
        if op == "tan":
            return args[0] * math.tan(math.radians(args[1] / 60000.0))
        if op == "at2":
            return math.degrees(math.atan2(args[0], args[1])) * 60000.0
        if op == "cat2":
            return args[0] * math.cos(math.atan2(args[2], args[1]))
        if op == "sat2":
            return args[0] * math.sin(math.atan2(args[2], args[1]))
        if op == "mod":
            return math.sqrt(sum(arg * arg for arg in args))
    except (IndexError, ZeroDivisionError, ValueError):
        diagnostics.append(f"geometry formula failed: {fmla}")
        return 0.0

    diagnostics.append(f"unsupported geometry formula: {fmla}")
    return args[0] if args else 0.0


def _eval_value(value: str | None, ctx: dict[str, float], diagnostics: list[str]) -> float:
    if value is None:
        return 0.0
    try:
        return float(value)
    except (TypeError, ValueError):
        if value in ctx:
            return ctx[value]
        diagnostics.append(f"unknown geometry token: {value}")
        return 0.0


def _base_context(width: float, height: float) -> dict[str, float]:
    ctx = _dimension_context(width, height)
    ctx.update(
        {
            "l": 0.0,
            "t": 0.0,
            "cd2": 10800000.0,
            "cd4": 5400000.0,
            "cd8": 2700000.0,
            "cd16": 1350000.0,
            "3cd4": 16200000.0,
            "3cd8": 8100000.0,
            "5cd8": 13500000.0,
            "7cd8": 18900000.0,
        }
    )
    return ctx


def _dimension_context(width: float, height: float) -> dict[str, float]:
    short = min(width, height)
    long = max(width, height)
    ctx = {
        "w": width,
        "h": height,
        "r": width,
        "b": height,
        "hc": width / 2.0,
        "vc": height / 2.0,
        "ss": short,
        "ls": long,
    }
    for n in (2, 3, 4, 5, 6, 8, 10, 12, 16, 32):
        ctx[f"wd{n}"] = width / n
        ctx[f"hd{n}"] = height / n
        ctx[f"ssd{n}"] = short / n
        ctx[f"lsd{n}"] = long / n
    return ctx


def _positive_float(value: str | None) -> float | None:
    try:
        parsed = float(value) if value is not None else None
    except (TypeError, ValueError):
        return None
    if parsed is None or parsed <= 0:
        return None
    return parsed


def _fmt(value: float) -> str:
    return f"{value:.4f}".rstrip("0").rstrip(".") or "0"


@lru_cache(maxsize=1)
def _preset_definitions() -> dict[str, ET.Element]:
    path = (
        Path(__file__).resolve().parents[1]
        / "OfficeOpenXML-DrawingMLGeometries"
        / "presetShapeDefinitions.xml"
    )
    try:
        root = parse_xml_file(path)
    except (OSError, ET.ParseError, ValueError):
        return {}
    return {local_name(child.tag): child for child in list(root)}


def _preset_definition(name: str) -> ET.Element | None:
    return _preset_definitions().get(name)
