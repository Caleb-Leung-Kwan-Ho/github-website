"""Validate and render the journal's canonical data and complete locale overlays."""

from __future__ import annotations

from datetime import date
from html import escape
import json
from pathlib import Path
import re
from string import Template
from urllib.parse import urlsplit

LOCALES = ("en", "ja", "zh-HK")
STATUSES = {"in-progress", "planned", "paused", "completed"}
MILESTONE_STATUSES = {"in-progress", "planned", "done"}
TEXT_FIELDS = ("title", "summary", "currentFocus", "nextStep", "currentBlocker")
EXCERPT_FIELDS = ("summary", "currentFocus", "nextStep")
UI_KEYS = set("""siteTitle windowTitle subtitle home projects updates roadmap currentWork
currentFocus nextStep currentBlocker links relatedProjects searchProjects searchPlaceholder
search status allStatuses clearFilters resultCount noResults noResultsFor selectedOutsideResults
noBlocker noLinks noUpdates noMilestones dateNotRecorded milestone personalHomepage backToPortfolio
myWebsites photoCredits photoSource photoLicense photoBy photoChanges language projectNavigation
sectionNavigation projectResults selectedProject photoStrip skipToProjects skipToCurrentWork
showDetails featured""".split())
SLUG = re.compile(r"[a-z][a-z0-9]*(?:-[a-z0-9]+)*\Z")
PHOTO_PATH = re.compile(r"images/project-journal/[a-z0-9-]+\.jpg\Z")
PROJECT_KEYS = set(TEXT_FIELDS) | {"id", "status", "featured", "relatedProjectIds", "milestones", "updates", "links"}
# Reserve both page anchors and IDs supplied by the shared browser frame.
FIXED_IDS = {"project-journal"} | {f"project-journal-{suffix}" for suffix in (
    "title", "window", "window-title", "favorites", "favorites-title", "projects", "projects-title",
    "current-work", "search", "status", "credits", "credits-title", "language", "updates", "roadmap",
)}


def record(value: object, location: str, keys: set[str] | None = None) -> dict:
    if not isinstance(value, dict):
        raise ValueError(f"{location} must be an object")
    if keys is not None and set(value) != keys:
        raise ValueError(f"{location} has missing or unsupported fields")
    return value


def text(value: object, location: str) -> str:
    if not isinstance(value, str) or not value or value != value.strip() or any(ord(char) < 32 for char in value):
        raise ValueError(f"{location} must be nonempty plain text without surrounding whitespace or control characters")
    return value


def sequence(value: object, location: str) -> list:
    if not isinstance(value, list):
        raise ValueError(f"{location} must be a list")
    return value


def slug(value: object, location: str) -> str:
    if not isinstance(value, str) or not SLUG.fullmatch(value):
        raise ValueError(f"{location} must be a lowercase ASCII slug")
    return value


def https(value: object, location: str) -> str:
    url = text(value, location)
    if any(char.isspace() for char in url) or "\\" in url:
        raise ValueError(f"{location} must be an ordinary HTTPS URL")
    try:
        parts = urlsplit(url)
        port = parts.port
        if parts.scheme != "https" or not parts.hostname or parts.username is not None or parts.password is not None or parts.netloc.endswith(":") or port == 0:
            raise ValueError
    except ValueError as error:
        raise ValueError(f"{location} must be an ordinary HTTPS URL without credentials") from error
    return url


def validate_projects(data: object) -> list[dict]:
    catalogue = record(data, "Journal", {"schemaVersion", "projects"})
    if type(catalogue["schemaVersion"]) is not int or catalogue["schemaVersion"] != 1:
        raise ValueError("Unsupported journal schemaVersion; expected 1")
    projects = sequence(catalogue["projects"], "projects")
    if not projects:
        raise ValueError("The journal requires at least one project")
    ids: set[str] = set()
    dom_ids = set(FIXED_IDS)

    def reserve(value: str) -> None:
        if value in dom_ids:
            raise ValueError(f"Duplicate generated journal DOM ID: {value}")
        dom_ids.add(value)

    for index, item in enumerate(projects):
        project = record(item, f"projects[{index}]", PROJECT_KEYS)
        project_id = slug(project["id"], f"projects[{index}].id")
        if project_id in ids:
            raise ValueError(f"Duplicate project ID: {project_id}")
        ids.add(project_id)
        base = f"project-journal-{project_id}"
        for suffix in ("", "-title", "-current-work-title", "-updates", "-updates-title", "-roadmap", "-roadmap-title", "-blocker-title", "-links-title", "-related-title"):
            reserve(base + suffix)
        for field in TEXT_FIELDS:
            if field != "currentBlocker" or project[field] is not None:
                text(project[field], f"{project_id}.{field}")
        if not isinstance(project["status"], str) or project["status"] not in STATUSES:
            raise ValueError(f"{project_id}.status is unsupported")
        if type(project["featured"]) is not bool:
            raise ValueError(f"{project_id}.featured must be boolean")
        related = sequence(project["relatedProjectIds"], f"{project_id}.relatedProjectIds")
        for related_id in related:
            slug(related_id, f"{project_id}.relatedProjectIds")
        if len(set(related)) != len(related) or project_id in related:
            raise ValueError(f"{project_id} has duplicate or self-referencing related projects")
        for kind in ("milestones", "updates"):
            seen: set[str] = set()
            for item in sequence(project[kind], f"{project_id}.{kind}"):
                entry = record(item, f"{project_id}.{kind}")
                expected = {"id", "title", "status"} if kind == "milestones" else {"id", "date", "text"}
                if kind == "milestones" and "description" in entry:
                    expected.add("description")
                if kind == "updates" and "isNew" in entry:
                    expected.add("isNew")
                record(entry, f"{project_id}.{kind}", expected)
                entry_id = slug(entry["id"], f"{project_id}.{kind}.id")
                if entry_id in seen:
                    raise ValueError(f"Duplicate {kind} ID in {project_id}: {entry_id}")
                seen.add(entry_id)
                reserve(f"{base}-{'milestone' if kind == 'milestones' else 'update'}-{entry_id}")
                if kind == "milestones":
                    text(entry["title"], f"{project_id}.{kind}.{entry_id}.title")
                    if not isinstance(entry["status"], str) or entry["status"] not in MILESTONE_STATUSES:
                        raise ValueError(f"{project_id}.{kind}.{entry_id}.status is unsupported")
                    if "description" in entry:
                        text(entry["description"], f"{project_id}.{kind}.{entry_id}.description")
                else:
                    text(entry["text"], f"{project_id}.{kind}.{entry_id}.text")
                    if "isNew" in entry and type(entry["isNew"]) is not bool:
                        raise ValueError(f"{project_id}.{kind}.{entry_id}.isNew must be boolean")
                    stamp = entry["date"]
                    if stamp is not None:
                        try:
                            if not isinstance(stamp, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", stamp):
                                raise ValueError
                            date.fromisoformat(stamp)
                        except ValueError as error:
                            raise ValueError(f"{project_id}.{kind}.{entry_id}.date must be a valid YYYY-MM-DD or null") from error
        links: set[str] = set()
        for item in sequence(project["links"], f"{project_id}.links"):
            link = record(item, f"{project_id}.links", {"label", "url"})
            text(link["label"], f"{project_id}.links.label")
            url = https(link["url"], f"{project_id}.links.url")
            if url in links:
                raise ValueError(f"{project_id} has duplicate link URLs")
            links.add(url)
    if sum(project["featured"] for project in projects) > 1:
        raise ValueError("Only one journal project may be featured")
    for project in projects:
        if set(project["relatedProjectIds"]) - ids:
            raise ValueError(f"{project['id']} refers to an unknown related project")
    return projects


def project_overlay(project: dict) -> dict:
    return {**{field: project[field] for field in TEXT_FIELDS},
            "milestones": {item["id"]: {field: item[field] for field in ("title", "description") if field in item} for item in project["milestones"]},
            "updates": {item["id"]: {"text": item["text"]} for item in project["updates"]},
            "linkLabels": {item["url"]: item["label"] for item in project["links"]}}


def validate_overlay(actual: object, expected: object, location: str) -> None:
    if isinstance(expected, dict):
        actual = record(actual, location, set(expected))
        for key, value in expected.items():
            validate_overlay(actual[key], value, f"{location}.{key}")
    elif expected is None:
        if actual is not None:
            raise ValueError(f"{location} must preserve null")
    else:
        text(actual, location)
        if set(re.findall(r"\{[^{}]+\}", actual)) != set(re.findall(r"\{[^{}]+\}", expected)):
            raise ValueError(f"{location} must preserve interpolation placeholders")


def validate_locales(locales: object, projects: list[dict], photos: list[dict]) -> dict:
    locales = record(locales, "locales", set(LOCALES))
    baseline = {project["id"]: project_overlay(project) for project in projects}
    for locale in LOCALES:
        overlay = record(locales[locale], locale, {"locale", "languageName", "ui", "statuses", "photos", "projects"})
        if overlay["locale"] != locale:
            raise ValueError(f"{locale}.locale must match its filename")
        text(overlay["languageName"], f"{locale}.languageName")
        ui = record(overlay["ui"], f"{locale}.ui", UI_KEYS)
        for key, value in ui.items():
            text(value, f"{locale}.ui.{key}")
            expected = {"{count}"} if key == "resultCount" else {"{query}"} if key == "noResultsFor" else set()
            if set(re.findall(r"\{[^{}]+\}", value)) != expected:
                raise ValueError(f"{locale}.ui.{key} must preserve interpolation placeholders")
        labels = record(overlay["statuses"], f"{locale}.statuses", STATUSES)
        for key, value in labels.items():
            text(value, f"{locale}.statuses.{key}")
        photo_text = record(overlay["photos"], f"{locale}.photos", {photo["id"] for photo in photos})
        for photo_id, values in photo_text.items():
            record(values, f"{locale}.photos.{photo_id}", {"caption", "alt"})
            for key, value in values.items():
                text(value, f"{locale}.photos.{photo_id}.{key}")
        validate_overlay(overlay["projects"], baseline, f"{locale}.projects")
    if locales["en"]["projects"] != baseline:
        raise ValueError("English project translations must match canonical English project content")
    return locales


def read_json(folder: Path, name: str) -> object:
    source = (folder / name).resolve()
    if not source.is_relative_to(folder.resolve()):
        raise ValueError(f"Journal data must stay inside {folder.name}/")
    return json.loads(source.read_text(encoding="utf-8"))


def validate_excerpts(excerpts: object, projects: list[dict]) -> dict:
    excerpts = record(excerpts, "excerpts", set(LOCALES))
    project_ids = {project["id"] for project in projects}
    for locale in LOCALES:
        summaries = record(excerpts[locale], f"excerpts.{locale}", project_ids)
        for project in projects:
            location = f"excerpts.{locale}.{project['id']}"
            values = record(summaries[project["id"]], location, set(EXCERPT_FIELDS) | {"updates"})
            for key in EXCERPT_FIELDS:
                text(values[key], f"{location}.{key}")
            updates = record(values["updates"], f"{location}.updates", {entry["id"] for entry in project["updates"]})
            for update_id, value in updates.items():
                text(value, f"{location}.updates.{update_id}")
    return excerpts


def load_excerpts(root: Path, projects: list[dict]) -> dict:
    return validate_excerpts(read_json(root / "sites/project-journal", "excerpts.json"), projects)


def load_journal(root: Path) -> tuple[list[dict], dict, list[dict]]:
    folder = root / "sites/project-journal"
    projects = validate_projects(read_json(folder, "projects.json"))
    photo_folder = root / "images/project-journal"
    manifest = record(read_json(photo_folder, "photos.json"), "Photo manifest")
    photos = sequence(manifest.get("photos"), "photos")
    if len(photos) != 3:
        raise ValueError("The journal header requires its three credited photographs")
    photo_ids: set[str] = set()
    for order, photo in enumerate(photos, start=1):
        record(photo, "photo")
        photo_id = slug(photo.get("id"), "photo.id")
        if photo_id in photo_ids or type(photo.get("headerOrder")) is not int or photo["headerOrder"] != order:
            raise ValueError("Photo IDs and header ordering must be unique")
        photo_ids.add(photo_id)
        for key in ("title", "creator", "license"):
            text(photo.get(key), f"photo.{key}")
        for key in ("sourceUrl", "creatorUrl", "licenseUrl"):
            https(photo.get(key), f"photo.{key}")
        path = photo.get("suggestedRepoPath")
        if not isinstance(path, str) or not PHOTO_PATH.fullmatch(path):
            raise ValueError("Photo paths must be local JPEGs inside images/project-journal/")
        source = (root / path).resolve()
        if not source.is_relative_to(photo_folder.resolve()) or not source.is_file():
            raise ValueError("Photo files must stay inside images/project-journal/ and exist")
        for key in ("width", "height"):
            if type(photo.get(key)) is not int or photo[key] <= 0:
                raise ValueError(f"photo.{key} must be a positive integer")
    locales = validate_locales({locale: read_json(folder, f"locales/{locale}.json") for locale in LOCALES}, projects, photos)
    return projects, locales, photos


def render_translations(root: Path) -> str:
    projects, locales, _ = load_journal(root)
    excerpts = load_excerpts(root, projects)
    # A module is generated, never an executable JSON script element or fetched JSON.
    def encoded(value: object) -> str:
        return json.dumps(value, ensure_ascii=False, indent=2).replace("<", "\\u003c").replace(">", "\\u003e").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    return ("// Generated by scripts/build_site.py; edit projects.json, excerpts.json, and locales/*.json.\n"
            f"export const JOURNAL_LOCALES = {encoded(locales)};\n\n"
            f"export const JOURNAL_PROJECTS = {encoded(projects)};\n\n"
            f"export const JOURNAL_EXCERPTS = {encoded(excerpts)};\n")


def render_journal(root: Path) -> str:
    projects, locales, photos = load_journal(root)
    excerpts = load_excerpts(root, projects)["en"]
    english = locales["en"]
    ui = english["ui"]
    featured = next((project for project in projects if project["featured"]), projects[0])
    e = escape
    templates = root / "sites/project-journal/templates"

    def template(name: str, values: dict) -> str:
        source = (templates / name).resolve()
        if not source.is_relative_to(templates.resolve()):
            raise ValueError("Journal templates must stay inside templates/")
        try:
            return Template(source.read_text(encoding="utf-8").rstrip("\n")).substitute(values)
        except (KeyError, ValueError) as error:
            raise ValueError(f"Unsupported placeholder in journal template {name}") from error

    def label(key: str) -> str:
        return f'<span data-journal-text="{key}">{e(ui[key])}</span>'

    def field(project: dict, key: str, *, kind: str | None = None, item: dict | None = None) -> str:
        value = item[key] if item is not None else project[key]
        extra = f' data-journal-{kind}="{e(item["id"])}"' if item is not None else ""
        return f'<span data-journal-project="{e(project["id"])}" data-journal-field="{key}"{extra}>{e(value)}</span>'

    def status(value: str) -> str:
        key = "completed" if value == "done" else value
        return f'<span class="journal-status" data-journal-status="{key}">{e(english["statuses"][key])}</span>'

    def excerpt(project: dict, key: str, update: dict | None = None) -> str:
        values = excerpts[project["id"]]
        value = values["updates"][update["id"]] if update is not None else values[key]
        extra = f' data-journal-update="{e(update["id"])}"' if update is not None else ""
        return f'<span data-journal-project="{e(project["id"])}" data-journal-excerpt="{key}"{extra}>{e(value)}</span>'

    labels = {key: label(key) for key in ui}
    attributes = {f"{key}Attribute": e(value) for key, value in ui.items()}
    photo_strip, credits = [], []
    for photo in photos:
        photo_id = photo["id"]
        strings = english["photos"][photo_id]
        photo_strip += [
            '        <figure class="journal-photo">',
            f'          <img src="{e(photo["suggestedRepoPath"])}" width="{photo["width"]}" height="{photo["height"]}" alt="{e(strings["alt"])}" data-journal-photo="{photo_id}" loading="lazy" />',
            f'          <figcaption data-journal-photo-caption="{photo_id}">{e(strings["caption"])}</figcaption>',
            '        </figure>',
        ]
        credits.append(f'      <li><a href="{e(photo["sourceUrl"])}" target="_blank" rel="noopener noreferrer">{e(photo["title"])}</a> — {label("photoBy")} <a href="{e(photo["creatorUrl"])}" target="_blank" rel="noopener noreferrer">{e(photo["creator"])}</a> · {label("photoLicense")}: <a href="{e(photo["licenseUrl"])}" target="_blank" rel="noopener noreferrer">{e(photo["license"])}</a></li>')
    language_buttons = [f'        <button type="button" lang="{locale}" data-journal-language="{locale}" aria-pressed="{"true" if locale == "en" else "false"}">{e(locales[locale]["languageName"])}</button>' for locale in LOCALES]
    status_options = [f'          <option value="{key}" data-journal-status="{key}">{e(english["statuses"][key])}</option>' for key in ("in-progress", "planned", "paused", "completed")]
    project_list = []
    for project in projects:
        project_id = project["id"]
        project_list += [f'        <li data-journal-row="{project_id}">', f'          <a class="journal-project-link" href="#project-journal-{project_id}" data-journal-select="{project_id}">', f'            <span class="journal-project-name">{field(project, "title")}</span>', f'            {status(project["status"])}', '          </a>', '        </li>']
    project_by_id = {project["id"]: project for project in projects}
    details = []
    for project in projects:
        base = f'project-journal-{project["id"]}'
        update_list = []
        if project["updates"]:
            update_list.append('              <ol class="journal-update-list">')
            for update in project["updates"]:
                stamp = f'<time datetime="{update["date"]}">{update["date"]}</time> ' if update["date"] else ""
                badge = '<span class="journal-new" lang="en">NEW</span> ' if update.get("isNew", False) else ""
                update_list += [f'                <li id="{base}-update-{update["id"]}">',
                                '                  <details class="journal-update">',
                                f'                    <summary>{badge}{stamp}{excerpt(project, "update", update)}</summary>',
                                f'                    <p>{field(project, "text", kind="update", item=update)}</p>',
                                '                  </details>', '                </li>']
            update_list.append('              </ol>')
        else:
            update_list.append(f'              <p>{label("noUpdates")}</p>')
        if project["milestones"]:
            rows = []
            for milestone in project["milestones"]:
                title = field(project, "title", kind="milestone", item=milestone)
                content = f'<details class="journal-milestone"><summary>{title}</summary><p>{field(project, "description", kind="milestone", item=milestone)}</p></details>' if "description" in milestone else title
                rows.append(f'                  <tr id="{base}-milestone-{milestone["id"]}"><th scope="row">{content}</th><td>{status(milestone["status"])}</td></tr>')
            roadmap = template("roadmap.html", {**labels, "milestoneRows": "\n".join(rows)})
        else:
            roadmap = f'              <p>{label("noMilestones")}</p>'
        links = []
        if project["links"]:
            links.append('              <ul>')
            for link in project["links"]:
                links.append(f'                <li><a href="{e(link["url"])}" target="_blank" rel="noopener noreferrer" data-journal-project="{project["id"]}" data-journal-link="{e(link["url"])}">{e(link["label"])}</a></li>')
            links.append('              </ul>')
        else:
            links.append(f'              <p>{label("noLinks")}</p>')
        related = ""
        if project["relatedProjectIds"]:
            related_links = [f'              <li><a href="#project-journal-{related_id}" data-journal-select="{related_id}">{field(project_by_id[related_id], "title")}</a></li>' for related_id in project["relatedProjectIds"]]
            related = template("related.html", {**labels, "base": base, "relatedLinks": "\n".join(related_links)})
        details.append(template("project.html", {
            **labels, "base": base, "projectId": project["id"],
            "projectTitle": field(project, "title"), "projectStatus": status(project["status"]),
            "projectSummary": field(project, "summary"), "projectFocus": field(project, "currentFocus"),
            "projectNextStep": field(project, "nextStep"),
            "summaryExcerpt": excerpt(project, "summary"), "focusExcerpt": excerpt(project, "currentFocus"),
            "nextStepExcerpt": excerpt(project, "nextStep"),
            "projectBlocker": field(project, "currentBlocker") if project["currentBlocker"] is not None else label("noBlocker"),
            "updateList": "\n".join(update_list), "roadmapContent": roadmap,
            "projectLinks": "\n".join(links), "relatedProjectsContent": related,
        }))
    return template("page.html", {
        **labels, **attributes, "featuredId": featured["id"], "photoStripMarkup": "\n".join(photo_strip),
        "languageButtons": "\n".join(language_buttons), "statusOptions": "\n".join(status_options),
        "resultCountText": e(ui["resultCount"].replace("{count}", str(len(projects)))),
        "projectList": "\n".join(project_list), "projectDetails": "\n".join(details),
        "photoCreditsList": "\n".join(credits),
    })
