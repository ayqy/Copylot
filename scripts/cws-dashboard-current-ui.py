#!/usr/bin/env python3
"""Run the pub CWS dashboard wrapper with Copylot's current-console JXA adapter."""

from __future__ import annotations

import importlib.util
from pathlib import Path
import sys


def main(argv: list[str]) -> int:
    if not argv:
        raise SystemExit(
            "usage: cws-dashboard-current-ui.py <pub-root> <validate|probe|configure|self-test> ..."
        )
    pub_root = Path(argv[0]).expanduser().resolve()
    adapter_path = pub_root / "scripts" / "cws_dashboard.py"
    spec = importlib.util.spec_from_file_location("copylot_pub_cws_dashboard", adapter_path)
    if spec is None or spec.loader is None:
        raise SystemExit(f"cannot load pub CWS dashboard adapter: {adapter_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.JXA_SCRIPT = Path(__file__).with_name("cws-dashboard-current-ui.jxa").resolve()
    return int(module.main(argv[1:]))


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
