"""Render My folder's website catalogue as static, escaped shortcut links."""

from __future__ import annotations

from html import escape
import json
from pathlib import Path
import re
from string import Template


TARGET = re.compile(r"#[a-z][a-z0-9-]*")
KNOWN_FEATURES = {"project-lab"}


def render_shortcuts(root: Path, *, enabled_features: frozenset[str] = frozenset()) -> str:
    folder = root / "sites/my-folder"
    entries = json.loads((folder / "websites.json").read_text(encoding="utf-8"))
    if not isinstance(entries, list):
        raise ValueError("My folder websites.json must contain a list of websites")

    template = Template((folder / "shortcut.html").read_text(encoding="utf-8").rstrip("\n"))
    targets: set[str] = set()
    shortcuts: list[str] = []
    for index, entry in enumerate(entries, start=1):
        label = f"My folder website {index}"
        if not isinstance(entry, dict) or not {"name", "target"} <= entry.keys() or entry.keys() - {"name", "target", "feature"}:
            raise ValueError(f"{label} requires name and target, with only an optional feature")
        name, target = entry["name"], entry["target"]
        if not isinstance(name, str) or not name or name != name.strip():
            raise ValueError(f"{label} name must be nonempty text without surrounding whitespace")
        if not isinstance(target, str) or not TARGET.fullmatch(target):
            raise ValueError(f"{label} target must be a local fragment such as #hobby-top")
        if target in targets:
            raise ValueError(f"{label} repeats target {target}")
        targets.add(target)

        # Reuse the assembler's feature decision; the catalogue has no second enable flag.
        if "feature" in entry:
            feature = entry["feature"]
            if not isinstance(feature, str) or feature not in KNOWN_FEATURES:
                raise ValueError(f"{label} has an unknown feature")
            if feature not in enabled_features:
                continue
        try:
            shortcuts.append(template.substitute(name=escape(name, quote=True), target=escape(target, quote=True)))
        except (KeyError, ValueError) as error:
            raise ValueError("My folder shortcut.html may use only $name and $target placeholders") from error
    return "\n".join(shortcuts)
