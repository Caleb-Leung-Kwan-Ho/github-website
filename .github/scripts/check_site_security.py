#!/usr/bin/env python3
"""Check the site's reviewed policy and report JavaScript review notes.

This dependency-free checker handles this repository's simple source formats.
It is a maintenance guardrail; it does not replace browser or source review.
"""

from __future__ import annotations

import json
import re
import shlex
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
# These are repository conventions, not claims that other architectures are unsafe.
EXPECTED_SCRIPT = "assets/js/main.js"

# Google Drive provides the resume image; Google Fonts provides only styles/fonts.
# The image redirect host belongs in CSP, even though it is absent from HTML source.
EXPECTED_HTML_SOURCE_ORIGINS = {"https://drive.google.com"}
APPROVED_HTML_RESOURCE_ORIGINS = {
    ("img", "src"): {"https://drive.google.com"},
}
EXPECTED_CSS_SOURCE_ORIGINS = {"https://fonts.googleapis.com"}

# Exact directive values keep policy changes deliberate; ordering is immaterial.
EXPECTED_CSP = {
    "default-src": {"'none'"},
    "base-uri": {"'none'"},
    "object-src": {"'none'"},
    "form-action": {"'none'"},
    "script-src": {"'self'"},
    "script-src-attr": {"'none'"},
    "style-src": {"'self'", "https://fonts.googleapis.com"},
    "style-src-attr": {"'none'"},
    "font-src": {"'self'", "https://fonts.gstatic.com"},
    "img-src": {
        "'self'",
        "data:",
        "https://drive.google.com",
        "https://lh3.googleusercontent.com",
    },
    "connect-src": {"'none'"},
    "frame-src": {"'none'"},
    "media-src": {"'none'"},
    "manifest-src": {"'none'"},
    "worker-src": {"'none'"},
}

# These patterns suggest places to review, not proven executable operations.
# Comments/strings can match, while aliases or computed calls can escape them.
# Keeping this advisory avoids maintaining an incomplete JavaScript parser.
JS_REVIEW_PATTERNS = (
    (re.compile(r"\beval\s*\("), "eval"),
    (re.compile(r"\bnew\s+Function\b|\bFunction\s*\("), "dynamic Function"),
    (re.compile(r"\bdocument\s*\.\s*write(?:ln)?\s*\("), "document.write"),
    (
        re.compile(
            r"(?:\.\s*(?:innerHTML|outerHTML)|"
            r"\[\s*['\"](?:innerHTML|outerHTML)['\"]\s*\])"
            r"\s*(?:\|\||&&|\?\?|[+\-*/%&|^])?="
        ),
        "HTML assignment",
    ),
    (re.compile(r"\binsertAdjacentHTML\s*\("), "insertAdjacentHTML"),
    (re.compile(r"\bcreateElement\s*\(\s*['\"]script['\"]\s*\)"), "dynamic script creation"),
    (
        re.compile(r"\bimport\s*(?:/\*.*?\*/\s*)?(?:\(|['\"{*]|[\w$]+\s+from\b)", re.DOTALL),
        "JavaScript import",
    ),
    (re.compile(r"\bfetch\s*\("), "fetch"),
    (re.compile(r"\bXMLHttpRequest\b"), "XMLHttpRequest"),
    (re.compile(r"\bWebSocket\s*\("), "WebSocket"),
    (re.compile(r"\bEventSource\s*\("), "EventSource"),
    (re.compile(r"\bsendBeacon\s*\("), "sendBeacon"),
    (re.compile(r"\bserviceWorker\s*\.\s*register\s*\("), "service-worker registration"),
)

# Tooling additions require an architectural decision under AGENTS.md. Finding a
# manifest is a repository-rule failure, not evidence of a vulnerability.
DISALLOWED_PROJECT_FILES = {
    "bower.json",
    "bun.lock",
    "bun.lockb",
    "composer.json",
    "composer.lock",
    "cargo.lock",
    "cargo.toml",
    "deno.json",
    "deno.jsonc",
    "docker-compose.yaml",
    "docker-compose.yml",
    "dockerfile",
    "gemfile",
    "gemfile.lock",
    "go.mod",
    "go.sum",
    "gradle.lockfile",
    "justfile",
    "makefile",
    "mix.exs",
    "mix.lock",
    "npm-shrinkwrap.json",
    "package-lock.json",
    "package.json",
    "pipfile",
    "pipfile.lock",
    "pnpm-lock.yaml",
    "pdm.lock",
    "poetry.lock",
    "pom.xml",
    "pyproject.toml",
    "requirements.txt",
    "setup.cfg",
    "setup.py",
    "tox.ini",
    "tsconfig.json",
    "uv.lock",
    "yarn.lock",
}
DISALLOWED_PROJECT_FILE_PATTERN = re.compile(
    r"^requirements(?:[-_.].+)?\.(?:in|txt)$",
    re.IGNORECASE,
)
DISALLOWED_BUILD_CONFIG = re.compile(
    r"^(?:astro\.config|babel\.config|eslint\.config|gulpfile|gruntfile|jest\.config|"
    r"next\.config|nuxt\.config|playwright\.config|postcss\.config|prettier\.config|"
    r"rollup\.config|svelte\.config|tailwind\.config|vite\.config|vitest\.config|"
    r"webpack\.config)\.",
    re.IGNORECASE,
)
CSS_REMOTE_REFERENCE = re.compile(
    r"(?P<kind>@import\s+(?:url\(\s*)?|url\(\s*)['\"]?"
    r"(?P<url>(?:(?:https?:)?//|https?:)[^\s'\"\)]+)",
    re.IGNORECASE,
)
CSS_IMAGE_SET = re.compile(r"(?:-webkit-)?image-set\((?P<body>[^)]*)\)", re.IGNORECASE)
CSS_ABSOLUTE_URL = re.compile(
    r"(?:(?:https?:)?//|https?:)[^\s'\",\)]+",
    re.IGNORECASE,
)
DOWNLOAD_COMMAND = re.compile(
    r"\b(?:curl|wget|npx|pipx|apt|apt-get|brew|corepack)\b|"
    r"\b(?:pip|pip3|npm|pnpm|yarn|bun|cargo|go)\s+(?:add|ci|get|install)\b",
    re.IGNORECASE,
)

# Checkout executes in CI, so changes to this reviewed full commit need review.
APPROVED_WORKFLOWS = {"security-invariants.yml"}
EXPECTED_ACTION_REFERENCE = "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1"


def origin_for(url: str) -> str | None:
    """Return a normalized HTTP origin, or a marker for protocol-relative URLs."""

    parsed = urlsplit(url.strip())
    if parsed.scheme.lower() in {"http", "https"} and parsed.netloc:
        return f"{parsed.scheme.lower()}://{parsed.netloc.lower()}"
    if not parsed.scheme and parsed.netloc:
        return f"//{parsed.netloc.lower()}"
    return None


def parse_csp(content: str) -> tuple[dict[str, set[str]], list[str]]:
    """Parse a CSP into order-independent directive source sets."""

    directives: dict[str, set[str]] = {}
    errors: list[str] = []
    for raw_directive in content.split(";"):
        parts = raw_directive.split()
        if not parts:
            continue
        name = parts[0].lower()
        if name in directives:
            errors.append(f"CSP contains duplicate directive {name!r}")
            continue
        directives[name] = set(parts[1:])
    return directives, errors


def check_csp(contents: list[str]) -> list[str]:
    """Require one CSP whose directives exactly match the reviewed policy."""

    if len(contents) != 1:
        return [f"index.html must contain exactly one CSP meta element; found {len(contents)}"]

    directives, errors = parse_csp(contents[0])
    for name in sorted(set(directives) | set(EXPECTED_CSP)):
        actual = directives.get(name)
        expected = EXPECTED_CSP.get(name)
        if actual != expected:
            errors.append(
                f"CSP directive {name!r} must be {sorted(expected) if expected is not None else 'absent'}; "
                f"found {sorted(actual) if actual is not None else 'missing'}"
            )
    return errors


class SiteHTMLAudit(HTMLParser):
    """Inspect the explicit HTML structure used by this page.

    HTMLParser does not build a browser DOM. Track an explicit, active head so an
    inert or misplaced meta cannot count as protection; browser QA remains required.
    """

    _VOID_ELEMENTS = {
        "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
        "meta", "param", "source", "track", "wbr",
    }
    _HEAD_ELEMENTS = {"base", "link", "meta", "title", "noscript", "noframes", "script", "style", "template"}

    _RESOURCE_ATTRIBUTES = {
        "audio": ("src",),
        "embed": ("src",),
        "feimage": ("href", "xlink:href"),
        "iframe": ("src",),
        "image": ("href", "xlink:href"),
        "img": ("src", "srcset"),
        "input": ("src",),
        "object": ("data",),
        "script": ("src",),
        "source": ("src", "srcset"),
        "track": ("src",),
        "use": ("href", "xlink:href"),
        "video": ("poster", "src"),
    }

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.errors: list[str] = []
        self.scripts: list[str] = []
        self.csp_contents: list[str] = []
        self.source_origins: set[str] = set()
        self.csp_seen = False
        self.in_script = False
        self.open_elements: list[str] = []
        self.head_seen = False
        self.head_active = False

    def _track_head_context(self, tag: str) -> None:
        """Remember when the explicit head starts and when body content ends it."""

        if tag == "head" and not self.head_seen and self.open_elements in ([], ["html"]):
            self.head_seen = True
            self.head_active = True
        elif self.head_active and self.open_elements[-1:] == ["head"] and tag not in self._HEAD_ELEMENTS:
            # A body element implicitly ends the browser's head, even without </head>.
            self.head_active = False
        if tag not in self._VOID_ELEMENTS:
            self.open_elements.append(tag)

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self._track_head_context(tag)
        attributes: dict[str, str] = {}
        for name, value in attrs:
            normalized_name = name.lower()
            if normalized_name in attributes:
                self.errors.append(
                    f"<{tag}> contains duplicate attribute {normalized_name!r}"
                )
                continue
            attributes[normalized_name] = value or ""

        if tag == "meta" and attributes.get("http-equiv", "").lower() == "content-security-policy":
            if self.head_active and self.open_elements in (["head"], ["html", "head"]):
                self.csp_seen = True
                self.csp_contents.append(attributes.get("content", ""))
            else:
                self.errors.append("CSP meta element must be an active child of head, outside inert content")
            return

        if self._is_controlled_resource(tag, attributes) and not self.csp_seen:
            self.errors.append("CSP meta element must appear before every controlled resource")

        for name, value in attributes.items():
            if name.startswith("on"):
                self.errors.append(f"inline event handler {name!r} is not allowed")
            if name == "style":
                self.errors.append("inline style attributes are not allowed")
            if value.strip().lower().startswith("javascript:"):
                self.errors.append(f"javascript: URL in {tag}[{name}] is not allowed")
            if name == "srcdoc":
                self.errors.append("iframe srcdoc content is not allowed")

        if tag in {"base", "embed", "form", "frame", "iframe", "object", "style"}:
            self.errors.append(f"<{tag}> is outside the approved site surface")

        if tag == "meta" and attributes.get("http-equiv", "").lower() == "refresh":
            self.errors.append("meta refresh is not allowed")

        if tag == "script":
            self.in_script = True
            source = attributes.get("src")
            if not source:
                self.errors.append("inline script elements are not allowed")
            else:
                self.scripts.append(source)
            if attributes.get("type"):
                self.errors.append(
                    "repository rule: loaded scripts must remain classic scripts without a type attribute"
                )

        if tag == "a" and attributes.get("target", "").lower() == "_blank":
            rel = {token.lower() for token in attributes.get("rel", "").split()}
            if not {"noopener", "noreferrer"}.issubset(rel):
                self.errors.append('target="_blank" links require rel="noopener noreferrer"')

        for attribute in self._RESOURCE_ATTRIBUTES.get(tag, ()):
            value = attributes.get(attribute)
            if value:
                self._check_resource_url(tag, attribute, value)

        if tag == "link" and attributes.get("href"):
            self._check_resource_url(tag, "href", attributes["href"])

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        # In HTML a slash does not close non-void elements such as template.
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag: str) -> None:
        if tag == "head":
            self.head_active = False
        if tag in self.open_elements:
            position = len(self.open_elements) - 1 - self.open_elements[::-1].index(tag)
            del self.open_elements[position:]
        if tag == "script":
            self.in_script = False

    def handle_data(self, data: str) -> None:
        if data.strip(" \t\n\r\f") and self.open_elements[-1:] == ["head"]:
            self.head_active = False
        if self.in_script and data.strip():
            self.errors.append("inline script content is not allowed")

    @staticmethod
    def _is_controlled_resource(tag: str, attributes: dict[str, str]) -> bool:
        if tag == "link":
            return bool(attributes.get("href"))
        return tag in SiteHTMLAudit._RESOURCE_ATTRIBUTES and any(
            attributes.get(name) for name in SiteHTMLAudit._RESOURCE_ATTRIBUTES[tag]
        )

    def _check_resource_url(self, tag: str, attribute: str, value: str) -> None:
        candidates = [value]
        if attribute == "srcset":
            if "data:" in value.lower():
                self.errors.append("data: URLs are not allowed in srcset")
            candidates = [
                candidate.strip().split()[0]
                for candidate in value.split(",")
                if candidate.strip()
            ]

        for candidate in candidates:
            parsed = urlsplit(candidate.strip())
            scheme = parsed.scheme.lower()
            origin = origin_for(candidate)
            if scheme in {"http", "https"} and origin is None:
                self.errors.append(
                    f"automatic resource {tag}[{attribute}] contains a malformed HTTP(S) URL"
                )
            elif origin is not None:
                self.source_origins.add(origin)
                approved = APPROVED_HTML_RESOURCE_ORIGINS.get((tag, attribute), set())
                if origin not in approved:
                    self.errors.append(
                        f"automatic resource {tag}[{attribute}] uses unapproved origin {origin}"
                    )
                if scheme != "https":
                    self.errors.append(
                        f"automatic resource {tag}[{attribute}] must use an explicit HTTPS URL"
                    )
            elif scheme and scheme not in {"data", "http", "https"}:
                self.errors.append(
                    f"automatic resource {tag}[{attribute}] uses unsupported scheme {scheme!r}"
                )
            elif scheme == "data" and tag not in {"image", "img", "source"}:
                self.errors.append(f"data: is allowed only for image resources, not <{tag}>")


def audit_html(document: str) -> SiteHTMLAudit:
    parser = SiteHTMLAudit()
    parser.feed(document)
    parser.close()
    parser.errors.extend(check_csp(parser.csp_contents))
    if parser.scripts != [EXPECTED_SCRIPT]:
        parser.errors.append(
            f"repository rule: loaded scripts must be exactly [{EXPECTED_SCRIPT!r}]; "
            f"found {parser.scripts!r}"
        )
    if parser.source_origins != EXPECTED_HTML_SOURCE_ORIGINS:
        parser.errors.append(
            "HTML automatic resource origins must be exactly "
            f"{sorted(EXPECTED_HTML_SOURCE_ORIGINS)}; found {sorted(parser.source_origins)}"
        )
    return parser


def review_javascript(source: str, path: str = EXPECTED_SCRIPT) -> list[str]:
    """Return non-blocking review notes; no match is not a security verdict."""

    notes: list[str] = []
    for pattern, label in JS_REVIEW_PATTERNS:
        if pattern.search(source):
            notes.append(
                f"{path}: possible {label}; review the source (comments and strings can also match)"
            )
    return notes


def check_css_origins(root: Path) -> list[str]:
    """Check literal remote references in CSS and Sass, including dormant sources.

    This catches ordinary additions early, but also sees examples in comments.
    CSS escapes and runtime-generated values still need source and browser review.
    """

    errors: list[str] = []
    source_origins: set[str] = set()
    paths = {
        *root.rglob("*.css"),
        *root.rglob("*.scss"),
    }
    for path in sorted(path for path in paths if ".git" not in path.parts):
        source = path.read_text(encoding="utf-8", errors="replace")
        references = [
            (match.group("kind").lstrip().lower(), match.group("url"))
            for match in CSS_REMOTE_REFERENCE.finditer(source)
        ]
        for image_set in CSS_IMAGE_SET.finditer(source):
            references.extend(
                ("image-set", match.group(0))
                for match in CSS_ABSOLUTE_URL.finditer(image_set.group("body"))
            )

        for reference_kind, url in references:
            scheme = urlsplit(url).scheme.lower()
            origin = origin_for(url)
            if origin is None:
                errors.append(f"{path.relative_to(root)} contains a malformed remote CSS URL")
                continue

            source_origins.add(origin)
            approved = EXPECTED_CSS_SOURCE_ORIGINS if reference_kind.startswith("@import") else set()
            if origin not in approved:
                errors.append(f"{path.relative_to(root)} uses unapproved CSS resource origin {origin}")
            if scheme != "https":
                errors.append(f"{path.relative_to(root)} remote CSS resources must use explicit HTTPS")

    if source_origins != EXPECTED_CSS_SOURCE_ORIGINS:
        errors.append(
            "CSS automatic resource origins must be exactly "
            f"{sorted(EXPECTED_CSS_SOURCE_ORIGINS)}; found {sorted(source_origins)}"
        )
    return list(dict.fromkeys(errors))


def check_project_tooling(root: Path) -> list[str]:
    """Enforce the repository's dependency-free convention separately from CSP."""

    errors: list[str] = []
    for path in root.rglob("*"):
        if ".git" in path.parts:
            continue
        relative = path.relative_to(root)
        if path.is_dir() and path.name in {"node_modules", "vendor"}:
            errors.append(f"repository rule: unapproved dependency directory present: {relative}")
        if not path.is_file():
            continue
        name = path.name.lower()
        if (
            name in DISALLOWED_PROJECT_FILES
            or DISALLOWED_PROJECT_FILE_PATTERN.match(name)
            or DISALLOWED_BUILD_CONFIG.match(name)
        ):
            errors.append(f"repository rule: unapproved package or build file present: {relative}")
    return errors


def _workflow_scalar(value: str) -> str:
    """Read a single scalar from our documented YAML subset, without type coercion."""

    value = value.strip()
    if value.startswith('"'):
        try:
            decoded, end = json.JSONDecoder().raw_decode(value)
        except ValueError as error:
            raise ValueError("unsupported quoted scalar") from error
        if value[end:].strip() and not value[end:].lstrip().startswith("#"):
            raise ValueError("unsupported text after a quoted scalar")
        return decoded
    if value.startswith("'"):
        match = re.fullmatch(r"'((?:[^']|'')*)'\s*(?:#.*)?", value)
        if not match:
            raise ValueError("unsupported quoted scalar")
        return match.group(1).replace("''", "'")
    value = re.split(r"\s+#", value, maxsplit=1)[0].rstrip()
    if value.startswith(("[", "{", "&", "*", "!", ">", "|")):
        raise ValueError("unsupported flow collection, anchor, alias, tag, or scalar style")
    if re.search(r":(?:\s|$)", value):
        raise ValueError("unsupported colon in a plain scalar")
    return value


def _parse_workflow_block_yaml(text: str) -> dict:
    """Read block mappings, lists, and literal | blocks used by this workflow.

    Advanced YAML must fail explicitly: guessing at an alias or folded value can
    change the permissions or commands we think we are checking.
    """

    lines = []
    for number, line in enumerate(text.splitlines(), 1):
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        prefix = line[:len(line) - len(line.lstrip())]
        if "\t" in prefix:
            raise ValueError(f"unsupported tab indentation on line {number}")
        lines.append((len(prefix), line[len(prefix):].rstrip(), number))
    position = 0
    pair = re.compile(r'''^("(?:\\.|[^"\\])*"|'(?:[^']|'')*'|[A-Za-z0-9_.-]+):(?:\s+(.*)|\s*)$''')

    def parse(indent: int):
        nonlocal position
        sequence = lines[position][1].startswith("- ") or lines[position][1] == "-"
        result = [] if sequence else {}
        while position < len(lines) and lines[position][0] == indent:
            _, body, number = lines[position]
            is_item = body.startswith("- ") or body == "-"
            if is_item != sequence:
                raise ValueError(f"unsupported mixed mapping/list on line {number}")
            if sequence:
                item = body[1:].lstrip()
                if pair.fullmatch(item):
                    item_indent = indent + len(body) - len(item)
                    lines[position] = (item_indent, item, number)
                    result.append(parse(item_indent))
                    continue
                position += 1
                if not item and position < len(lines) and lines[position][0] > indent:
                    result.append(parse(lines[position][0]))
                else:
                    result.append(_workflow_scalar(item))
            else:
                match = pair.fullmatch(body)
                if not match:
                    raise ValueError(f"unsupported mapping syntax on line {number}")
                key = _workflow_scalar(match.group(1))
                if key in result:
                    raise ValueError(f"unsupported duplicate key {key!r} on line {number}")
                raw = (match.group(2) or "").strip()
                position += 1
                if re.fullmatch(r"\|(?:\s+#.*)?", raw):
                    block = []
                    block_indent = lines[position][0] if position < len(lines) else indent
                    while position < len(lines) and lines[position][0] > indent:
                        column, content, _ = lines[position]
                        if column < block_indent:
                            raise ValueError("unsupported inconsistent literal-block indentation")
                        block.append(" " * (column - block_indent) + content)
                        position += 1
                    result[key] = "\n".join(block)
                elif not raw or raw.startswith("#"):
                    has_children = position < len(lines) and lines[position][0] > indent
                    result[key] = parse(lines[position][0]) if has_children else None
                else:
                    result[key] = _workflow_scalar(raw)
            if position < len(lines) and lines[position][0] > indent:
                raise ValueError(f"unsupported indentation on line {lines[position][2]}")
        return result

    if not lines or lines[0][0] != 0:
        raise ValueError("unsupported empty or indented workflow document")
    document = parse(0)
    if position != len(lines) or not isinstance(document, dict):
        raise ValueError("unsupported workflow document structure")
    return document


def check_workflow_text(text: str, path: str) -> list[str]:
    """Check this workflow's supported structure; command presence is not execution proof."""

    try:
        workflow = _parse_workflow_block_yaml(text)
    except ValueError as error:
        return [f"{path}: {error}; requires review and a checker update"]
    errors: list[str] = []

    def fields(value, allowed: set[str], location: str) -> bool:
        if not isinstance(value, dict):
            errors.append(f"{path}: unsupported {location} structure; requires review")
            return False
        extra = set(value) - allowed
        if extra:
            errors.append(f"{path}: unsupported {location} keys {sorted(extra)}; requires review")
        return not extra

    def inspect(value):
        if isinstance(value, dict):
            if "if" in value or "continue-on-error" in value:
                errors.append(f"{path}: validation must not be conditional or non-blocking")
            if any(key in value and not isinstance(value[key], str) for key in ("name", "run-name", "id")):
                errors.append(f"{path}: unsupported display name or identifier structure; requires review")
            for nested in value.values():
                inspect(nested)
        elif isinstance(value, list):
            for nested in value:
                inspect(nested)
        elif isinstance(value, str) and re.search(r"\$\{\{[^}]*\bsecrets\b", value, re.IGNORECASE):
            errors.append(f"{path}: must not consume GitHub Actions secrets")

    inspect(workflow)
    fields(workflow, {"name", "run-name", "on", "permissions", "concurrency", "jobs"}, "workflow")
    expected_events = {event: {"branches": ["main"]} for event in ("push", "pull_request")}
    if workflow.get("on") != expected_events:
        errors.append(f"{path}: triggers must be pull requests and pushes to main only")
    if workflow.get("permissions") != {"contents": "read"}:
        errors.append(f"{path}: must declare only top-level contents: read permissions")
    if "concurrency" in workflow and fields(
        workflow["concurrency"], {"group", "cancel-in-progress"}, "concurrency"
    ):
        concurrency = workflow["concurrency"]
        if not isinstance(concurrency.get("group"), str) or not concurrency["group"]:
            errors.append(f"{path}: unsupported concurrency group; requires a nonempty scalar")
        cancel = concurrency.get("cancel-in-progress", "false")
        if not isinstance(cancel, str) or not (
            cancel in {"true", "false"} or re.fullmatch(r"\$\{\{.+\}\}", cancel)
        ):
            errors.append(f"{path}: unsupported concurrency cancellation value; requires review")
    jobs = workflow.get("jobs")
    if not isinstance(jobs, dict) or len(jobs) != 1:
        return errors + [f"{path}: expected one validation job"]
    job = next(iter(jobs.values()))
    if not fields(job, {"name", "runs-on", "timeout-minutes", "steps"}, "job"):
        return errors
    if not isinstance(job.get("runs-on"), str) or not job["runs-on"]:
        errors.append(f"{path}: job requires a scalar runs-on value")
    timeout = job.get("timeout-minutes", "")
    if not isinstance(timeout, str) or not timeout.isdigit() or int(timeout) <= 0:
        errors.append(f"{path}: validation must have a positive timeout-minutes value")
    steps = job.get("steps")
    if not isinstance(steps, list):
        return errors + [f"{path}: expected a steps list"]
    checkout_count = 0
    commands = set()
    whitespace_found = False
    required = {
        ("python3", "-m", "unittest", "discover", "-s", ".github/scripts", "-p", "test_*.py"),
        ("python3", ".github/scripts/check_site_security.py"),
        ("node", "--check", "assets/js/main.js"),
    }
    whitespace_commands = {
        ("git", "diff", "--check", "$BASE_SHA...$HEAD_SHA"),
        ("git", "show", "--check", "--format=", "$CURRENT_SHA"),
        ("git", "diff", "--check", "$BEFORE_SHA...$CURRENT_SHA"),
    }
    for step in steps:
        if not fields(step, {"name", "id", "uses", "with", "run", "env"}, "step"):
            continue
        if ("uses" in step) == ("run" in step):
            errors.append(f"{path}: each step must declare either uses or run")
            continue
        if "uses" in step:
            checkout_count += 1
            if step["uses"] != EXPECTED_ACTION_REFERENCE:
                errors.append(f"{path}: action reference must be the approved full commit SHA")
            if step.get("with") != {"fetch-depth": "0", "persist-credentials": "false"}:
                errors.append(f"{path}: checkout requires fetch-depth: 0 and persist-credentials: false only")
            if "env" in step:
                errors.append(f"{path}: unsupported checkout env; requires review")
            continue
        if checkout_count == 0:
            errors.append(f"{path}: validation commands must follow checkout")
        script = step["run"]
        if not isinstance(script, str):
            errors.append(f"{path}: run must be a scalar command or literal block")
            continue
        try:
            commands.add(tuple(shlex.split(script, comments=True)))
            script_lines = {tuple(shlex.split(line, comments=True)) for line in script.splitlines()}
        except ValueError:
            errors.append(f"{path}: unsupported shell quoting; requires review")
            continue
        if any(DOWNLOAD_COMMAND.search(" ".join(line)) for line in script_lines):
            errors.append(f"{path}: must not download or install tooling")
        if "${{" in script:
            errors.append(f"{path}: pass event expressions through env instead of interpolating run scripts")
        if "with" in step:
            errors.append(f"{path}: unsupported with on a run step; requires review")
        if "env" in step:
            event_variables = {"EVENT_NAME", "BASE_SHA", "HEAD_SHA", "BEFORE_SHA", "CURRENT_SHA"}
            if not fields(step["env"], event_variables, "step env"):
                continue
            if any(not isinstance(value, str) for value in step["env"].values()):
                errors.append(f"{path}: unsupported non-scalar env value; requires review")
        whitespace_found |= whitespace_commands <= script_lines
    if checkout_count != 1:
        errors.append(f"{path}: must use exactly one approved checkout step")
    if required - commands or not whitespace_found:
        errors.append(f"{path}: missing required validation commands in actual run steps")
    return errors


def check_workflows(root: Path) -> list[str]:
    errors: list[str] = []
    workflow_dir = root / ".github" / "workflows"
    workflows = sorted(
        path for path in workflow_dir.glob("*") if path.suffix.lower() in {".yml", ".yaml"}
    )
    names = {path.name for path in workflows}
    if names != APPROVED_WORKFLOWS:
        errors.append(
            f"approved workflow files must be {sorted(APPROVED_WORKFLOWS)}; found {sorted(names)}"
        )
    for path in workflows:
        errors.extend(
            check_workflow_text(path.read_text(encoding="utf-8"), str(path.relative_to(root)))
        )
    return errors


def audit_repository(root: Path = REPOSITORY_ROOT) -> list[str]:
    errors: list[str] = []
    index_path = root / "index.html"
    if not index_path.is_file():
        return ["index.html is missing"]

    html_audit = audit_html(index_path.read_text(encoding="utf-8"))
    errors.extend(html_audit.errors)

    script_path = root / EXPECTED_SCRIPT
    if not script_path.is_file():
        errors.append(f"expected script is missing: {EXPECTED_SCRIPT}")

    errors.extend(check_css_origins(root))
    errors.extend(check_project_tooling(root))
    errors.extend(check_workflows(root))
    return errors


def main() -> int:
    errors = audit_repository()
    script_path = REPOSITORY_ROOT / EXPECTED_SCRIPT
    if script_path.is_file():
        for note in review_javascript(script_path.read_text(encoding="utf-8")):
            print(f"Review note (non-blocking): {note}", file=sys.stderr)
    if errors:
        print("Site security or repository checks failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print("Site security and repository checks passed. JavaScript still requires source review.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
