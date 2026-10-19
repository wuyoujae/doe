# Origin: htmlir_server.py::HtmlIrRequestHandler._handle_browser_font_subset
from __future__ import annotations
from doe_export.service.shared import BrowserFontSubsetError
from doe_export.service.shared import HTTPStatus
from doe_export.service.shared import decode_source_font
from doe_export.service.shared import subset_browser_font_isolated

def _handle_browser_font_subset(self) -> None:
    try:
        payload = self._read_json()
        font_data_base64 = payload.get("font_data_base64")
        characters = payload.get("characters")
        face_index = payload.get("face_index", 0)
        if not isinstance(characters, str):
            raise ValueError("characters must be a string.")
        if not isinstance(face_index, int) or isinstance(face_index, bool):
            raise ValueError("face_index must be an integer.")
        result = subset_browser_font_isolated(
            decode_source_font(font_data_base64),
            characters,
            face_index=face_index,
        ).to_dict()
    except BrowserFontSubsetError as error:
        self._send_json(
            {
                "success": False,
                "error": str(error),
                "error_code": error.code,
            },
            HTTPStatus.UNPROCESSABLE_ENTITY,
        )
        return
    except ValueError as error:
        self._send_json(
            {"success": False, "error": str(error)},
            HTTPStatus.BAD_REQUEST,
        )
        return
    except Exception as error:
        self._send_internal_error(error)
        return
    result["success"] = True
    self._send_json(result)

_handle_browser_font_subset.__module__ = 'htmlir_server'
_handle_browser_font_subset.__qualname__ = 'HtmlIrRequestHandler._handle_browser_font_subset'
