# Origin: pptx2html/htmlir/compiler.py::_svg_path_to_normalized_d
from __future__ import annotations
from doe_export.html.compiler.shared import _SVG_PATH_TOKEN_RE
from doe_export.html.compiler.svg._svg_arc_to_cubic_segments import _svg_arc_to_cubic_segments
from doe_export.html.compiler.svg._svg_point import _svg_point

def _svg_path_to_normalized_d(raw_d: str, view_box: tuple[float, float, float, float]) -> str | None:
    tokens = _SVG_PATH_TOKEN_RE.findall(raw_d or "")
    if not tokens:
        return None
    index = 0
    command: str | None = None
    output: list[str] = []
    current = (0.0, 0.0)
    subpath_start = (0.0, 0.0)
    last_cubic_control: tuple[float, float] | None = None
    last_quad_control: tuple[float, float] | None = None

    def is_command(token: str) -> bool:
        return len(token) == 1 and token.isalpha()

    def has_number() -> bool:
        return index < len(tokens) and not is_command(tokens[index])

    def read_number() -> float:
        nonlocal index
        if index >= len(tokens) or is_command(tokens[index]):
            raise ValueError("expected SVG path number")
        try:
            value = float(tokens[index])
        except ValueError:
            raise ValueError("invalid SVG path number")
        index += 1
        return value

    def read_flag() -> float:
        nonlocal index
        if index >= len(tokens) or is_command(tokens[index]):
            raise ValueError("expected SVG arc flag")
        token = tokens[index]
        # SVG permits the two arc flags, and even the following coordinate,
        # to be written without separators.  Lucide's Zap path contains
        # ``... 0 005.5 14 ...`` (sweep-flag=0, x=5.5).  The tokenizer quite
        # correctly keeps ``005.5`` as one numeric token, so consume exactly
        # one leading flag digit and leave the coordinate for the next read.
        if len(token) > 1 and token[0] in {"0", "1"}:
            value = float(token[0])
            tokens[index] = token[1:]
            return value
        value = read_number()
        if value not in {0.0, 1.0}:
            raise ValueError("invalid SVG arc flag")
        return value

    def point(x: float, y: float, relative: bool) -> tuple[float, float]:
        return (current[0] + x, current[1] + y) if relative else (x, y)

    def emit_point(value: tuple[float, float]) -> str:
        return _svg_point(value, view_box)

    try:
        while index < len(tokens):
            if is_command(tokens[index]):
                command = tokens[index]
                index += 1
            if command is None:
                return None
            lower = command.lower()
            relative = command.islower()
            if lower == "z":
                output.append("Z")
                current = subpath_start
                last_cubic_control = None
                last_quad_control = None
                command = None
                continue
            first_segment = True
            while has_number():
                if lower == "m":
                    target = point(read_number(), read_number(), relative)
                    output.append(("M" if first_segment else "L") + f" {emit_point(target)}")
                    current = target
                    if first_segment:
                        subpath_start = target
                    first_segment = False
                    last_cubic_control = None
                    last_quad_control = None
                    command = "l" if relative else "L"
                    lower = "l"
                    relative = command.islower()
                elif lower == "l":
                    target = point(read_number(), read_number(), relative)
                    output.append(f"L {emit_point(target)}")
                    current = target
                    last_cubic_control = None
                    last_quad_control = None
                elif lower == "h":
                    value = read_number()
                    target = (current[0] + value, current[1]) if relative else (value, current[1])
                    output.append(f"L {emit_point(target)}")
                    current = target
                    last_cubic_control = None
                    last_quad_control = None
                elif lower == "v":
                    value = read_number()
                    target = (current[0], current[1] + value) if relative else (current[0], value)
                    output.append(f"L {emit_point(target)}")
                    current = target
                    last_cubic_control = None
                    last_quad_control = None
                elif lower == "c":
                    c1 = point(read_number(), read_number(), relative)
                    c2 = point(read_number(), read_number(), relative)
                    target = point(read_number(), read_number(), relative)
                    output.append(f"C {emit_point(c1)} {emit_point(c2)} {emit_point(target)}")
                    current = target
                    last_cubic_control = c2
                    last_quad_control = None
                elif lower == "s":
                    c1 = (
                        (2 * current[0] - last_cubic_control[0], 2 * current[1] - last_cubic_control[1])
                        if last_cubic_control is not None
                        else current
                    )
                    c2 = point(read_number(), read_number(), relative)
                    target = point(read_number(), read_number(), relative)
                    output.append(f"C {emit_point(c1)} {emit_point(c2)} {emit_point(target)}")
                    current = target
                    last_cubic_control = c2
                    last_quad_control = None
                elif lower == "q":
                    c1 = point(read_number(), read_number(), relative)
                    target = point(read_number(), read_number(), relative)
                    output.append(f"Q {emit_point(c1)} {emit_point(target)}")
                    current = target
                    last_quad_control = c1
                    last_cubic_control = None
                elif lower == "t":
                    c1 = (
                        (2 * current[0] - last_quad_control[0], 2 * current[1] - last_quad_control[1])
                        if last_quad_control is not None
                        else current
                    )
                    target = point(read_number(), read_number(), relative)
                    output.append(f"Q {emit_point(c1)} {emit_point(target)}")
                    current = target
                    last_quad_control = c1
                    last_cubic_control = None
                elif lower == "a":
                    rx = abs(read_number())
                    ry = abs(read_number())
                    angle = read_number()
                    large_arc = bool(int(read_flag()))
                    sweep = bool(int(read_flag()))
                    target = point(read_number(), read_number(), relative)
                    cubics = _svg_arc_to_cubic_segments(current, target, rx, ry, angle, large_arc, sweep)
                    if cubics:
                        for c1, c2, end in cubics:
                            output.append(f"C {emit_point(c1)} {emit_point(c2)} {emit_point(end)}")
                    else:
                        output.append(f"L {emit_point(target)}")
                    current = target
                    last_cubic_control = cubics[-1][1] if cubics else None
                    last_quad_control = None
                else:
                    return None
                if index < len(tokens) and is_command(tokens[index]):
                    break
    except (ValueError, OverflowError):
        return None
    return " ".join(output) if output else None

_svg_path_to_normalized_d.__module__ = 'pptx2html.htmlir.compiler'
