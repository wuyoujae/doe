from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class ErrorCode(StrEnum):
    INVALID_REQUEST = "INVALID_REQUEST"
    UNAUTHORIZED = "UNAUTHORIZED"
    FILE_TOO_LARGE = "FILE_TOO_LARGE"
    UNSUPPORTED_TYPE = "UNSUPPORTED_TYPE"
    TYPE_MISMATCH = "TYPE_MISMATCH"
    EMPTY_FILE = "EMPTY_FILE"
    CORRUPT_DOCUMENT = "CORRUPT_DOCUMENT"
    PASSWORD_PROTECTED = "PASSWORD_PROTECTED"
    EMPTY_CONTENT = "EMPTY_CONTENT"
    TOO_MANY_PAGES = "TOO_MANY_PAGES"
    CONTENT_TOO_LARGE = "CONTENT_TOO_LARGE"
    PARSER_BUSY = "PARSER_BUSY"
    NOT_IMPLEMENTED = "NOT_IMPLEMENTED"
    PARSER_NOT_READY = "PARSER_NOT_READY"
    PARSER_UNAVAILABLE = "PARSER_UNAVAILABLE"
    PARSER_TIMEOUT = "PARSER_TIMEOUT"
    PARSER_FAILED = "PARSER_FAILED"


@dataclass(frozen=True, slots=True)
class ErrorSpec:
    status_code: int
    message: str
    retryable: bool


ERROR_SPECS: dict[ErrorCode, ErrorSpec] = {
    ErrorCode.INVALID_REQUEST: ErrorSpec(400, "上传请求无效", False),
    ErrorCode.UNAUTHORIZED: ErrorSpec(401, "解析服务鉴权失败", False),
    ErrorCode.FILE_TOO_LARGE: ErrorSpec(413, "文档超过允许的大小", False),
    ErrorCode.UNSUPPORTED_TYPE: ErrorSpec(415, "暂不支持这种文档格式", False),
    ErrorCode.TYPE_MISMATCH: ErrorSpec(415, "文件内容与扩展名或类型不匹配", False),
    ErrorCode.EMPTY_FILE: ErrorSpec(422, "文档内容为空", False),
    ErrorCode.CORRUPT_DOCUMENT: ErrorSpec(422, "文档已损坏或结构无效", False),
    ErrorCode.PASSWORD_PROTECTED: ErrorSpec(422, "文档受密码保护，暂时无法解析", False),
    ErrorCode.EMPTY_CONTENT: ErrorSpec(422, "文档中没有识别到可解析的正文", False),
    ErrorCode.TOO_MANY_PAGES: ErrorSpec(422, "文档页数超过允许上限", False),
    ErrorCode.CONTENT_TOO_LARGE: ErrorSpec(422, "解析出的正文超过允许上限", False),
    ErrorCode.PARSER_BUSY: ErrorSpec(429, "解析服务繁忙，请稍后重试", True),
    ErrorCode.NOT_IMPLEMENTED: ErrorSpec(501, "这种附件的解析能力尚未实现", False),
    ErrorCode.PARSER_NOT_READY: ErrorSpec(503, "解析服务尚未就绪", True),
    ErrorCode.PARSER_UNAVAILABLE: ErrorSpec(503, "解析服务当前不可用", True),
    ErrorCode.PARSER_TIMEOUT: ErrorSpec(504, "文档解析超时，请重试或拆分文档", True),
    ErrorCode.PARSER_FAILED: ErrorSpec(500, "文档解析失败", True),
}


class ParserError(Exception):
    def __init__(
        self,
        code: ErrorCode,
        *,
        message: str | None = None,
        retryable: bool | None = None,
        request_id: str | None = None,
    ) -> None:
        spec = ERROR_SPECS[code]
        super().__init__(message or spec.message)
        self.code = code
        self.message = message or spec.message
        self.status_code = spec.status_code
        self.retryable = spec.retryable if retryable is None else retryable
        self.request_id = request_id
