from __future__ import annotations

from starlette.types import ASGIApp, Message, Receive, Scope, Send


class RequestBodyTooLarge(Exception):
    """Raised before a streamed HTTP request body can exceed its configured limit."""


class RequestBodyLimitMiddleware:
    def __init__(self, app: ASGIApp, *, max_bytes: int, path: str) -> None:
        self._app = app
        self._max_bytes = max_bytes
        self._path = path

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if (
            scope["type"] != "http"
            or scope.get("method") != "POST"
            or scope.get("path") != self._path
        ):
            await self._app(scope, receive, send)
            return

        received_bytes = 0

        async def receive_limited() -> Message:
            nonlocal received_bytes
            message = await receive()
            if message["type"] == "http.request":
                received_bytes += len(message.get("body", b""))
                if received_bytes > self._max_bytes:
                    raise RequestBodyTooLarge
            return message

        await self._app(scope, receive_limited, send)
