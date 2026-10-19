"""The only public domain failure accepted from the browser renderer."""
from .shared import SchemaV4ExportError


class SchemaLayoutOverflowError(SchemaV4ExportError):
    code = "doe_export_layout_overflow"

    def __init__(self, page: int):
        super().__init__("The slide content exceeds the available space.")
        self.page = page


def layout_failure(result, total):
    if not isinstance(result, dict) or result.get("success") is not False:
        return None
    error = result.get("error")
    if not isinstance(error, dict) or error.get("code") != SchemaLayoutOverflowError.code:
        return None
    page = error.get("page")
    if type(page) is not int or not 1 <= page <= total:
        return None
    return SchemaLayoutOverflowError(page)
