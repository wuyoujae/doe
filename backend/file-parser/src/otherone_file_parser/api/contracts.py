from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ParsedDocumentData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: Literal["document"] = "document"
    original_name: str
    detected_type: str
    mime_type: str
    size_bytes: int = Field(ge=1)
    sha256: str = Field(min_length=64, max_length=64)
    markdown: str = Field(min_length=1)
    content_chars: int = Field(ge=1)
    estimated_tokens: int = Field(ge=1)
    warnings: list[str]
    duration_ms: int = Field(ge=0)


class ParseSuccessResponse(BaseModel):
    status: Literal["success"] = "success"
    data: ParsedDocumentData


class ParseErrorDetail(BaseModel):
    code: str
    message: str
    retryable: bool
    request_id: str


class ParseErrorResponse(BaseModel):
    status: Literal["error"] = "error"
    error: ParseErrorDetail
