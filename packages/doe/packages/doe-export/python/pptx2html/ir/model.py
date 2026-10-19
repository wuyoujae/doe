"""IR (Intermediate Representation) model — pure data classes.

All measurements are in **points (pt)** unless otherwise noted.
EMU values from POM are converted via ``emu / 12700``.

Every IR object can be serialized to JSON via ``dataclasses.asdict()``.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


# ======================================================================
# Text
# ======================================================================


from doe_export.ir.model.text.TabStop import TabStop


from doe_export.ir.model.text.BulletInfo import BulletInfo


from doe_export.ir.model.text.Font import Font


from doe_export.ir.model.text.Run import Run


from doe_export.ir.model.text.TextLayoutSoftBreak import TextLayoutSoftBreak


from doe_export.ir.model.text.TextLayoutSnapshot import TextLayoutSnapshot


from doe_export.ir.model.text.EmbeddedFont import EmbeddedFont


from doe_export.ir.model.text.Paragraph import Paragraph


from doe_export.ir.model.text.TextFrame import TextFrame


# ======================================================================
# Fill / Border / Effects
# ======================================================================


from doe_export.ir.model.paint.GradientStop import GradientStop


from doe_export.ir.model.paint.Fill import Fill


from doe_export.ir.model.paint.Border import Border


from doe_export.ir.model.paint.Shadow import Shadow

    # FIXME: outerShdw / innerShdw full properties — see FIXME.md


from doe_export.ir.model.paint.ThreeDInfo import ThreeDInfo


# ======================================================================
# Geometry / Image / Placeholder / Table
# ======================================================================


from doe_export.ir.model.geometry.Bounds import Bounds


from doe_export.ir.model.media.ImageInfo import ImageInfo


from doe_export.ir.model.media.PlaceholderInfo import PlaceholderInfo


from doe_export.ir.model.table.TableCell import TableCell


from doe_export.ir.model.table.TableInfo import TableInfo


from doe_export.ir.model.chart.ChartSeries import ChartSeries


from doe_export.ir.model.chart.ChartInfo import ChartInfo


from doe_export.ir.model.media.FormulaInfo import FormulaInfo


from doe_export.ir.model.media.IconInfo import IconInfo


from doe_export.ir.model.geometry.GeometryRect import GeometryRect


from doe_export.ir.model.geometry.GeometryPath import GeometryPath


# ======================================================================
# Shape
# ======================================================================


from doe_export.ir.model.shape.Shape import Shape


# ======================================================================
# Slide / Presentation
# ======================================================================


from doe_export.ir.model.paint.Background import Background
    # FIXME: image background, gradient — see FIXME.md


from doe_export.ir.model.motion.SlideTransition import SlideTransition


from doe_export.ir.model.motion.AnimationStep import AnimationStep


from doe_export.ir.model.document.Slide import Slide

    # FIXME: layout/master references for inheritance — see FIXME.md


from doe_export.ir.model.document.Presentation import Presentation
