"""The ordered site list used by the static page and its browser assets."""

from __future__ import annotations

from dataclasses import dataclass
import re
from typing import Mapping


@dataclass(frozen=True)
class BrowserWindow:
    id: str
    title: str
    home_id: str

    def __post_init__(self) -> None:
        for name, value in (("id", self.id), ("home_id", self.home_id)):
            if not isinstance(value, str) or not re.fullmatch(r"[a-z][a-z0-9]*(?:-[a-z0-9]+)*", value):
                raise ValueError(f"Invalid browser window {name}: {value}")
        if not isinstance(self.title, str) or not self.title or self.title != self.title.strip() or any(ord(character) < 32 for character in self.title):
            raise ValueError("Browser window title must be nonempty text without surrounding whitespace or control characters")


@dataclass(frozen=True)
class Site:
    folder: str
    factory: str
    enabled: bool = True
    feature_gate: str | None = None
    browser: BrowserWindow | None = None

    def __post_init__(self) -> None:
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", self.folder):
            raise ValueError(f"Invalid site folder: {self.folder}")
        if not re.fullmatch(r"[A-Za-z_$][A-Za-z0-9_$]*", self.factory):
            raise ValueError(f"Invalid site factory: {self.factory}")
        if type(self.enabled) is not bool:
            raise ValueError(f"Site enabled flag must be boolean: {self.folder}")
        if self.feature_gate is not None and not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", self.feature_gate):
            raise ValueError(f"Invalid site feature gate: {self.folder}")
        if self.browser is not None and not isinstance(self.browser, BrowserWindow):
            raise ValueError(f"Site browser must be BrowserWindow metadata: {self.folder}")


# Keep portfolio first: it supplies the desktop's default destination.
# Archived Project Lab sources must return to sites/projects before enabling it.
SITES = (
    Site("portfolio", "createPortfolioSite"),
    Site("hobbies", "createHobbiesSite", browser=BrowserWindow("hobbies", "Personal Hobbies", "hobby-top")),
    Site("projects", "createProjectsSite", enabled=False, feature_gate="project-lab"),
    Site("my-websites", "createWebsitesSite", browser=BrowserWindow("websites", "My Websites", "websites")),
)


def active_sites(overrides: Mapping[str, bool] | None = None) -> tuple[Site, ...]:
    if not SITES or SITES[0].folder != "portfolio":
        raise ValueError("Portfolio must be the first site")
    if len({site.folder for site in SITES}) != len(SITES):
        raise ValueError("Site folders must be unique")
    browsers = [site.browser for site in SITES if site.browser]
    if len({browser.id for browser in browsers}) != len(browsers):
        raise ValueError("Browser window IDs must be unique")
    overrides = overrides or {}
    if set(overrides) - {site.folder for site in SITES}:
        raise ValueError("Unknown site override")
    selected = []
    for site in SITES:
        enabled = overrides.get(site.folder, site.enabled)
        if type(enabled) is not bool:
            raise ValueError(f"Site enabled flag must be boolean: {site.folder}")
        if not enabled and not site.feature_gate:
            raise ValueError(f"{site.folder} has no HTML feature gate; it cannot be disabled")
        if enabled:
            selected.append(site)
    return tuple(selected)
