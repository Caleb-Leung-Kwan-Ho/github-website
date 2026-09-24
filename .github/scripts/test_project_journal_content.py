#!/usr/bin/env python3
"""Protect journal facts, localization coverage, static anchors, and safe output."""

from __future__ import annotations

from copy import deepcopy
from hashlib import sha256
from html.parser import HTMLParser
import io
import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
import build_site as builder  # noqa: E402
import project_journal_content as journal  # noqa: E402


class JournalHTML(HTMLParser):
    def __init__(self, source: str) -> None:
        super().__init__()
        self.elements: list[tuple[str, dict]] = []
        self.text: list[str] = []
        self.feed(source)

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.elements.append((tag, dict(attrs)))

    def handle_data(self, value: str) -> None:
        self.text.append(value)


class JournalTests(unittest.TestCase):
    def setUp(self) -> None:
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.folder = self.root / "sites/project-journal"
        (self.folder / "locales").mkdir(parents=True)
        for name in ("projects.json", "content.html", "locales/en.json", "locales/ja.json", "locales/zh-HK.json"):
            shutil.copy2(ROOT / "sites/project-journal" / name, self.folder / name)
        shutil.copytree(ROOT / "sites/project-journal/templates", self.folder / "templates")
        photos = self.root / "images/project-journal"
        photos.mkdir(parents=True)
        shutil.copy2(ROOT / "images/project-journal/photos.json", photos / "photos.json")
        self.photos = json.loads((photos / "photos.json").read_text())["photos"]
        for photo in self.photos:
            (self.root / photo["suggestedRepoPath"]).write_bytes(b"local fixture")
        self.data = json.loads((self.folder / "projects.json").read_text())
        self.locales = {locale: json.loads((self.folder / f"locales/{locale}.json").read_text()) for locale in journal.LOCALES}

    def save(self) -> None:
        (self.folder / "projects.json").write_text(json.dumps(self.data), encoding="utf-8")
        for locale, data in self.locales.items():
            (self.folder / f"locales/{locale}.json").write_text(json.dumps(data), encoding="utf-8")

    def sync_english(self) -> None:
        self.locales["en"]["projects"] = {project["id"]: journal.project_overlay(project) for project in self.data["projects"]}

    def test_static_fallback_has_every_project_milestone_update_and_real_anchor(self) -> None:
        source = journal.render_journal(self.root)
        document = JournalHTML(source)
        ids = [attrs["id"] for _, attrs in document.elements if "id" in attrs]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertTrue(all(value.startswith("project-journal") for value in ids))
        self.assertNotIn("<time", source)
        self.assertNotIn("<script", source)
        for tag, attrs in document.elements:
            if tag == "article":
                self.assertNotIn("hidden", attrs)
            if "aria-labelledby" in attrs:
                self.assertIn(attrs["aria-labelledby"], ids)
            if attrs.get("href", "").startswith("#project-journal"):
                self.assertIn(attrs["href"][1:], ids)
            if attrs.get("target") == "_blank":
                self.assertEqual(attrs["rel"], "noopener noreferrer")
        for project in self.data["projects"]:
            base = f'project-journal-{project["id"]}'
            self.assertIn(base, ids)
            for kind in ("milestones", "updates"):
                for entry in project[kind]:
                    self.assertIn(f'{base}-{"milestone" if kind == "milestones" else "update"}-{entry["id"]}', ids)
                    self.assertIn(entry["title" if kind == "milestones" else "text"], "".join(document.text))
        self.assertEqual(source.count('data-journal-text="noBlocker"'), 2)
        self.assertEqual(source.count('data-journal-text="dateNotRecorded"'), 4)

    def test_project_updates_stay_with_their_own_project_in_authored_order(self) -> None:
        project = self.data["projects"][0]
        project["updates"].append({"id": "second-note", "date": None, "text": "A second undated note."})
        for locale in self.locales.values():
            locale["projects"][project["id"]]["updates"]["second-note"] = {"text": "A second undated note."}
        self.save()
        source = journal.render_journal(self.root)
        first = source.index('id="project-journal-anime-mcp"')
        second = source.index('id="project-journal-gba-website"')
        self.assertLess(source.index("current-research-focus", first), source.index("second-note", first))
        self.assertNotIn("website-final-additions", source[first:second])

    def test_generated_module_uses_validated_source_and_is_safe_as_plain_data(self) -> None:
        module = journal.render_translations(self.root)
        prefix = "export const JOURNAL_LOCALES = "
        locales, projects = module.split(prefix, 1)[1].split(";\n\nexport const JOURNAL_PROJECTS = ", 1)
        self.assertEqual(json.loads(locales), self.locales)
        self.assertEqual(json.loads(projects.removesuffix(";\n")), self.data["projects"])
        self.assertNotIn("fetch(", module)

    def test_markup_and_attributes_are_escaped_while_translation_data_stays_plain_text(self) -> None:
        payload = '<img src=x onerror="alert(1)"> & \'quoted\''
        project = self.data["projects"][0]
        for field in journal.TEXT_FIELDS:
            project[field] = payload
        for locale in self.locales.values():
            for field in journal.TEXT_FIELDS:
                locale["projects"][project["id"]][field] = payload
        project["milestones"][0]["title"] = payload
        milestone_id = project["milestones"][0]["id"]
        for locale in self.locales.values():
            locale["projects"][project["id"]]["milestones"][milestone_id]["title"] = payload
        self.save()
        source = journal.render_journal(self.root)
        document = JournalHTML(source)
        self.assertEqual(sum(tag == "img" for tag, _ in document.elements), 3)
        self.assertIn(payload, "".join(document.text))
        self.assertFalse(any(key.startswith("on") for _, attrs in document.elements for key in attrs))
        module = journal.render_translations(self.root)
        self.assertNotIn("<img", module)
        self.assertIn("\\u003cimg", module)

    def test_schema_statuses_dates_and_links_are_validated(self) -> None:
        mutations = [
            lambda data: data.update(schemaVersion=True),
            lambda data: data.update(projects=[]),
            lambda data: data["projects"][0].update(status="done"),
            lambda data: data["projects"][0].update(featured="false"),
            lambda data: data["projects"][1].update(featured=True),
            lambda data: data["projects"][0].update(summary="\x00bad"),
            lambda data: data["projects"][0]["milestones"][0].update(status="completed"),
            lambda data: data["projects"][0]["updates"][0].update(date="2025-02-29"),
            lambda data: data["projects"][0]["updates"][0].update(date="2024-2-29"),
            lambda data: data["projects"][0].update(unknown="unused data"),
        ]
        for mutation in mutations:
            data = deepcopy(self.data)
            mutation(data)
            with self.assertRaises(ValueError):
                journal.validate_projects(data)
        for url in ("javascript:alert(1)", "http://example.com", "//example.com", "https:///missing", "https://user:password@example.com", "https://example.com\\@evil.test", "https://example.com:bad", "https://example.com/\nscript"):
            with self.subTest(url=url):
                data = deepcopy(self.data)
                data["projects"][0]["links"][0]["url"] = url
                with self.assertRaises(ValueError):
                    journal.validate_projects(data)
        data = deepcopy(self.data)
        data["projects"][0]["updates"][0]["date"] = "2024-02-29"
        journal.validate_projects(data)

    def test_ids_cannot_collide_with_fixed_ids_other_projects_or_nested_items(self) -> None:
        for value in ("../bad", "title", "projects", "current-work", "window-title", "favorites", "anime-mcp-title", "anime-mcp-updates", "anime-mcp-update-current-research-focus"):
            with self.subTest(value=value):
                data = deepcopy(self.data)
                data["projects"][1]["id"] = value
                with self.assertRaises(ValueError):
                    journal.validate_projects(data)
        for kind in ("projects", "milestones", "updates"):
            data = deepcopy(self.data)
            records = data[kind] if kind == "projects" else data["projects"][0][kind]
            records.append(deepcopy(records[0]))
            with self.assertRaises(ValueError):
                journal.validate_projects(data)

    def test_related_projects_must_exist_be_unique_and_not_self_referential(self) -> None:
        for related in (["unknown"], ["anime-mcp"], ["gba-website", "gba-website"]):
            data = deepcopy(self.data)
            data["projects"][0]["relatedProjectIds"] = related
            with self.assertRaises(ValueError):
                journal.validate_projects(data)

    def test_translation_coverage_nulls_placeholders_and_english_match_are_required(self) -> None:
        mutations = [
            lambda locales: locales["ja"]["ui"].pop("noResults"),
            lambda locales: locales["zh-HK"]["ui"].update(resultCount="Found projects"),
            lambda locales: locales["ja"]["projects"].pop("anime-mcp"),
            lambda locales: locales["ja"]["projects"]["anime-mcp"].update(status="paused"),
            lambda locales: locales["ja"]["projects"]["gba-website"].update(currentBlocker="Invented blocker"),
            lambda locales: locales["ja"]["projects"]["anime-mcp"]["milestones"].pop("select-embedding-models"),
            lambda locales: locales["ja"]["projects"]["anime-mcp"]["updates"].pop("current-research-focus"),
            lambda locales: locales["ja"]["projects"]["anime-mcp"]["linkLabels"].clear(),
            lambda locales: locales["en"]["projects"]["anime-mcp"].update(summary="Divergent English text"),
            lambda locales: locales["ja"]["photos"].clear(),
            lambda locales: locales["ja"].update(locale="en"),
        ]
        for mutation in mutations:
            locales = deepcopy(self.locales)
            mutation(locales)
            with self.assertRaises(ValueError):
                journal.validate_locales(locales, self.data["projects"], self.photos)

    def test_fifty_projects_need_only_canonical_and_translated_records(self) -> None:
        source = deepcopy(self.data["projects"][0])
        for number in range(46):
            project = deepcopy(source)
            project.update(id=f"extra-project-{number}", featured=False, title=f"Extra project {number}", relatedProjectIds=[])
            self.data["projects"].append(project)
            for locale in self.locales.values():
                locale["projects"][project["id"]] = journal.project_overlay(project)
        self.save()
        output = journal.render_journal(self.root)
        self.assertEqual(output.count("data-journal-project-panel="), 50)
        self.assertEqual(output.count("data-journal-row="), 50)
        self.assertIn("50 projects found", output)
        ids = [attrs["id"] for _, attrs in JournalHTML(output).elements if "id" in attrs]
        self.assertEqual(len(ids), len(set(ids)))

    def test_missing_optional_content_uses_translated_empty_states_without_fabricating_facts(self) -> None:
        project = self.data["projects"][0]
        project.update(currentBlocker=None, updates=[], milestones=[], links=[], relatedProjectIds=[])
        for locale in self.locales.values():
            locale["projects"][project["id"]] = journal.project_overlay(project)
        self.save()
        output = journal.render_journal(self.root)
        self.assertIn('data-journal-text="noUpdates"', output)
        self.assertIn('data-journal-text="noMilestones"', output)
        self.assertIn('data-journal-text="noLinks"', output)
        self.assertNotIn("<time", output)

    def test_local_source_symlinks_cannot_escape_owner_folders(self) -> None:
        for name in ("projects.json", "locales/ja.json"):
            target = self.folder / name
            old = target.read_bytes()
            outside = self.root / "outside.json"
            outside.write_bytes(old)
            target.unlink()
            target.symlink_to(outside)
            with self.assertRaisesRegex(ValueError, "must stay inside"):
                journal.load_journal(self.root)
            target.unlink()
            target.write_bytes(old)
        image = self.root / self.photos[0]["suggestedRepoPath"]
        image.unlink()
        image.symlink_to(outside)
        with self.assertRaisesRegex(ValueError, "must stay inside"):
            journal.load_journal(self.root)

    def test_photos_have_original_supplied_hashes_local_paths_and_visible_credits(self) -> None:
        source = journal.render_journal(ROOT)
        for photo in self.photos:
            image = ROOT / photo["suggestedRepoPath"]
            self.assertEqual(sha256(image.read_bytes()).hexdigest(), photo["sha256"])
            for field in ("creator", "license"):
                self.assertIn(photo[field], source)
        self.assertIn("color and tone edited", source)
        self.assertIn("adapted photo remains CC BY-SA 4.0", source)
        images = [attrs for tag, attrs in JournalHTML(source).elements if tag == "img"]
        self.assertEqual([attrs["src"] for attrs in images], [photo["suggestedRepoPath"] for photo in self.photos])

    def test_journal_assembly_marker_is_narrow_and_requires_one_exact_marker(self) -> None:
        desktop = self.root / "desktop"
        desktop.mkdir()
        page = desktop / "page.html"
        page.write_text('<!DOCTYPE html>\n<!-- include: sites/project-journal/content.html -->\n')
        self.assertIn('id="project-journal-anime-mcp"', builder.render(self.root))
        for marker in ("<!-- project-journal-content -->\n<!-- project-journal-content -->", "<!-- project-journal-content --> trailing", "<!-- project-journal-content: other.json -->"):
            (self.folder / "content.html").write_text(marker)
            with self.assertRaisesRegex(ValueError, "project-journal-content"):
                builder.render(self.root)
        page.write_text('<!DOCTYPE html>\n<!-- project-journal-content -->\n')
        with self.assertRaisesRegex(ValueError, "belongs in"):
            builder.render(self.root)

    def test_module_freshness_check_detects_locale_change_without_writing_outputs(self) -> None:
        desktop = self.root / "desktop"
        desktop.mkdir()
        (desktop / "page.html").write_text('<!DOCTYPE html>\n<!-- include: sites/project-journal/content.html -->\n')
        with patch.object(builder, "ROOT", self.root), patch.object(builder, "render_site_registry", return_value="registry\n"), patch.object(builder, "render_site_styles", return_value="styles\n"):
            with patch.object(sys, "argv", ["build_site.py"]), redirect_stdout(io.StringIO()):
                self.assertEqual(builder.main(), 0)
            module = self.folder / "translations.js"
            before = module.read_bytes()
            self.locales["ja"]["ui"]["currentWork"] += "！"
            self.save()
            errors = io.StringIO()
            with patch.object(sys, "argv", ["build_site.py", "--check"]), redirect_stderr(errors), redirect_stdout(io.StringIO()):
                self.assertEqual(builder.main(), 1)
            self.assertIn("translations.js", errors.getvalue())
            self.assertEqual(module.read_bytes(), before)


if __name__ == "__main__":
    unittest.main()
