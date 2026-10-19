from __future__ import annotations
import select
import socket
from http import HTTPStatus
from doe_export.pptx.schema.inspect_schema_v4_slide import inspect_schema_v4_slide, SlideInspectionError


def _handle_schema_v4_inspect_slide(self) -> None:
    def disconnected() -> bool:
        try:
            readable, _, _ = select.select([self.connection], [], [], 0)
            return bool(readable) and self.connection.recv(1, socket.MSG_PEEK) == b""
        except OSError:
            return True
    try:
        payload = self._read_json()
        if set(payload) - {"deck", "assets", "page_number", "total_slides"}:
            raise SlideInspectionError("doe_preview_invalid_request")
        result = inspect_schema_v4_slide(payload.get("deck"), assets=payload.get("assets"),
            page_number=payload.get("page_number"), total_slides=payload.get("total_slides"), cancelled=disconnected)
    except SlideInspectionError as error:
        if not disconnected():
            self._send_json({"success": False, "code": error.code}, HTTPStatus.BAD_REQUEST)
        return
    except (ValueError, TypeError):
        self._send_json({"success": False, "code": "doe_preview_invalid_request"}, HTTPStatus.BAD_REQUEST)
        return
    except Exception as error:
        self._send_internal_error(error)
        return
    if not disconnected():
        self._send_json(result)
