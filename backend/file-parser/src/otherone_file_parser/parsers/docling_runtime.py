from __future__ import annotations

import logging
import os
import threading
from collections.abc import Callable
from pathlib import Path
from typing import Any

from otherone_file_parser.api.errors import ErrorCode, ParserError
from otherone_file_parser.config import Settings

logger = logging.getLogger(__name__)


def _configure_torch_cpu_runtime(torch_module: Any) -> None:
    """Bound CPU thread pools and disable NNPACK's large transient workspace."""

    torch_module.set_num_threads(2)
    try:
        torch_module.set_num_interop_threads(1)
    except RuntimeError:
        # PyTorch only permits changing the inter-op pool before parallel work starts.
        logger.warning(
            "torch_interop_threads_already_initialized",
            extra={"event": "torch_interop_threads_already_initialized"},
        )

    nnpack = getattr(getattr(torch_module, "backends", None), "nnpack", None)
    set_nnpack_flags = getattr(nnpack, "set_flags", None)
    if callable(set_nnpack_flags):
        set_nnpack_flags(False)


def _configure_common_pipeline_options(
    converter,
    input_formats,
    option_values: dict[str, object],
    pipeline_options_factory,
) -> None:
    for input_format in input_formats:
        format_option = converter.format_to_options[input_format]
        if not hasattr(format_option, "pipeline_options"):
            raise RuntimeError("Docling format option does not expose pipeline_options")
        pipeline_options = format_option.pipeline_options
        if pipeline_options is None:
            pipeline_options = pipeline_options_factory()
            format_option.pipeline_options = pipeline_options
        for name, value in option_values.items():
            if not hasattr(pipeline_options, name):
                raise RuntimeError(f"Docling pipeline option does not expose {name}")
            setattr(pipeline_options, name, value)


class DoclingRuntime:
    """Owns one converter and bounds all calls into its heavy pipeline."""

    def __init__(
        self,
        settings: Settings,
        *,
        exit_process: Callable[[int], object] = os._exit,
        restart_delay_seconds: float = 1.0,
    ) -> None:
        self._settings = settings
        self._converter: Any | None = None
        self._state_lock = threading.Lock()
        self._convert_slots = threading.BoundedSemaphore(settings.max_concurrency)
        self._exit_process = exit_process
        self._restart_delay_seconds = restart_delay_seconds
        self._restart_lock = threading.Lock()
        self._restart_scheduled = False

    @property
    def ready(self) -> bool:
        return self._converter is not None

    def initialize(self) -> None:
        with self._state_lock:
            if self._converter is not None:
                return
            try:
                self._converter = self._build_converter(self._settings.model_path)
                logger.info("docling_runtime_ready", extra={"event": "docling_runtime_ready"})
            except Exception:
                logger.error(
                    "docling_runtime_initialization_failed",
                    extra={"event": "docling_runtime_initialization_failed"},
                )
                raise

    def _build_converter(self, model_path: Path | None):
        import torch

        _configure_torch_cpu_runtime(torch)

        from docling.datamodel.base_models import InputFormat
        from docling.datamodel.pipeline_options import ConvertPipelineOptions, PdfPipelineOptions
        from docling.document_converter import DocumentConverter, PdfFormatOption

        required_formats = {
            name: getattr(InputFormat, name, None)
            for name in ("PDF", "DOCX", "PPTX", "XLSX", "HTML", "MD", "CSV")
        }
        missing = [name for name, value in required_formats.items() if value is None]
        if missing:
            raise RuntimeError("configured Docling version lacks required input formats")

        pdf_options = PdfPipelineOptions()
        common_option_values = {
            "enable_remote_services": False,
            "allow_external_plugins": False,
            "document_timeout": float(self._settings.timeout_seconds),
        }
        if model_path is not None:
            common_option_values["artifacts_path"] = model_path
        pdf_option_values = {
            **common_option_values,
            "do_ocr": True,
            "do_table_structure": True,
            "generate_page_images": False,
            "generate_picture_images": False,
        }
        for name, value in pdf_option_values.items():
            if hasattr(pdf_options, name):
                setattr(pdf_options, name, value)

        converter = DocumentConverter(
            allowed_formats=list(required_formats.values()),
            format_options={
                required_formats["PDF"]: PdfFormatOption(pipeline_options=pdf_options),
            },
        )
        _configure_common_pipeline_options(
            converter,
            required_formats.values(),
            common_option_values,
            ConvertPipelineOptions,
        )
        for input_format in required_formats.values():
            converter.initialize_pipeline(input_format)
        return converter

    def convert(self, path: Path):
        converter = self._converter
        if converter is None:
            raise ParserError(ErrorCode.PARSER_NOT_READY)

        acquired = self._convert_slots.acquire(timeout=self._settings.busy_timeout_seconds)
        if not acquired:
            raise ParserError(ErrorCode.PARSER_BUSY)
        try:
            return converter.convert(
                path,
                raises_on_error=False,
                max_num_pages=self._settings.max_pages,
                max_file_size=self._settings.max_file_bytes,
            )
        finally:
            self._convert_slots.release()

    def close(self) -> None:
        with self._state_lock:
            self._converter = None

    def schedule_restart_after_timeout(self) -> bool:
        """Exit once the timeout response is flushed so systemd recreates a clean worker.

        Docling's cooperative timeout cannot terminate a native OCR call. Keeping that
        process alive can permanently occupy the only converter slot and retain several
        GiB of memory, so a timed-out stateless worker must be replaced.
        """

        with self._restart_lock:
            if self._restart_scheduled:
                return False
            self._restart_scheduled = True

        logger.critical(
            "docling_runtime_restart_scheduled",
            extra={
                "event": "docling_runtime_restart_scheduled",
                "delay_seconds": self._restart_delay_seconds,
            },
        )
        timer = threading.Timer(
            self._restart_delay_seconds,
            self._exit_after_timeout,
        )
        timer.daemon = True
        timer.start()
        return True

    def _exit_after_timeout(self) -> None:
        logger.critical(
            "docling_runtime_exiting_after_timeout",
            extra={"event": "docling_runtime_exiting_after_timeout"},
        )
        self._exit_process(70)
