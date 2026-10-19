from __future__ import annotations

import json
import sys
from typing import Any

from schema_v4_export import SchemaV4ExportError, export_schema_v4_deck_to_pptx


def export_payload(payload: Any) -> bytes:
    if not isinstance(payload, dict):
        raise ValueError("Studio export payload must be an object.")
    deck = payload.get("deck")
    if not isinstance(deck, dict):
        raise ValueError("Studio export payload must contain a Deck object.")
    return export_schema_v4_deck_to_pptx(
        deck,
        export_watermark=False,
        output_mode="editable",
        **({"flow_layout": payload["flowLayout"]} if payload.get("flowLayout") else {}),
    )


def main() -> int:
    try:
        payload = json.load(sys.stdin.buffer)
        pptx_bytes = export_payload(payload)
    except (json.JSONDecodeError, SchemaV4ExportError, ValueError) as error:
        print(str(error), file=sys.stderr)
        return 2
    except Exception as error:  # pragma: no cover - surfaced to the local Studio.
        print(str(error), file=sys.stderr)
        return 1
    sys.stdout.buffer.write(pptx_bytes)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
