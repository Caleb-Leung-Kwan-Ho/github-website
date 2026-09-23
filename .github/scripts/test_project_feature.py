#!/usr/bin/env python3
"""Verify that the lab's build flag removes public entry points and preserves its sources."""

from __future__ import annotations

from contextlib import redirect_stderr, redirect_stdout
from html.parser import HTMLParser
import io
import json
from pathlib import Path
import re
import shutil
import sys
import tempfile
import unittest
from unittest.mock import patch


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPOSITORY_ROOT / "scripts"))

import build_site as builder  # noqa: E402


class FeatureHTML(HTMLParser):
    def __init__(self, source: str) -> None:
        super().__init__()
        self.elements: list[tuple[str, dict[str, str | None]]] = []
        self.text: list[str] = []
        self.feed(source)

    def handle_starttag(self, tag: str, attributes: list[tuple[str, str | None]]) -> None:
        self.elements.append((tag, dict(attributes)))

    def handle_data(self, text: str) -> None:
        self.text.append(text)

    def matching(self, name: str, value: str) -> list[dict[str, str | None]]:
        return [attributes for _, attributes in self.elements if attributes.get(name) == value]


class ProjectFeatureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        # Exercise the real integration points and canonical records, not a second catalogue.
        cls.data = json.loads((REPOSITORY_ROOT / "sites/projects/projects.json").read_text(encoding="utf-8"))

    def assert_lab_absent(self, output: str) -> None:
        document = FeatureHTML(output)
        for _, attributes in document.elements:
            self.assertFalse(attributes.get("id", "").startswith("project-lab"))
            self.assertFalse(attributes.get("href", "").startswith("#project-lab"))
            self.assertNotIn("data-project-panel", attributes)
            for name in ("data-window", "data-open-window", "data-task-window"):
                self.assertNotEqual(attributes.get(name), "projects")
            classes = attributes.get("class", "").split()
            self.assertNotIn("projects-window", classes)
            self.assertNotIn("projects-site", classes)
        text = "".join(document.text)
        self.assertNotIn("DVD Project Lab", text)
        for project in self.data["projects"]:
            self.assertNotIn(project["summary"], text)

    def test_default_render_follows_configured_flag(self) -> None:
        for enabled in (False, True):
            with self.subTest(enabled=enabled), patch.object(builder, "PROJECT_LAB_ENABLED", enabled):
                output = builder.render(REPOSITORY_ROOT)
                self.assertEqual(output, builder.render(REPOSITORY_ROOT, project_lab_enabled=enabled))
                if enabled:
                    document = FeatureHTML(output)
                    self.assertEqual(len(document.matching("data-window", "projects")), 1)
                    self.assertTrue(document.matching("href", "#project-lab"))
                else:
                    self.assert_lab_absent(output)

    def test_disabled_render_removes_all_markup_instead_of_hiding_it(self) -> None:
        output = builder.render(REPOSITORY_ROOT, project_lab_enabled=False)
        self.assert_lab_absent(output)
        document = FeatureHTML(output)
        self.assertEqual(len(document.matching("data-window", "portfolio")), 1)
        self.assertEqual(len(document.matching("data-window", "hobbies")), 1)
        self.assertTrue(document.matching("href", "#hobby-top"))
        self.assertTrue(document.matching("id", "websites"))
        self.assertIn("My Websites", "".join(document.text))
        self.assertIn("Anime MCP", "".join(document.text))

    def test_enabled_render_restores_catalogue_and_each_entry_point(self) -> None:
        output = builder.render(REPOSITORY_ROOT, project_lab_enabled=True)
        document = FeatureHTML(output)
        for name in ("data-window", "data-open-window", "data-task-window"):
            self.assertEqual(len(document.matching(name, "projects")), 1, name)
        self.assertTrue(document.matching("href", "#project-lab"))
        self.assertEqual(len(document.matching("id", "project-lab")), 1)
        self.assertEqual(len(document.matching("id", "project-lab-updates")), 1)
        panels = [attrs for _, attrs in document.elements if "data-project-panel" in attrs]
        self.assertEqual(len(panels), len(self.data["projects"]))
        for project in self.data["projects"]:
            self.assertEqual(len(document.matching("id", f'project-lab-{project["id"]}')), 1)
            self.assertIn(project["summary"], "".join(document.text))
        self.assertNotIn("<!-- project-lab:", output)
        self.assertNotIn("<!-- project-catalogue", output)

    def test_professional_projects_are_identical_in_both_builds(self) -> None:
        pattern = re.compile(r'<section id="projects"[^>]*>.*?</section>', re.DOTALL)
        source = (REPOSITORY_ROOT / "sites/portfolio/content.html").read_text(encoding="utf-8")
        expected = pattern.search(source)
        self.assertIsNotNone(expected)
        normalized = "\n".join(line.strip() for line in expected.group().splitlines())
        for enabled in (False, True):
            with self.subTest(enabled=enabled):
                output = builder.render(REPOSITORY_ROOT, project_lab_enabled=enabled)
                section = pattern.search(output)
                self.assertIsNotNone(section)
                self.assertEqual("\n".join(line.strip() for line in section.group().splitlines()), normalized)

    def test_disabled_build_does_not_read_or_render_the_catalogue(self) -> None:
        with patch.object(builder, "render_catalogue", side_effect=AssertionError("Disabled catalogue rendered")):
            self.assert_lab_absent(builder.render(REPOSITORY_ROOT, project_lab_enabled=False))

    def test_malformed_feature_regions_fail_in_template_and_fragment(self) -> None:
        malformed = (
            "<!-- project-lab:start -->\n<p>Unclosed region</p>\n",
            "<p>Unopened region</p>\n<!-- project-lab:end -->\n",
            "<!-- project-lab:start -->\n<!-- project-lab:start -->\n<p>Nested region</p>\n<!-- project-lab:end -->\n<!-- project-lab:end -->\n",
            "<!-- project-lab:start --> trailing text\n<p>Malformed region</p>\n<!-- project-lab:end -->\n",
            "<!-- project-lab:unknown -->\n",
        )
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "desktop").mkdir()
            (root / "sites/portfolio").mkdir(parents=True)
            for location in ("desktop/page.html", "sites/portfolio/content.html"):
                for region in malformed:
                    for enabled in (False, True):
                        with self.subTest(location=location, region=region, enabled=enabled):
                            (root / "desktop/page.html").write_text('<!DOCTYPE html>\n<!-- include: sites/portfolio/content.html -->\n', encoding="utf-8")
                            (root / "sites/portfolio/content.html").write_text("<p>Portfolio</p>\n", encoding="utf-8")
                            prefix = "<!DOCTYPE html>\n" if location == "desktop/page.html" else ""
                            (root / location).write_text(prefix + region, encoding="utf-8")
                            with self.assertRaises(ValueError):
                                builder.render(root, project_lab_enabled=enabled)

    def test_flag_changes_leave_authored_lab_files_intact(self) -> None:
        paths = sorted(path for path in (REPOSITORY_ROOT / "sites/projects").rglob("*") if path.is_file())
        self.assertTrue(paths)
        for filename in ("content.html", "styles.css", "site.js", "dvd.js", "projects.json"):
            self.assertIn(REPOSITORY_ROOT / "sites/projects" / filename, paths)
        paths.append(REPOSITORY_ROOT / "images/projects/dvd-video.svg")
        before = {path: path.read_bytes() for path in paths}
        builder.render(REPOSITORY_ROOT, project_lab_enabled=False)
        builder.render(REPOSITORY_ROOT, project_lab_enabled=True)
        self.assertEqual({path: path.read_bytes() for path in paths}, before)
        self.assertEqual(sorted(path for path in (REPOSITORY_ROOT / "sites/projects").rglob("*.json")), [REPOSITORY_ROOT / "sites/projects/projects.json"])

    def test_disabled_region_skips_missing_include_but_enabled_build_fails(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "desktop").mkdir()
            (root / "desktop/page.html").write_text(
                '<!DOCTYPE html>\n<p id="retained">Retained content</p>\n'
                '<!-- project-lab:start -->\n'
                '<!-- include: sites/projects/content.html -->\n'
                '<!-- project-lab:end -->\n',
                encoding="utf-8",
            )
            self.assertIn('id="retained"', builder.render(root, project_lab_enabled=False))
            with self.assertRaises(FileNotFoundError):
                builder.render(root, project_lab_enabled=True)

    def test_check_detects_flag_changes_without_rewriting_previous_output(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            shutil.copytree(REPOSITORY_ROOT / "desktop", root / "desktop")
            shutil.copytree(REPOSITORY_ROOT / "sites", root / "sites")
            target = root / "index.html"
            render = builder.render
            for published_enabled in (False, True):
                with self.subTest(published_enabled=published_enabled):
                    target.write_text(render(root, project_lab_enabled=published_enabled), encoding="utf-8")
                    previous = target.read_bytes()
                    modified = target.stat().st_mtime_ns
                    stdout, stderr = io.StringIO(), io.StringIO()
                    with patch.object(builder, "PROJECT_LAB_ENABLED", not published_enabled), patch.object(builder, "ROOT", root):
                        with patch.object(builder, "render", lambda: render(root)), patch.object(sys, "argv", ["build_site.py", "--check"]):
                            with redirect_stdout(stdout), redirect_stderr(stderr):
                                result = builder.main()
                    self.assertEqual(result, 1)
                    self.assertIn("out of date", stderr.getvalue())
                    self.assertEqual(target.read_bytes(), previous)
                    self.assertEqual(target.stat().st_mtime_ns, modified)


if __name__ == "__main__":
    unittest.main()
