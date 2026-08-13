#!/usr/bin/env python3

from __future__ import annotations

import re
import unittest
from pathlib import Path
import sys


sys.path.insert(0, str(Path(__file__).parent))

from check_agent_coauthors import (  # noqa: E402
    DEFAULT_PATTERNS_PATH,
    find_agent_coauthors,
    load_patterns,
)


class AgentCoauthorCheckTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.patterns = load_patterns(DEFAULT_PATTERNS_PATH)

    def test_blocks_common_agent_identities(self) -> None:
        records = [
            (
                "a" * 40,
                "Add feature\n\n"
                "Co-authored-by: Codex <codex@openai.com>\n"
                "Co-authored-by: GitHub Copilot <copilot@github.com>\n"
                "Co-authored-by: Claude <claude@anthropic.com>\n",
            )
        ]

        findings = find_agent_coauthors(records, self.patterns)

        self.assertEqual(
            [finding.identity for finding in findings],
            [
                "Codex <codex@openai.com>",
                "GitHub Copilot <copilot@github.com>",
                "Claude <claude@anthropic.com>",
            ],
        )

    def test_allows_human_coauthors_and_user_identity(self) -> None:
        records = [
            (
                "b" * 40,
                "Update documentation\n\n"
                "Co-authored-by: Ada Lovelace <ada@example.com>\n"
                "Co-authored-by: Caleb Leung <caleb@example.com>\n",
            )
        ]

        self.assertEqual(find_agent_coauthors(records, self.patterns), [])

    def test_does_not_block_generic_human_words(self) -> None:
        records = [
            (
                "c" * 40,
                "Refine styles\n\n"
                "Co-authored-by: A.I. Researcher <researcher@example.com>\n"
                "Co-authored-by: Devin Hart <devin.hart@example.com>\n",
            )
        ]

        self.assertEqual(find_agent_coauthors(records, self.patterns), [])

    def test_matches_trailer_case_and_whitespace_variations(self) -> None:
        records = [
            (
                "d" * 40,
                "Fix layout\n\n"
                "  co-AUTHORED-by :   Cursor <cursor@example.com>  \n",
            )
        ]

        findings = find_agent_coauthors(records, self.patterns)

        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].identity, "Cursor <cursor@example.com>")

    def test_denylist_patterns_are_valid(self) -> None:
        for pattern in self.patterns:
            self.assertIsInstance(pattern, re.Pattern)


if __name__ == "__main__":
    unittest.main()
