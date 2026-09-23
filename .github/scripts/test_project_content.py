#!/usr/bin/env python3
"""Exercise catalogue validation and the complete, escaped no-JavaScript output."""

from __future__ import annotations

from copy import deepcopy
from html.parser import HTMLParser
import json
from pathlib import Path
import sys
import tempfile
import unittest


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPOSITORY_ROOT / "scripts"))

import project_content as catalogue  # noqa: E402


class CatalogueHTML(HTMLParser):
    def __init__(self, source: str) -> None:
        super().__init__()
        self.elements: list[tuple[str, dict]] = []
        self.text: list[str] = []
        self.feed(source)

    def handle_starttag(self, tag: str, attributes: list[tuple[str, str | None]]) -> None:
        self.elements.append((tag, dict(attributes)))

    def handle_data(self, text: str) -> None:
        self.text.append(text)


class ProjectContentTests(unittest.TestCase):
    def setUp(self) -> None:
        self.data = json.loads((REPOSITORY_ROOT / "sites/projects/projects.json").read_text(encoding="utf-8"))

    def test_supplied_content_has_all_targets_and_no_invented_dates(self) -> None:
        source = catalogue.render_projects(self.data)
        document = CatalogueHTML(source)
        ids = [attributes["id"] for _, attributes in document.elements if "id" in attributes]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertIn("project-lab-updates", ids)
        self.assertIn("Current / undated notes", source)
        self.assertNotIn("<time", source)
        self.assertNotIn("<script", source)
        self.assertNotIn("No blockers", source)
        for project in self.data["projects"]:
            base = f'project-lab-{project["id"]}'
            self.assertIn(base, ids)
            panels = [attrs for tag, attrs in document.elements if tag == "article" and attrs.get("id") == base]
            self.assertEqual(len(panels), 1)
            self.assertNotIn("hidden", panels[0])
            for milestone in project["milestones"]:
                self.assertIn(f'{base}-milestone-{milestone["id"]}', ids)
                self.assertIn(milestone["title"], "".join(document.text))
            for update in project["updates"]:
                self.assertIn(f'{base}-update-{update["id"]}', ids)
                self.assertIn(update["text"], "".join(document.text))
        for _, attrs in document.elements:
            if attrs.get("target") == "_blank":
                self.assertEqual(attrs["rel"], "noopener noreferrer")
            if "aria-labelledby" in attrs:
                self.assertIn(attrs["aria-labelledby"], ids)

    def test_text_and_attributes_are_escaped_without_executable_markup(self) -> None:
        payload = '<img src=x onerror="alert(1)"> & \'quoted\''
        project = self.data["projects"][0]
        for field in ("title", "summary", "currentFocus", "nextStep", "currentBlocker"):
            project[field] = payload
        project["milestones"][0]["title"] = payload
        project["milestones"][0]["description"] = payload
        project["updates"][0]["text"] = payload
        project["links"] = [{"label": payload, "url": 'https://example.com/?a=1&b="two"'}]
        source = catalogue.render_projects(self.data)
        document = CatalogueHTML(source)
        self.assertNotIn("<img", source)
        self.assertIn("&lt;img", source)
        self.assertIn(payload, "".join(document.text))
        self.assertFalse(any(name.startswith("on") for _, attrs in document.elements for name in attrs))
        row = next(attrs for _, attrs in document.elements if attrs.get("data-project-id") == project["id"])
        self.assertEqual(row["data-project-search"], f"{payload} {payload}")
        link = next(attrs for _, attrs in document.elements if attrs.get("href", "").startswith("https://example.com"))
        self.assertEqual(link["href"], project["links"][0]["url"])

    def test_optional_content_does_not_create_empty_actions_or_fake_facts(self) -> None:
        project = self.data["projects"][0]
        for field in ("currentBlocker", "links", "milestones", "updates", "relatedProjectIds", "featured"):
            project.pop(field)
        source = catalogue.render_projects({"schemaVersion": 1, "projects": [project]})
        self.assertIn("Roadmap not yet published.", source)
        self.assertIn("No updates published yet.", source)
        self.assertNotIn("Current blocker", source)
        self.assertNotIn("Public links", source)
        self.assertNotIn("disabled", source)
        self.assertNotIn("<time", source)

    def test_missing_description_has_no_empty_disclosure(self) -> None:
        self.data["projects"] = [self.data["projects"][0]]
        self.data["projects"][0]["milestones"] = [{"id": "planned-work", "title": "Pending work", "status": "planned"}]
        source = catalogue.render_projects(self.data)
        self.assertEqual(source.count("<details"), 1)  # Only the project chooser.
        self.assertIn('class="project-milestone-heading"', source)

    def test_dates_are_validated_and_sorted_without_assigning_dates_to_undated_notes(self) -> None:
        project = self.data["projects"][0]
        project["updates"] = [
            {"id": "old", "date": "2024-02-29", "text": "Earlier note"},
            {"id": "unknown", "date": None, "text": "Current work"},
            {"id": "new", "date": "2025-03-01", "text": "Later note"},
        ]
        source = catalogue.render_projects(self.data)
        update_source = source[source.index('id="project-lab-updates"'):]
        self.assertLess(update_source.index("Later note"), update_source.index("Earlier note"))
        self.assertLess(update_source.index("Earlier note"), update_source.index("Current / undated notes"))
        self.assertEqual(update_source.count("<time"), 2)
        for value in ("2025-02-29", "2025-2-09", "2025-01-01T00:00:00", 20250101, ""):
            with self.subTest(value=value):
                project["updates"][0]["date"] = value
                with self.assertRaisesRegex(ValueError, "date"):
                    catalogue.render_projects(self.data)

    def test_duplicate_and_unsafe_ids_fail_instead_of_repairing(self) -> None:
        cases = []
        duplicate_project = deepcopy(self.data)
        duplicate_project["projects"].append(deepcopy(duplicate_project["projects"][0]))
        cases.append(duplicate_project)
        for kind in ("milestones", "updates"):
            duplicate_item = deepcopy(self.data)
            records = duplicate_item["projects"][0][kind]
            records.append(deepcopy(records[0]))
            cases.append(duplicate_item)
        for slug in ("../escape", 'bad" onload="x', "two words", "Uppercase", "updates", "anime-mcp-title"):
            unsafe = deepcopy(self.data)
            unsafe["projects"][1]["id"] = slug
            cases.append(unsafe)
        for data in cases:
            with self.subTest(data=data):
                with self.assertRaises(ValueError):
                    catalogue.render_projects(data)

    def test_relationships_must_exist_be_unique_and_not_point_to_self(self) -> None:
        for related in (["missing"], ["anime-mcp"], ["gba-website", "gba-website"]):
            with self.subTest(related=related):
                self.data["projects"][0]["relatedProjectIds"] = related
                with self.assertRaises(ValueError):
                    catalogue.render_projects(self.data)

    def test_schema_required_text_and_status_types_are_validated(self) -> None:
        mutations = (
            lambda data: data.update(schemaVersion=True),
            lambda data: data.update(schemaVersion=2),
            lambda data: data.update(projects={}),
            lambda data: data["projects"][0].update(title=" "),
            lambda data: data["projects"][0].update(currentFocus=None),
            lambda data: data["projects"][0].update(status="done"),
            lambda data: data["projects"][0].update(status=[]),
            lambda data: data["projects"][0].update(featured="false"),
            lambda data: data["projects"][0]["milestones"][0].update(status="completed"),
            lambda data: data["projects"][0]["updates"][0].update(text=""),
        )
        for mutation in mutations:
            data = deepcopy(self.data)
            mutation(data)
            with self.assertRaises(ValueError):
                catalogue.render_projects(data)

    def test_external_links_require_https_without_browser_repairs_or_credentials(self) -> None:
        for url in ("javascript:alert(1)", "data:text/html,<script>", "http://example.com", "//example.com", "https:///missing", "https://example.com:wrong", "https://user:password@example.com", "https://@example.com", "https://example.com\\@evil.test", "https://example.com/\nscript", " https://example.com"):
            with self.subTest(url=url):
                self.data["projects"][0]["links"] = [{"label": "Reference", "url": url}]
                with self.assertRaisesRegex(ValueError, "HTTPS"):
                    catalogue.render_projects(self.data)

    def test_additional_project_and_long_roadmap_need_only_data(self) -> None:
        extra = deepcopy(self.data["projects"][0])
        extra.update(id="additional-project", title="A longer project title for a growing collection", links=[], relatedProjectIds=[], updates=[])
        extra["milestones"] = [{"id": f"step-{number}", "title": f"Independently supplied milestone {number}", "status": "planned"} for number in range(15)]
        self.data["projects"].append(extra)
        source = catalogue.render_projects(self.data)
        self.assertEqual(source.count("data-project-panel"), 5)
        self.assertIn("5 projects</p>", source)
        self.assertIn("project-lab-additional-project-milestone-step-14", source)
        extra["milestones"] = []
        self.assertIn("Roadmap not yet published", catalogue.render_projects(self.data))

    def test_catalogue_symlink_cannot_read_outside_its_folder(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            folder = root / "sites/projects"
            folder.mkdir(parents=True)
            outside = root / "outside.json"
            outside.write_text(json.dumps(self.data), encoding="utf-8")
            (folder / "projects.json").symlink_to(outside)
            with self.assertRaisesRegex(ValueError, "must stay inside"):
                catalogue.render_catalogue(root)


if __name__ == "__main__":
    unittest.main()
