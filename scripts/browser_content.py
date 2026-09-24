"""Expand opted-in sites into the shared, static Internet Explorer window."""

from __future__ import annotations

from html import escape
from pathlib import Path
import re
from string import Template

from site_config import Site


BROWSER_WINDOW = re.compile(r"^([\t ]*)<!-- browser-window: ([a-z0-9]+(?:-[a-z0-9]+)*) -->$", re.MULTILINE)


def render_browser_windows(source: str, root: Path, sites: tuple[Site, ...]) -> str:
    configured = {site.folder: site for site in sites if site.browser}
    rendered: set[str] = set()
    template: Template | None = None

    def replace(match: re.Match[str]) -> str:
        nonlocal template
        indent, folder = match.groups()
        site = configured.get(folder)
        if site is None:
            raise ValueError(f"Browser window marker requires an active site with browser metadata: {folder}")
        if folder in rendered:
            raise ValueError(f"Duplicate browser window marker: {folder}")
        rendered.add(folder)
        if template is None:
            template = Template((root / "desktop/browser-window.html").read_text(encoding="utf-8").rstrip("\n"))
        browser = site.browser
        try:
            content = template.substitute(
                window_id=escape(browser.id, quote=True),
                title=escape(browser.title, quote=True),
                home_id=escape(browser.home_id, quote=True),
                site_folder=escape(site.folder, quote=True),
            )
        except (KeyError, ValueError) as error:
            raise ValueError("desktop/browser-window.html may use only $window_id, $title, $home_id, and $site_folder placeholders") from error
        return "\n".join(indent + line if line else line for line in content.split("\n"))

    output = BROWSER_WINDOW.sub(replace, source)
    if "<!-- browser-window" in output:
        raise ValueError("Unsupported or nested browser-window marker")
    return output
