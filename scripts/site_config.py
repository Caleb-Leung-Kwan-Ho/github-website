"""The ordered site list used by the static page and its browser assets."""

from __future__ import annotations

from dataclasses import dataclass
import re
from typing import Mapping


@dataclass(frozen=True)
class Site:
    folder: str
    factory: str
    enabled: bool = True
    feature_gate: str | None = None

    def __post_init__(self) -> None:
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", self.folder):
            raise ValueError(f"Invalid site folder: {self.folder}")
        if not re.fullmatch(r"[A-Za-z_$][A-Za-z0-9_$]*", self.factory):
            raise ValueError(f"Invalid site factory: {self.factory}")
        if type(self.enabled) is not bool:
            raise ValueError(f"Site enabled flag must be boolean: {self.folder}")
        if self.feature_gate is not None and not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", self.feature_gate):
            raise ValueError(f"Invalid site feature gate: {self.folder}")


# Keep portfolio first: it supplies the desktop's default destination.
# Archived Project Lab sources must return to sites/projects before enabling it.
SITES = (
    Site("portfolio", "createPortfolioSite"),
    Site("hobbies", "createHobbiesSite"),
    Site("projects", "createProjectsSite", enabled=False, feature_gate="project-lab"),
    Site("my-websites", "createWebsitesSite"),
)


def active_sites(overrides: Mapping[str, bool] | None = None) -> tuple[Site, ...]:
    if not SITES or SITES[0].folder != "portfolio":
        raise ValueError("Portfolio must be the first site")
    if len({site.folder for site in SITES}) != len(SITES):
        raise ValueError("Site folders must be unique")
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
