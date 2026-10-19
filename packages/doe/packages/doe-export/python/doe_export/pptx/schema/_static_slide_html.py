# Origin: schema_v4_export.py::_static_slide_html
from __future__ import annotations

def _static_slide_html(stylesheet: str, root_html: str, viewport: tuple[int, int] = (1280, 720)) -> str:
    width, height = viewport
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width={width}, initial-scale=1" />
<style>{stylesheet}</style>
<style>
html,body{{width:{width}px!important;height:{height}px!important;margin:0!important;padding:0!important;overflow:hidden!important;background:transparent!important}}
body>.schema-slide{{width:{width}px!important;height:{height}px!important;margin:0!important;transform:none!important;transform-origin:0 0!important}}
*,*::before,*::after{{animation:none!important;transition:none!important}}
</style>
</head>
<body>{root_html}</body>
</html>"""

_static_slide_html.__module__ = 'schema_v4_export'
