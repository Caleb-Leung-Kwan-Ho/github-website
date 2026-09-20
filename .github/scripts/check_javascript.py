#!/usr/bin/env python3
"""Syntax-check every reachable browser module without a package manifest."""

from __future__ import annotations

import subprocess
import sys

from check_site_security import REPOSITORY_ROOT, javascript_modules


def main() -> int:
    modules, errors = javascript_modules(REPOSITORY_ROOT)
    if errors:
        print("Cannot check JavaScript syntax until the module graph is valid:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    failed = False
    for path in modules:
        try:
            result = subprocess.run(
                ["node", "--input-type=module", "--check"],
                input=path.read_text(encoding="utf-8"),
                text=True,
                capture_output=True,
                check=False,
            )
        except FileNotFoundError:
            print("Node.js is required for JavaScript syntax checks.", file=sys.stderr)
            return 1
        if result.returncode:
            failed = True
            print(f"{path.relative_to(REPOSITORY_ROOT)}:\n{result.stderr}", file=sys.stderr)
    if failed:
        return 1
    print(f"JavaScript syntax passed for {len(modules)} local modules.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
