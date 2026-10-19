# Origin: pptx2html/htmlir/compiler.py::_BrowserSnapshotWorker
from __future__ import annotations
from doe_export.html.compiler.shared import BROWSER_WORKER_MAX_REQUESTS, BROWSER_WORKER_MAX_RSS_BYTES, Path, __file__, deque, json, os, queue, signal, subprocess, threading
from doe_export.html.compiler.diagnostics.HtmlCompileError import HtmlCompileError
from doe_export.html.compiler.diagnostics.HtmlDiagnostic import HtmlDiagnostic
from doe_export.html.compiler.browser._browser_worker_environment import _browser_worker_environment
from doe_export.html.compiler.browser._linux_process_tree_rss_bytes import _linux_process_tree_rss_bytes
from doe_export.html.compiler.browser._signal_process_group import _signal_process_group
from doe_export.html.compiler.browser._terminate_process_tree import _terminate_process_tree

class _BrowserSnapshotWorker:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._process: subprocess.Popen[str] | None = None
        self._responses: queue.Queue[str | None] | None = None
        self._stderr: deque[str] = deque(maxlen=20)
        self._request_id = 0
        self._completed_requests = 0

    def invoke(
        self,
        *,
        node: str,
        script: Path,
        payload: dict[str, Any],
        timeout_seconds: float,
    ) -> dict[str, Any]:
        with self._lock:
            for attempt in range(2):
                if self._recycle_reason() is not None:
                    self._stop(graceful=True)
                process, responses = self._ensure_process(node, script)
                self._request_id += 1
                request_id = self._request_id
                try:
                    if process.stdin is None:
                        raise BrokenPipeError("Browser worker stdin is unavailable.")
                    process.stdin.write(
                        json.dumps(
                            {"request_id": request_id, "payload": payload},
                            ensure_ascii=False,
                            separators=(",", ":"),
                        )
                        + "\n"
                    )
                    process.stdin.flush()
                    line = responses.get(timeout=timeout_seconds)
                    if line is None:
                        raise BrokenPipeError("Browser worker stopped before returning a response.")
                    envelope = json.loads(line)
                    if envelope.get("request_id") != request_id:
                        raise ValueError("Browser worker returned a mismatched request id.")
                    result = envelope.get("result")
                    if not isinstance(result, dict):
                        raise ValueError("Browser worker returned an invalid result.")
                    if not result.get("success"):
                        message = result.get("error") or "html browser snapshot failed"
                        if attempt == 0 and result.get("error_kind") != "content":
                            self._stop()
                            continue
                        raise HtmlCompileError(
                            "html browser snapshot failed",
                            [HtmlDiagnostic("error", "snapshot-failed", str(message))],
                        )
                    self._completed_requests += 1
                    if self._recycle_reason() is not None:
                        self._stop(graceful=True)
                    return result
                except queue.Empty as exc:
                    self._stop()
                    raise HtmlCompileError(
                        "html browser snapshot timed out",
                        [
                            HtmlDiagnostic(
                                "error",
                                "snapshot-timeout",
                                f"Chromium snapshot timed out after {timeout_seconds:g}s.",
                            )
                        ],
                    ) from exc
                except HtmlCompileError:
                    raise
                except (BrokenPipeError, OSError, ValueError, json.JSONDecodeError) as exc:
                    self._stop()
                    if attempt == 0:
                        continue
                    stderr = "\n".join(self._stderr).strip()
                    diagnostics = [HtmlDiagnostic("error", "snapshot-worker", str(exc))]
                    if stderr:
                        diagnostics.append(HtmlDiagnostic("error", "snapshot-stderr", stderr[:1000]))
                    raise HtmlCompileError("html browser snapshot failed", diagnostics) from exc
            raise HtmlCompileError(
                "html browser snapshot failed",
                [HtmlDiagnostic("error", "snapshot-worker", "Browser worker could not be started.")],
            )

    def close(self) -> None:
        with self._lock:
            self._stop(graceful=True)

    def _ensure_process(
        self,
        node: str,
        script: Path,
    ) -> tuple[subprocess.Popen[str], queue.Queue[str | None]]:
        if self._process is not None and self._process.poll() is None and self._responses is not None:
            return self._process, self._responses

        self._stop()
        self._stderr.clear()
        creationflags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
        process = subprocess.Popen(
            [node, str(script), "--worker"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            bufsize=1,
            cwd=str(Path(__file__).resolve().parent.parent),
            creationflags=creationflags,
            start_new_session=os.name != "nt",
            env=_browser_worker_environment(),
        )
        responses: queue.Queue[str | None] = queue.Queue()
        threading.Thread(
            target=self._read_stdout,
            args=(process, responses),
            name="htmlir-browser-stdout",
            daemon=True,
        ).start()
        threading.Thread(
            target=self._read_stderr,
            args=(process,),
            name="htmlir-browser-stderr",
            daemon=True,
        ).start()
        self._process = process
        self._responses = responses
        return process, responses

    @staticmethod
    def _read_stdout(process: subprocess.Popen[str], responses: queue.Queue[str | None]) -> None:
        if process.stdout is not None:
            for line in process.stdout:
                responses.put(line.strip())
        responses.put(None)

    def _read_stderr(self, process: subprocess.Popen[str]) -> None:
        if process.stderr is not None:
            for line in process.stderr:
                self._stderr.append(line.rstrip())

    def _recycle_reason(self) -> str | None:
        process = self._process
        if process is None or process.poll() is not None:
            return None
        if self._completed_requests >= BROWSER_WORKER_MAX_REQUESTS:
            return "request-limit"
        process_tree_rss = _linux_process_tree_rss_bytes(process.pid)
        if (
            process_tree_rss is not None
            and process_tree_rss >= BROWSER_WORKER_MAX_RSS_BYTES
        ):
            return "rss-limit"
        return None

    def _stop(self, *, graceful: bool = False) -> None:
        process = self._process
        self._process = None
        self._responses = None
        self._completed_requests = 0
        if process is None:
            return
        if process.poll() is None and graceful and process.stdin is not None:
            try:
                process.stdin.close()
                process.wait(timeout=3)
            except (OSError, subprocess.TimeoutExpired):
                pass
        if process.poll() is None:
            _terminate_process_tree(process, signal.SIGTERM)
            try:
                process.wait(timeout=2)
            except subprocess.TimeoutExpired:
                _terminate_process_tree(process, getattr(signal, "SIGKILL", signal.SIGTERM))
                process.wait(timeout=2)
        elif os.name != "nt":
            _signal_process_group(process.pid, signal.SIGTERM)
        for stream in (process.stdin, process.stdout, process.stderr):
            if stream is not None and not stream.closed:
                try:
                    stream.close()
                except OSError:
                    pass

_BrowserSnapshotWorker.__module__ = 'pptx2html.htmlir.compiler'
