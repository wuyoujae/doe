# Origin: pptx2html/ir/builder.py::PresentationBuilder._rasterize_metafile
from __future__ import annotations
from doe_export.ir.importer.shared import Optional, Path, _METAFILE_CACHE, _METAFILE_EXTENSIONS, hashlib, subprocess, tempfile

@staticmethod
def _rasterize_metafile(
    content_type: str,
    blob: bytes,
    membername: Optional[str] = None,
) -> Optional[tuple[str, bytes]]:
    from pptx2html.ir.builder import PresentationBuilder
    suffix = Path(membername or "").suffix.lower()
    cache_key = hashlib.sha256(
        (content_type or "").encode("utf-8")
        + b"\0"
        + suffix.encode("ascii", errors="ignore")
        + b"\0"
        + blob
    ).hexdigest()
    cached = _METAFILE_CACHE.get(cache_key)
    if cached is not None:
        return cached
    if not blob:
        return None

    if not PresentationBuilder._is_windows_runtime():
        if PresentationBuilder._is_emf_image(content_type, membername):
            converted = PresentationBuilder._convert_emf_to_svg(blob)
            if converted is not None:
                _METAFILE_CACHE.put(cache_key, converted)
                return converted
        converted = PresentationBuilder._rasterize_metafile_with_pillow(blob)
        if converted is not None:
            _METAFILE_CACHE.put(cache_key, converted)
            return converted
        return None

    if suffix not in _METAFILE_EXTENSIONS:
        suffix = ".wmf" if "wmf" in (content_type or "").lower() else ".emf"

    script = r"""
param([string]$InPath, [string]$OutPath)
Add-Type -AssemblyName System.Drawing
$metafile = $null
$bitmap = $null
$graphics = $null
try {
  $metafile = [System.Drawing.Imaging.Metafile]::new($InPath)
  $width = [Math]::Max(1, [int][Math]::Round($metafile.Width))
  $height = [Math]::Max(1, [int][Math]::Round($metafile.Height))
  $maxDimension = 4096
  $scale = [Math]::Min(1.0, $maxDimension / [double]([Math]::Max($width, $height)))
  if ($scale -lt 1.0) {
    $width = [Math]::Max(1, [int][Math]::Round($width * $scale))
    $height = [Math]::Max(1, [int][Math]::Round($height * $scale))
  }
  $bitmap = [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.DrawImage($metafile, 0, 0, $width, $height)
  $bitmap.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
  if ($graphics -ne $null) { $graphics.Dispose() }
  if ($bitmap -ne $null) { $bitmap.Dispose() }
  if ($metafile -ne $null) { $metafile.Dispose() }
}
"""
    with tempfile.TemporaryDirectory(prefix="pptx2html-metafile-") as temp_dir:
        temp_path = Path(temp_dir)
        source = temp_path / f"image{suffix}"
        target = temp_path / "image.png"
        script_path = temp_path / "rasterize-metafile.ps1"
        source.write_bytes(blob)
        script_path.write_text(script, encoding="utf-8")
        try:
            subprocess.run(
                [
                    "powershell",
                    "-NoProfile",
                    "-ExecutionPolicy",
                    "Bypass",
                    "-File",
                    str(script_path),
                    str(source),
                    str(target),
                ],
                check=True,
                capture_output=True,
                timeout=30,
            )
        except Exception:
            converted = PresentationBuilder._rasterize_metafile_with_pillow(blob)
            if converted is not None:
                _METAFILE_CACHE.put(cache_key, converted)
                return converted
            return None
        if not target.exists():
            converted = PresentationBuilder._rasterize_metafile_with_pillow(blob)
            if converted is not None:
                _METAFILE_CACHE.put(cache_key, converted)
                return converted
            return None
        converted = ("image/png", target.read_bytes())
        _METAFILE_CACHE.put(cache_key, converted)
        return converted

_rasterize_metafile.__func__.__module__ = 'pptx2html.ir.builder'
_rasterize_metafile.__func__.__qualname__ = 'PresentationBuilder._rasterize_metafile'
