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
        self.folder = self.root / "sites/my-websites"
        self.folder.mkdir(parents=True)
        self.template = (REPOSITORY_ROOT / "sites/my-websites/shortcut.html").read_text(encoding="utf-8")
        (self.folder / "shortcut.html").write_text(self.template, encoding="utf-8")

    def write_catalogue(self, data: object) -> None:
        (self.folder / "websites.json").write_text(json.dumps(data), encoding="utf-8")

    def test_ten_sites_need_only_data_and_keep_one_shared_directory_template(self) -> None:
        data = [{"name": f"Website {number}", "target": f"#website-{number}"} for number in range(10)]
        self.write_catalogue(data)
        document = ShortcutHTML(catalogue.render_shortcuts(self.root))
        links = [attributes for tag, attributes in document.elements if tag == "a"]
        icons = [attributes for tag, attributes in document.elements if tag == "img"]
        self.assertEqual([link["href"] for link in links], [site["target"] for site in data])
        self.assertEqual([link["aria-label"] for link in links], [f'Open {site["name"]} website' for site in data])
        self.assertEqual([link["data-website-name"] for link in links], [site["name"] for site in data])
        self.assertEqual(len(icons), 10)
        self.assertTrue(all(icon["src"] == "images/website-shortcut.svg" and icon["alt"] == "" for icon in icons))
        self.assertFalse(any(attrs.get("class") in ("website-description", "website-topics") for _, attrs in document.elements))
        for site in data:
            self.assertIn(site["name"], document.text)
        self.assertEqual((self.folder / "shortcut.html").read_text(encoding="utf-8"), self.template)

    def test_names_preserve_unicode_and_escape_text_and_attributes(self) -> None:
        name = '日本語 & <img src=x onerror="alert(1)"> \'quoted\''
        self.write_catalogue([{"name": name, "target": "#hobby-top"}])
        source = catalogue.render_shortcuts(self.root)
        document = ShortcutHTML(source)
        links = [attributes for tag, attributes in document.elements if tag == "a"]
        self.assertEqual(links[0]["aria-label"], f"Open {name} website")
        self.assertEqual(links[0]["data-website-name"], name)
        self.assertIn(name, document.text)
        self.assertIn("&lt;img", source)
        self.assertEqual(sum(tag == "img" for tag, _ in document.elements), 1)
        self.assertFalse(any(key.startswith("on") for _, attributes in document.elements for key in attributes))

    def test_optional_directory_details_are_escaped_inside_one_link(self) -> None:
        description = 'Games & <img src=x onerror="alert(1)">'
        topics = ['Anime', '香港 & <script>example</script>']
        self.write_catalogue([{
            "name": "Personal Hobbies",
            "target": "#hobby-top",
            "description": description,
            "thumbnail": "images/websites/personal-hobbies.png",
            "topics": topics,
        }])
        source = catalogue.render_shortcuts(self.root)
        document = ShortcutHTML(source)
        images = [attrs for tag, attrs in document.elements if tag == "img"]
        self.assertEqual(len(images), 1)
        self.assertEqual(images[0]["src"], "images/websites/personal-hobbies.png")
        self.assertEqual((images[0]["width"], images[0]["height"]), ("320", "180"))
        self.assertEqual(sum(tag == "a" for tag, _ in document.elements), 1)
        self.assertEqual(sum(tag == "script" for tag, _ in document.elements), 0)
        self.assertIn(description, document.text)
        self.assertIn(" · ".join(topics), document.text)
        self.assertIn("&lt;script&gt;", source)

    def test_thumbnail_paths_stay_within_local_images(self) -> None:
        for thumbnail in (
            "https://example.com/image.png", "//example.com/image.png", "/images/image.png",
            "images/../image.png", "images/folder/../../image.png", "images/%2e%2e/image.png",
            "images/image.png?x=1", "images/image.svg#fragment", "images/image.html",
            "images/image.png\n", "images\\image.png", None,
        ):
            with self.subTest(thumbnail=thumbnail):
                self.write_catalogue([{"name": "Hobbies", "target": "#hobby-top", "thumbnail": thumbnail}])
                with self.assertRaises(ValueError):
                    catalogue.render_shortcuts(self.root)

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
            [{"name": "Hobbies", "target": "#hobby-top", "description": ""}],
            [{"name": "Hobbies", "target": "#hobby-top", "description": " padded "}],
            [{"name": "Hobbies", "target": "#hobby-top", "description": None}],
            [{"name": "Hobbies", "target": "#hobby-top", "topics": "Anime"}],
            [{"name": "Hobbies", "target": "#hobby-top", "topics": [""]}],
            [{"name": "Hobbies", "target": "#hobby-top", "topics": [" padded "]}],
            [{"name": "Hobbies", "target": "#hobby-top", "topics": [42]}],
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
