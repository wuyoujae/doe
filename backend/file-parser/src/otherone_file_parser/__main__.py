from __future__ import annotations

import uvicorn

from otherone_file_parser.config import Settings
from otherone_file_parser.main import create_app


def main() -> None:
    settings = Settings.from_env()
    uvicorn.run(
        create_app(settings=settings),
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level.lower(),
        workers=1,
    )


if __name__ == "__main__":
    main()
