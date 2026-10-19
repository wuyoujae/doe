"""Constant values for the Open Packaging Convention and Office Open XML.

Includes namespaces, content (MIME) types, relationship types, and target modes.
"""


class NAMESPACE:
    """OPC and Office XML namespace URIs."""

    OPC_CONTENT_TYPES = "http://schemas.openxmlformats.org/package/2006/content-types"
    OPC_RELATIONSHIPS = "http://schemas.openxmlformats.org/package/2006/relationships"
    OPC_CORE_PROPERTIES = (
        "http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
    )
    OFC_RELATIONSHIPS = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    )
    DML_MAIN = "http://schemas.openxmlformats.org/drawingml/2006/main"
    DML_CHART = "http://schemas.openxmlformats.org/drawingml/2006/chart"
    DML_DIAGRAM = "http://schemas.openxmlformats.org/drawingml/2006/diagram"
    DML_DIAGRAM_DRAWING = "http://schemas.microsoft.com/office/drawing/2008/diagram"
    PML_MAIN = "http://schemas.openxmlformats.org/presentationml/2006/main"
    WML_MAIN = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"


class TARGET_MODE:
    """Relationship target mode constants."""

    INTERNAL = "Internal"
    EXTERNAL = "External"


class RELATIONSHIP_TYPE:
    """Relationship type URIs used in .rels files."""

    OFFICE_DOCUMENT = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    )
    SLIDE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide"
    SLIDE_LAYOUT = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout"
    )
    SLIDE_MASTER = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster"
    )
    NOTES_SLIDE = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide"
    )
    NOTES_MASTER = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster"
    )
    HANDOUT_MASTER = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/handoutMaster"
    )
    THEME = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme"
    THEME_OVERRIDE = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/themeOverride"
    )
    IMAGE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"
    HYPERLINK = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink"
    )
    CHART = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart"
    CHART_USER_SHAPES = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chartUserShapes"
    )
    DIAGRAM_DATA = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/diagramData"
    )
    DIAGRAM_DRAWING = (
        "http://schemas.microsoft.com/office/2007/relationships/diagramDrawing"
    )
    DIAGRAM_LAYOUT = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/diagramLayout"
    )
    DIAGRAM_QUICK_STYLE = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/diagramQuickStyle"
    )
    DIAGRAM_COLORS = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/diagramColors"
    )
    TABLE_STYLES = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableStyles"
    )
    PRES_PROPS = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/presProps"
    )
    VIEW_PROPS = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/viewProps"
    )
    CORE_PROPERTIES = (
        "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties"
    )
    EXTENDED_PROPERTIES = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties"
    )
    CUSTOM_PROPERTIES = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties"
    )
    COMMENTS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments"
    COMMENT_AUTHORS = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/commentAuthors"
    )
    TAGS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/tags"
    SLIDE_UPDATE_INFO = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideUpdateInfo"
    )
    CONTROL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/control"
    MEDIA = "http://schemas.microsoft.com/office/2007/relationships/media"
    AUDIO = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/audio"
    VIDEO = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/video"
    OLE_OBJECT = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/oleObject"
    )
    PACKAGE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/package"
    DRAWING = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing"
    VML_DRAWING = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/vmlDrawing"
    )
    THUMBNAIL = "http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail"


class CONTENT_TYPE:
    """Content type (MIME) strings for OPC parts."""

    # OPC core
    OPC_RELATIONSHIPS = "application/vnd.openxmlformats-package.relationships+xml"
    OPC_CORE_PROPERTIES = "application/vnd.openxmlformats-package.core-properties+xml"

    # PresentationML
    PML_PRESENTATION_MAIN = (
        "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"
    )
    PML_SLIDE = "application/vnd.openxmlformats-officedocument.presentationml.slide+xml"
    PML_SLIDE_LAYOUT = (
        "application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"
    )
    PML_SLIDE_MASTER = (
        "application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"
    )
    PML_NOTES_SLIDE = "application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"
    PML_NOTES_MASTER = (
        "application/vnd.openxmlformats-officedocument.presentationml.notesMaster+xml"
    )
    PML_HANDOUT_MASTER = (
        "application/vnd.openxmlformats-officedocument.presentationml.handoutMaster+xml"
    )
    PML_PRES_PROPS = (
        "application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"
    )
    PML_VIEW_PROPS = (
        "application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"
    )
    PML_TABLE_STYLES = (
        "application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"
    )
    PML_COMMENTS = (
        "application/vnd.openxmlformats-officedocument.presentationml.comments+xml"
    )
    PML_COMMENT_AUTHORS = (
        "application/vnd.openxmlformats-officedocument.presentationml.commentAuthors+xml"
    )
    PML_TAGS = "application/vnd.openxmlformats-officedocument.presentationml.tags+xml"
    PML_SLIDE_UPDATE_INFO = (
        "application/vnd.openxmlformats-officedocument.presentationml.slideUpdateInfo+xml"
    )
    PML_PRINTER_SETTINGS = (
        "application/vnd.openxmlformats-officedocument.presentationml.printerSettings"
    )

    # DrawingML
    DML_CHART = "application/vnd.openxmlformats-officedocument.drawingml.chart+xml"
    DML_CHARTSHAPES = (
        "application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml"
    )
    DML_DIAGRAM_DATA = (
        "application/vnd.openxmlformats-officedocument.drawingml.diagramData+xml"
    )
    DML_DIAGRAM_LAYOUT = (
        "application/vnd.openxmlformats-officedocument.drawingml.diagramLayout+xml"
    )
    DML_DIAGRAM_STYLE = (
        "application/vnd.openxmlformats-officedocument.drawingml.diagramStyle+xml"
    )
    DML_DIAGRAM_COLORS = (
        "application/vnd.openxmlformats-officedocument.drawingml.diagramColors+xml"
    )
    OFC_THEME = "application/vnd.openxmlformats-officedocument.theme+xml"
    OFC_THEME_OVERRIDE = (
        "application/vnd.openxmlformats-officedocument.themeOverride+xml"
    )
    OFC_DRAWING = "application/vnd.openxmlformats-officedocument.drawing+xml"
    OFC_VML_DRAWING = "application/vnd.openxmlformats-officedocument.vmlDrawing"

    # Extended/custom properties
    OFC_EXTENDED_PROPERTIES = (
        "application/vnd.openxmlformats-officedocument.extended-properties+xml"
    )
    OFC_CUSTOM_PROPERTIES = (
        "application/vnd.openxmlformats-officedocument.custom-properties+xml"
    )

    # Image types
    PNG = "image/png"
    JPEG = "image/jpeg"
    GIF = "image/gif"
    BMP = "image/bmp"
    TIFF = "image/tiff"
    X_WMF = "image/x-wmf"
    X_EMF = "image/x-emf"
    SVG = "image/svg+xml"

    # Media types
    ASF = "video/x-ms-asf"
    AVI = "video/avi"
    MPG = "video/mpeg"
    MP4 = "video/mp4"
    MOV = "video/quicktime"
    WMV = "video/x-ms-wmv"
    SWF = "application/x-shockwave-flash"

    # XML
    XML = "application/xml"

    # OLE
    OFC_OLE_OBJECT = "application/vnd.openxmlformats-officedocument.oleObject"

    # Control
    OFC_CONTROL = "application/vnd.openxmlformats-officedocument.activeX+xml"


# Default mapping from file extension to content type (for <Default> elements)
EXTENSION_TO_CONTENT_TYPE = {
    "xml": CONTENT_TYPE.XML,
    "png": CONTENT_TYPE.PNG,
    "jpg": CONTENT_TYPE.JPEG,
    "jpeg": CONTENT_TYPE.JPEG,
    "gif": CONTENT_TYPE.GIF,
    "bmp": CONTENT_TYPE.BMP,
    "tiff": CONTENT_TYPE.TIFF,
    "tif": CONTENT_TYPE.TIFF,
    "wmf": CONTENT_TYPE.X_WMF,
    "emf": CONTENT_TYPE.X_EMF,
    "svg": CONTENT_TYPE.SVG,
    "mp3": "audio/mpeg",
    "mp4": CONTENT_TYPE.MP4,
    "wav": "audio/wav",
    "wmv": CONTENT_TYPE.WMV,
    "avi": CONTENT_TYPE.AVI,
    "mov": CONTENT_TYPE.MOV,
    "asf": CONTENT_TYPE.ASF,
    "swf": CONTENT_TYPE.SWF,
    "rels": CONTENT_TYPE.OPC_RELATIONSHIPS,
}
