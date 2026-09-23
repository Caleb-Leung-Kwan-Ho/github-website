"""Render the My Websites catalogue as static, escaped directory links."""

from __future__ import annotations

from html import escape
import json
from pathlib import Path
import re
from string import Template


TARGET = re.compile(r"#[a-z][a-z0-9-]*")
THUMBNAIL = re.compile(r"images/(?:[a-zA-Z0-9_-]+/)*[a-zA-Z0-9_-]+\.(?:png|jpe?g|webp|gif|svg|avif)")
KNOWN_FEATURES = {"project-lab"}


def render_shortcuts(root: Path, *, enabled_features: frozenset[str] = frozenset()) -> str:
    folder = root / "sites/my-websites"
    entries = json.loads((folder / "websites.json").read_text(encoding="utf-8"))
    if not isinstance(entries, list):
        raise ValueError("My Websites websites.json must contain a list of websites")

    template = Template((folder / "shortcut.html").read_text(encoding="utf-8").rstrip("\n"))
    targets: set[str] = set()
    shortcuts: list[str] = []
    for index, entry in enumerate(entries, start=1):
        label = f"My Websites entry {index}"
        if not isinstance(entry, dict) or not {"name", "target"} <= entry.keys() or entry.keys() - {"name", "target", "feature", "description", "thumbnail", "topics"}:
            raise ValueError(f"{label} requires name and target; optional fields are feature, description, thumbnail, and topics")
        name, target = entry["name"], entry["target"]
        if not isinstance(name, str) or not name or name != name.strip():
            raise ValueError(f"{label} name must be nonempty text without surrounding whitespace")
        if not isinstance(target, str) or not TARGET.fullmatch(target):
            raise ValueError(f"{label} target must be a local fragment such as #hobby-top")
        if target in targets:
            raise ValueError(f"{label} repeats target {target}")
        targets.add(target)

        description = entry.get("description")
        if "description" in entry and (not isinstance(description, str) or not description or description != description.strip()):
            raise ValueError(f"{label} description must be nonempty text without surrounding whitespace")
        thumbnail = entry.get("thumbnail", "images/website-shortcut.svg")
        if not isinstance(thumbnail, str) or not THUMBNAIL.fullmatch(thumbnail):
            raise ValueError(f"{label} thumbnail must be an image path inside images/ without traversal or URL components")
        topics = entry.get("topics", [])
        if not isinstance(topics, list) or any(not isinstance(topic, str) or not topic or topic != topic.strip() for topic in topics):
            raise ValueError(f"{label} topics must be a list of nonempty text without surrounding whitespace")

        # Reuse the assembler's feature decision; the catalogue has no second enable flag.
        if "feature" in entry:
            feature = entry["feature"]
            if not isinstance(feature, str) or feature not in KNOWN_FEATURES:
                raise ValueError(f"{label} has an unknown feature")
            if feature not in enabled_features:
                continue
        try:
            rendered = template.substitute(
                name=escape(name, quote=True),
                target=escape(target, quote=True),
                thumbnail=escape(thumbnail, quote=True),
                description=f'<p class="website-description">{escape(description, quote=True)}</p>' if description else "",
                topics=f'<p class="website-topics">{escape(" · ".join(topics), quote=True)}</p>' if topics else "",
            )
            shortcuts.append("\n".join(line for line in rendered.splitlines() if line.strip()))
        except (KeyError, ValueError) as error:
            raise ValueError("My Websites shortcut.html may use only $name, $target, $thumbnail, $description, and $topics placeholders") from error
    return "\n".join(shortcuts)
