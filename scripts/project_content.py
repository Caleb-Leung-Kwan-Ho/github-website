"""Validate Project Lab's build-time data and render its complete static catalogue."""

from __future__ import annotations

from datetime import date
from html import escape
import json
from pathlib import Path
import re
from urllib.parse import urlsplit


PROJECT_STATUSES = {
    "planned": "Planned",
    "in-progress": "In progress",
    "paused": "Paused",
    "completed": "Completed",
    "archived": "Archived",
}
MILESTONE_STATUSES = {"planned": "Planned", "in-progress": "In progress", "done": "Done"}
SLUG = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*\Z")
ISO_DATE = re.compile(r"\d{4}-\d{2}-\d{2}\Z")


def require_text(value: object, location: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{location} must be nonempty text")
    return value


def require_list(value: object, location: str) -> list:
    if not isinstance(value, list):
        raise ValueError(f"{location} must be a list")
    return value


def require_record(value: object, location: str) -> dict:
    if not isinstance(value, dict):
        raise ValueError(f"{location} must be an object")
    return value


def require_slug(value: object, location: str) -> str:
    if not isinstance(value, str) or not SLUG.fullmatch(value):
        raise ValueError(f"{location} must be a lowercase slug")
    return value


def require_status(value: object, supported: dict[str, str], location: str) -> None:
    if not isinstance(value, str) or value not in supported:
        raise ValueError(f"{location} is not a supported status")


def require_https(value: object, location: str) -> None:
    url = require_text(value, location)
    # Reject browser URL repairs, credentials, and control characters before parsing.
    if any(character.isspace() or ord(character) < 32 for character in url) or "\\" in url:
        raise ValueError(f"{location} must be an ordinary HTTPS URL")
    try:
        parsed = urlsplit(url)
        port = parsed.port
        valid = parsed.scheme == "https" and parsed.hostname and parsed.username is None and parsed.password is None
        if not valid or parsed.netloc.endswith(":") or port == 0:
            raise ValueError
    except ValueError as error:
        raise ValueError(f"{location} must be an ordinary HTTPS URL without credentials") from error


def validate_catalogue(data: object) -> list[dict]:
    catalogue = require_record(data, "Catalogue")
    if type(catalogue.get("schemaVersion")) is not int or catalogue["schemaVersion"] != 1:
        raise ValueError("Unsupported project schemaVersion; expected 1")
    projects = require_list(catalogue.get("projects"), "projects")
    project_ids: set[str] = set()
    # Include headings and fixed targets so otherwise valid slugs cannot collide in HTML.
    dom_ids = {"project-search", "project-status", "project-lab-updates", "project-lab-updates-title"}

    def add_dom_id(value: str) -> None:
        if value in dom_ids:
            raise ValueError(f"Duplicate generated DOM ID: {value}")
        dom_ids.add(value)

    for index, item in enumerate(projects):
        project = require_record(item, f"projects[{index}]")
        slug = require_slug(project.get("id"), f"projects[{index}].id")
        if slug in project_ids:
            raise ValueError(f"Duplicate project ID: {slug}")
        project_ids.add(slug)
        base = f"project-lab-{slug}"
        for suffix in ("", "-title", "-roadmap-title"):
            add_dom_id(base + suffix)
        for field in ("title", "summary", "currentFocus", "nextStep"):
            require_text(project.get(field), f"{slug}.{field}")
        require_status(project.get("status"), PROJECT_STATUSES, f"{slug}.status")
        if type(project.get("featured", False)) is not bool:
            raise ValueError(f"{slug}.featured must be a boolean")
        if project.get("currentBlocker") is not None:
            require_text(project["currentBlocker"], f"{slug}.currentBlocker")

        related = require_list(project.get("relatedProjectIds", []), f"{slug}.relatedProjectIds")
        seen_related: set[str] = set()
        for related_id in related:
            require_slug(related_id, f"{slug}.relatedProjectIds")
            if related_id == slug or related_id in seen_related:
                raise ValueError(f"{slug} has a self-reference or duplicate related project")
            seen_related.add(related_id)

        for kind in ("milestones", "updates"):
            seen_ids: set[str] = set()
            for item in require_list(project.get(kind, []), f"{slug}.{kind}"):
                record = require_record(item, f"{slug}.{kind}")
                item_id = require_slug(record.get("id"), f"{slug}.{kind}.id")
                if item_id in seen_ids:
                    raise ValueError(f"Duplicate {kind} ID in {slug}: {item_id}")
                seen_ids.add(item_id)
                add_dom_id(f"{base}-{'milestone' if kind == 'milestones' else 'update'}-{item_id}")
                if kind == "milestones":
                    require_text(record.get("title"), f"{slug}.{kind}.{item_id}.title")
                    require_status(record.get("status"), MILESTONE_STATUSES, f"{slug}.{kind}.{item_id}.status")
                    if record.get("description") is not None:
                        require_text(record["description"], f"{slug}.{kind}.{item_id}.description")
                else:
                    require_text(record.get("text"), f"{slug}.{kind}.{item_id}.text")
                    update_date = record.get("date")
                    if update_date is not None:
                        if not isinstance(update_date, str) or not ISO_DATE.fullmatch(update_date):
                            raise ValueError(f"{slug}.{kind}.{item_id}.date must be YYYY-MM-DD or null")
                        try:
                            date.fromisoformat(update_date)
                        except ValueError as error:
                            raise ValueError(f"{slug}.{kind}.{item_id}.date is not a valid calendar date") from error

        for item in require_list(project.get("links", []), f"{slug}.links"):
            link = require_record(item, f"{slug}.links")
            require_text(link.get("label"), f"{slug}.links.label")
            require_https(link.get("url"), f"{slug}.links.url")

    for project in projects:
        for related_id in project.get("relatedProjectIds", []):
            if related_id not in project_ids:
                raise ValueError(f"{project['id']} refers to unknown related project: {related_id}")
    return projects


def status_badge(status: str, labels: dict[str, str]) -> str:
    return f'<span class="project-status" data-status="{escape(status)}">{escape(labels[status])}</span>'


def update_note(update: dict) -> str:
    stamp = update.get("date")
    date_markup = f'<time datetime="{escape(stamp)}">{escape(stamp)}</time> ' if stamp else ""
    return date_markup + escape(update["text"])


def render_projects(data: object) -> str:
    """Render only validated text; browser enhancements use the resulting DOM."""
    projects = validate_catalogue(data)
    titles = {project["id"]: project["title"] for project in projects}
    count = len(projects)
    lines = [
        '<details class="project-browser" data-project-browser data-project-library open>',
        '  <summary>Project library</summary>',
        '  <div class="project-filters" hidden>',
        '    <label for="project-search">Search projects</label>',
        '    <input id="project-search" type="search" placeholder="Title or summary" data-project-search-input>',
        '    <label for="project-status">Status</label>',
        '    <select id="project-status" data-project-status-select>',
        f'      <option value="all" data-project-status-count="{count}">All</option>',
    ]
    for status, label in PROJECT_STATUSES.items():
        status_count = sum(project["status"] == status for project in projects)
        lines.append(f'      <option value="{status}" data-project-status-count="{status_count}">{label}</option>')
    lines += [
        '    </select>',
        '  </div>',
        f'  <p class="project-result-count" data-project-count aria-live="polite" hidden>{count} {"project" if count == 1 else "projects"}</p>',
        '  <ul class="project-list">',
    ]
    for project in projects:
        slug = project["id"]
        search = escape(f"{project['title']} {project['summary']}")
        featured = "true" if project.get("featured", False) else "false"
        lines += [
            '    <li data-project-row>',
            f'      <a class="project-link" href="#project-lab-{slug}" data-project-link data-project-id="{slug}" data-project-status="{project["status"]}" data-project-search="{search}" data-project-featured="{featured}">',
            f'        <span class="project-name">{escape(project["title"])}</span>',
            f'        {status_badge(project["status"], PROJECT_STATUSES)}',
            '      </a>',
            '    </li>',
        ]
    lines += [
        '  </ul>',
        '  <div class="project-empty" data-project-empty hidden>',
        '    <p>No projects match your search and status.</p>',
        '    <button type="button" data-project-reset>Reset filters</button>',
        '  </div>',
        '</details>',
        '<div class="project-detail" data-project-detail>',
    ]
    for project in projects:
        slug = project["id"]
        base = f"project-lab-{slug}"
        lines += [
            f'  <article class="project-panel" id="{base}" data-project-panel data-project-id="{slug}" aria-labelledby="{base}-title">',
            '    <header class="project-panel-header">',
            f'      <h2 class="project-title" id="{base}-title">{escape(project["title"])}</h2>',
            f'      {status_badge(project["status"], PROJECT_STATUSES)}',
            '    </header>',
            f'    <p class="project-summary">{escape(project["summary"])}</p>',
            '    <dl class="project-facts">',
        ]
        for field, label in (("currentFocus", "Current focus"), ("nextStep", "Next step"), ("currentBlocker", "Current blocker")):
            if project.get(field) is not None:
                lines.append(f'      <div><dt>{label}</dt><dd>{escape(project[field])}</dd></div>')
        lines.append('    </dl>')
        updates = project.get("updates", [])
        if updates:
            # Undated notes describe current work; retain supplied order within that group.
            latest = next((update for update in reversed(updates) if not update.get("date")), None)
            if latest is None:
                latest = max(updates, key=lambda update: update["date"])
            lines += ['    <div class="project-current-note">', '      <h3>Current note</h3>', f'      <p>{update_note(latest)}</p>', '    </div>']
        lines += [f'    <section class="project-roadmap" aria-labelledby="{base}-roadmap-title">', f'      <h3 id="{base}-roadmap-title">Roadmap</h3>']
        milestones = project.get("milestones", [])
        if milestones:
            lines.append('      <ol class="project-milestones">')
            for milestone in milestones:
                lines.append(f'        <li class="project-milestone" id="{base}-milestone-{milestone["id"]}" data-milestone-status="{milestone["status"]}">')
                heading = status_badge(milestone["status"], MILESTONE_STATUSES) + f' <span class="project-milestone-title">{escape(milestone["title"])}</span>'
                if milestone.get("description"):
                    lines += ['          <details>', f'            <summary class="project-milestone-heading">{heading}</summary>', f'            <p>{escape(milestone["description"])}</p>', '          </details>']
                else:
                    lines.append(f'          <div class="project-milestone-heading">{heading}</div>')
                lines.append('        </li>')
            lines.append('      </ol>')
        else:
            lines.append('      <p>Roadmap not yet published.</p>')
        lines.append('    </section>')
        if project.get("links"):
            lines += ['    <h3>Public links</h3>', '    <ul class="project-links">']
            for link in project["links"]:
                lines.append(f'      <li><a href="{escape(link["url"])}" target="_blank" rel="noopener noreferrer">{escape(link["label"])}</a></li>')
            lines.append('    </ul>')
        if project.get("relatedProjectIds"):
            lines += ['    <div class="project-related">', '      <h3>Related work</h3>', '      <ul class="project-links">']
            for related_id in project["relatedProjectIds"]:
                lines.append(f'        <li><a href="#project-lab-{related_id}">{escape(titles[related_id])}</a></li>')
            lines += ['      </ul>', '    </div>']
        lines.append('  </article>')

    browse_target = f'project-lab-{projects[0]["id"]}' if projects else "project-lab"
    lines += ['  <section class="project-panel" id="project-lab-updates" data-project-updates aria-labelledby="project-lab-updates-title">', '    <h2 id="project-lab-updates-title">Project updates</h2>', f'    <p><a href="#{browse_target}">Back to project browsing</a></p>']
    notes = [(project, update) for project in projects for update in project.get("updates", [])]
    dated = sorted((note for note in notes if note[1].get("date")), key=lambda note: note[1]["date"], reverse=True)
    undated = [note for note in notes if not note[1].get("date")]
    for heading, group in (("Dated updates", dated), ("Current / undated notes", undated)):
        if not group:
            continue
        lines += [f'    <h3>{heading}</h3>', '    <ol class="project-updates-list">']
        for project, update in group:
            base = f'project-lab-{project["id"]}'
            lines += [f'      <li class="project-update-entry" id="{base}-update-{update["id"]}">', f'        <a href="#{base}">{escape(project["title"])}</a>', f'        <p>{update_note(update)}</p>', '      </li>']
        lines.append('    </ol>')
    if not notes:
        lines.append('    <p>No updates published yet.</p>')
    lines += ['  </section>', '</div>']
    return "\n".join(lines)


def render_catalogue(root: Path) -> str:
    source = (root / "sites/projects/projects.json").resolve()
    if not source.is_relative_to((root / "sites/projects").resolve()):
        raise ValueError("Project catalogue must stay inside sites/projects/")
    return render_projects(json.loads(source.read_text(encoding="utf-8")))
