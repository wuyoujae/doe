from doe_export.pipeline.pdf.export_schema_v4_deck_to_pdf import export_schema_v4_deck_to_pdf
from doe_export.service.shared import HTTPStatus, SchemaV4ExportError
from doe_export.pptx.schema.layout_error import SchemaLayoutOverflowError


def _handle_schema_v4_export_pdf(self) -> None:
    try:
        payload = self._read_json()
        deck, assets = payload.get("deck"), payload.get("assets")
        if not isinstance(deck, dict):
            raise ValueError("Expected JSON field 'deck' as an object.")
        if assets is not None and not isinstance(assets, dict):
            raise ValueError("Expected JSON field 'assets' as an object.")
        watermark = payload.get("watermark", False)
        if type(watermark) is not bool:
            raise ValueError("Expected JSON field 'watermark' as a boolean.")
        pdf = export_schema_v4_deck_to_pdf(deck, assets=assets, export_watermark=watermark)
    except SchemaLayoutOverflowError as error:
        self._send_json({"success": False, "code": error.code, "error": str(error), "page": error.page}, HTTPStatus.BAD_REQUEST)
        return
    except (SchemaV4ExportError, ValueError) as error:
        self._send_json({"success": False, "error": str(error)}, HTTPStatus.BAD_REQUEST)
        return
    except Exception as error:
        self._send_internal_error(error)
        return
    self._send_file(pdf, "application/pdf", "yrkie-pdf.pdf")
