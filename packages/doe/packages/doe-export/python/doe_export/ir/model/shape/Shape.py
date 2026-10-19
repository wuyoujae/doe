from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity
from doe_export.ir.model.paint.Border import Border
from doe_export.ir.model.geometry.Bounds import Bounds
from doe_export.ir.model.chart.ChartInfo import ChartInfo
from doe_export.ir.model.paint.Fill import Fill
from doe_export.ir.model.media.FormulaInfo import FormulaInfo
from doe_export.ir.model.geometry.GeometryPath import GeometryPath
from doe_export.ir.model.geometry.GeometryRect import GeometryRect
from doe_export.ir.model.media.IconInfo import IconInfo
from doe_export.ir.model.media.ImageInfo import ImageInfo
from doe_export.ir.model.media.PlaceholderInfo import PlaceholderInfo
from doe_export.ir.model.paint.Shadow import Shadow
from doe_export.ir.model.table.TableInfo import TableInfo
from doe_export.ir.model.text.TextFrame import TextFrame
from doe_export.ir.model.paint.ThreeDInfo import ThreeDInfo

@dataclass
@preserve_identity
class Shape:
    """A single shape on a slide."""

    type: str = "auto_shape"
    """Shape type: ``"auto_shape"``, ``"picture"``, ``"connector"``,
    ``"group_shape"``, ``"graphic_frame"``."""

    name: Optional[str] = None
    shape_id: Optional[int] = None
    """OOXML ``p:cNvPr@id`` used by slide timing targets."""

    hidden: bool = False
    source_scope: Optional[str] = None
    """OOXML owner: ``slide``, ``layout``, or ``master``.

    Layout/master shapes render in normal slide view but are not directly
    editable there, matching PowerPoint's editing contract.
    """

    # Position & geometry
    bounds: Optional[Bounds] = None
    rotation: Optional[float] = None
    """Rotation degrees clockwise."""

    flip_horizontal: bool = False
    flip_vertical: bool = False

    geometry: Optional[str] = None
    """Preset geometry name e.g. ``"rect"``, ``"ellipse"``, ``"roundRect"``."""

    geometry_source: Optional[str] = None
    """Geometry source: ``"preset"``, ``"custom"``, or ``"connector"``."""

    geometry_adjustments: dict[str, float] = field(default_factory=dict)
    geometry_paths: list[GeometryPath] = field(default_factory=list)
    text_rect: Optional[GeometryRect] = None

    # Visuals
    fill: Optional[Fill] = None
    border: Optional[Border] = None
    shadow: Optional[Shadow] = None
    effects: list[Shadow] = field(default_factory=list)
    three_d: Optional[ThreeDInfo] = None

    # Text
    text: Optional[TextFrame] = None

    # Placeholder
    placeholder: Optional[PlaceholderInfo] = None

    # Picture
    image: Optional[ImageInfo] = None

    # Group
    shapes: Optional[list[Shape]] = None
    group_bounds: Optional[Bounds] = None
    """Child coordinate space for groups."""

    # Connector
    connector_type: Optional[str] = None

    # GraphicFrame
    table: Optional[TableInfo] = None
    chart: Optional[ChartInfo] = None
    has_chart: bool = False
    chart_r_id: Optional[str] = None
    graphic_uri: Optional[str] = None
    formula: Optional[FormulaInfo] = None
    icon: Optional[IconInfo] = None

    diagnostics: list[str] = field(default_factory=list)
