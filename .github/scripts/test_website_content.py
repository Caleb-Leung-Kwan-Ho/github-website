#!/usr/bin/env python3
"""Keep growing website lists escaped, validated, and rendered by one template."""

from __future__ import annotations

from html.parser import HTMLParser
import json
from pathlib import Path
import sys
import tempfile
import unittest


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPOSITORY_ROOT / "scripts"))

import website_content as catalogue  # noqa: E402


class ShortcutHTML(HTMLParser):
    def __init__(self, source: str) -> None:
        super().__init__()
        self.elements: list[tuple[str, dict]] = []
        self.text: list[str] = []
        self.feed(source)

    def handle_starttag(self, tag: str, attributes: list[tuple[str, str | None]]) -> None:
        self.elements.append((tag, dict(attributes)))

    def handle_data(self, text: str) -> None:
        self.text.append(text)


class WebsiteContentTests(unittest.TestCase):
    def setUp(self) -> None:
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.folder = self.root / "sites/my-folder"
        self.folder.mkdir(parents=True)
        self.template = (REPOSITORY_ROOT / "sites/my-folder/shortcut.html").read_text(encoding="utf-8")
        (self.folder / "shortcut.html").write_text(self.template, encoding="utf-8")

    def write_catalogue(self, data: object) -> None:
        (self.folder / "websites.json").write_text(json.dumps(data), encoding="utf-8")

    def test_ten_sites_need_only_data_and_keep_one_shared_icon_template(self) -> None:
        data = [{"name": f"Website {number}", "target": f"#website-{number}"} for number in range(10)]
        self.write_catalogue(data)
        document = ShortcutHTML(catalogue.render_shortcuts(self.root))
        links = [attributes for tag, attributes in document.elements if tag == "a"]
        icons = [attributes for tag, attributes in document.elements if tag == "img"]
        self.assertEqual([link["href"] for link in links], [site["target"] for site in data])
        self.assertEqual([link["aria-label"] for link in links], [f'Open {site["name"]} website' for site in data])
        self.assertEqual(len(icons), 10)
        self.assertTrue(all(icon["src"] == "images/website-shortcut.svg" and icon["alt"] == "" for icon in icons))
        for site in data:
            self.assertIn(f'{site["name"]}.html', document.text)
        self.assertEqual((self.folder / "shortcut.html").read_text(encoding="utf-8"), self.template)

    def test_names_preserve_unicode_and_escape_text_and_attributes(self) -> None:
        name = '日本語 & <img src=x onerror="alert(1)"> \'quoted\''
        self.write_catalogue([{"name": name, "target": "#hobby-top"}])
        source = catalogue.render_shortcuts(self.root)
        document = ShortcutHTML(source)
        links = [attributes for tag, attributes in document.elements if tag == "a"]
        self.assertEqual(links[0]["aria-label"], f"Open {name} website")
        self.assertIn(f"{name}.html", document.text)
        self.assertIn("&lt;img", source)
        self.assertEqual(sum(tag == "img" for tag, _ in document.elements), 1)
        self.assertFalse(any(key.startswith("on") for _, attributes in document.elements for key in attributes))

    def test_lab_shortcut_follows_feature_flag_without_reordering_other_sites(self) -> None:
        self.write_catalogue([
            {"name": "Personal Hobbies", "target": "#hobby-top"},
            {"name": "DVD Project Lab", "target": "#project-lab", "feature": "project-lab"},
            {"name": "Another Site", "target": "#another-site"},
        ])
        for features, expected in (
            (frozenset(), ["#hobby-top", "#another-site"]),
            (frozenset({"project-lab"}), ["#hobby-top", "#project-lab", "#another-site"]),
        ):
            with self.subTest(features=features):
                document = ShortcutHTML(catalogue.render_shortcuts(self.root, enabled_features=features))
                self.assertEqual([attrs["href"] for tag, attrs in document.elements if tag == "a"], expected)

    def test_empty_catalogue_has_no_placeholder_shortcuts(self) -> None:
        self.write_catalogue([])
        self.assertEqual(catalogue.render_shortcuts(self.root), "")

    def test_malformed_records_fail_instead_of_creating_broken_shortcuts(self) -> None:
        cases = (
            {}, None, "site", [None], ["site"],
            [{"target": "#hobby-top"}],
            [{"name": "Hobbies"}],
            [{"name": "  ", "target": "#hobby-top"}],
            [{"name": 42, "target": "#hobby-top"}],
            [{"name": "Hobbies", "target": "#hobby-top", "typo": "ignored"}],
            [{"name": "Hobbies", "target": "#hobby-top", "feature": "unknown"}],
            [{"name": "Hobbies", "target": "#hobby-top", "feature": []}],
        )
        for data in cases:
            with self.subTest(data=data):
                self.write_catalogue(data)
                with self.assertRaises(ValueError):
                    catalogue.render_shortcuts(self.root)

    def test_destinations_are_local_section_anchors(self) -> None:
        for target in ("javascript:alert(1)", "https://example.com", "//example.com", "hobby-top", "#", "#Uppercase", "#two words", '#bad" onclick="x', "#hobby-top\n", None):
            with self.subTest(target=target):
                self.write_catalogue([{"name": "Hobbies", "target": target}])
                with self.assertRaises(ValueError):
                    catalogue.render_shortcuts(self.root)

    def test_duplicate_destinations_are_rejected(self) -> None:
        self.write_catalogue([
            {"name": "Hobbies", "target": "#hobby-top"},
            {"name": "Duplicate", "target": "#hobby-top"},
        ])
        with self.assertRaises(ValueError):
            catalogue.render_shortcuts(self.root)

    def test_template_substitution_errors_are_reported_as_validation_errors(self) -> None:
        self.write_catalogue([{"name": "Hobbies", "target": "#hobby-top"}])
        for template in ('<a href="$target">$unknown</a>', '<a href="$target">${name</a>'):
            with self.subTest(template=template):
                (self.folder / "shortcut.html").write_text(template, encoding="utf-8")
                with self.assertRaises(ValueError):
                    catalogue.render_shortcuts(self.root)


if __name__ == "__main__":
    unittest.main()
