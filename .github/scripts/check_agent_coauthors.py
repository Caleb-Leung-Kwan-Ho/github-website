#!/usr/bin/env python3
"""Reject known AI-agent identities in Git co-author trailers."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence


COAUTHOR_TRAILER = re.compile(
    r"^[ \t]*co-authored-by\s*:\s*(?P<identity>.+?)\s*$",
    re.IGNORECASE | re.MULTILINE,
)
DEFAULT_PATTERNS_PATH = (
    Path(__file__).resolve().parents[1] / "agent-coauthor-patterns.txt"
)


@dataclass(frozen=True)
class Finding:
    commit: str
    identity: str
    pattern: str


def load_patterns(path: Path) -> tuple[re.Pattern[str], ...]:
    """Load non-comment regular expressions from a denylist file."""

    patterns: list[re.Pattern[str]] = []
    for line_number, raw_line in enumerate(path.read_text().splitlines(), 1):
        expression = raw_line.strip()
        if not expression or expression.startswith("#"):
            continue
        try:
            patterns.append(re.compile(expression, re.IGNORECASE))
        except re.error as error:
            raise ValueError(
                f"Invalid regular expression on line {line_number} of {path}: {error}"
            ) from error
    return tuple(patterns)


def find_agent_coauthors(
    records: Iterable[tuple[str, str]],
    patterns: Sequence[re.Pattern[str]],
) -> list[Finding]:
    """Return matching agent co-author trailers from commit records."""

    findings: list[Finding] = []
    for commit, message in records:
        for match in COAUTHOR_TRAILER.finditer(message):
            identity = match.group("identity").strip()
            for pattern in patterns:
                if pattern.search(identity):
                    findings.append(
                        Finding(
                            commit=commit,
                            identity=identity,
                            pattern=pattern.pattern,
                        )
                    )
                    break
    return findings


def read_git_log(commit_range: str) -> list[tuple[str, str]]:
    """Read commit hashes and messages from a Git revision range."""

    result = subprocess.run(
        [
            "git",
            "log",
            "--no-decorate",
            "--no-color",
            "--format=%H%x00%B%x00",
            commit_range,
        ],
        check=True,
        capture_output=True,
        text=True,
    )

    fields = result.stdout.split("\0")
    records: list[tuple[str, str]] = []
    for index in range(0, len(fields) - 1, 2):
        commit = fields[index].strip()
        if commit:
            records.append((commit, fields[index + 1]))
    return records


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Reject known AI-agent identities in Co-authored-by trailers."
    )
    parser.add_argument(
        "--range",
        dest="commit_range",
        required=True,
        help="Git revision range to inspect, for example BASE..HEAD.",
    )
    parser.add_argument(
        "--patterns",
        type=Path,
        default=DEFAULT_PATTERNS_PATH,
        help="Path to the case-insensitive agent identity denylist.",
    )
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    try:
        patterns = load_patterns(args.patterns)
        records = read_git_log(args.commit_range)
    except (OSError, subprocess.CalledProcessError, ValueError) as error:
        print(f"Unable to inspect commit attribution: {error}", file=sys.stderr)
        return 2

    findings = find_agent_coauthors(records, patterns)
    if not findings:
        print("No known agent co-author trailers found.")
        return 0

    print("Known agent co-author trailers are not allowed:", file=sys.stderr)
    for finding in findings:
        print(
            f"- {finding.commit[:12]}: Co-authored-by: {finding.identity}",
            file=sys.stderr,
        )
    print(
        "Remove the agent trailer, or replace it with a human co-author if appropriate.",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
