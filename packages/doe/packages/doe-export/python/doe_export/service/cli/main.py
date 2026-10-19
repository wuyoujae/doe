# Origin: htmlir_server.py::main
from __future__ import annotations
from doe_export.service.shared import ALLOWED_HOSTS_ENV, Path, argparse, export_ir_to_pptx, html_to_pptx, json, os
from doe_export.service.access._allowed_hosts import _allowed_hosts
from doe_export.service.access._runtime_token_from_environment import _runtime_token_from_environment
from doe_export.service.cli.run_check import run_check
from doe_export.service.cli.run_server import run_server

def main() -> None:
    parser = argparse.ArgumentParser(description="yrkie HTML to PresentationIR runtime")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8768)
    parser.add_argument("--allowed-host", action="append", default=[])
    parser.add_argument("--max-concurrency", type=int, default=4)
    parser.add_argument("--check-html", type=Path)
    parser.add_argument("--html-to-pptx", type=Path)
    parser.add_argument("--ir-to-pptx", type=Path)
    parser.add_argument("--out", type=Path)
    parser.add_argument("--render-mode", default="semantic", choices=["semantic", "snapshot"])
    args = parser.parse_args()

    if args.check_html:
        run_check(args.check_html, args.render_mode)
        return
    if args.html_to_pptx:
        if not args.out:
            raise SystemExit("--out is required with --html-to-pptx")
        html_to_pptx(args.html_to_pptx.read_text(encoding="utf-8"), output_path=args.out, render_mode=args.render_mode)
        print(str(args.out.resolve()))
        return
    if args.ir_to_pptx:
        if not args.out:
            raise SystemExit("--out is required with --ir-to-pptx")
        payload = json.loads(args.ir_to_pptx.read_text(encoding="utf-8"))
        presentation = payload.get("presentation") if isinstance(payload, dict) else None
        export_ir_to_pptx(presentation or payload, output_path=args.out)
        print(str(args.out.resolve()))
        return

    if not 1 <= args.max_concurrency <= 16:
        raise SystemExit("--max-concurrency must be between 1 and 16")
    environment_hosts = [
        value.strip()
        for value in os.environ.get(ALLOWED_HOSTS_ENV, "").split(",")
        if value.strip()
    ]
    try:
        runtime_token = _runtime_token_from_environment()
        allowed_hosts = _allowed_hosts(args.host, [*args.allowed_host, *environment_hosts])
    except ValueError as error:
        raise SystemExit(str(error)) from error
    run_server(
        args.host,
        args.port,
        runtime_token=runtime_token,
        allowed_hosts=allowed_hosts,
        max_concurrency=args.max_concurrency,
    )

main.__module__ = 'htmlir_server'
