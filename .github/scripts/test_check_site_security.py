#!/usr/bin/env python3
"""Exercise security failures, repository rules, and harmless supported inputs."""

from __future__ import annotations

import io
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest.mock import patch


SCRIPT_DIRECTORY = Path(__file__).resolve().parent
REPOSITORY_ROOT = SCRIPT_DIRECTORY.parents[1]
sys.path.insert(0, str(SCRIPT_DIRECTORY))

import check_site_security as checker  # noqa: E402


VALID_CSP = (
    "default-src 'none'; base-uri 'none'; object-src 'none'; form-action 'none'; "
    "script-src 'self'; script-src-attr 'none'; "
    "style-src 'self' https://fonts.googleapis.com; style-src-attr 'none'; "
    "font-src 'self' https://fonts.gstatic.com; "
    "img-src 'self' data: https://drive.google.com https://lh3.googleusercontent.com; "
    "connect-src 'none'; frame-src 'none'; media-src 'none'; "
    "manifest-src 'none'; worker-src 'none'"
)
CSP_META = f'<meta http-equiv="Content-Security-Policy" content="{VALID_CSP}">'

# Keep mutation fixtures independent of the live workflow's display text.
VALID_WORKFLOW = """name: Security invariants
on:
  pull_request:
    branches:
      - main
  push:
    branches:
      - main
permissions:
  contents: read
jobs:
  security-invariants:
    name: Security invariants
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Check out reviewed revision
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1
        with:
          fetch-depth: 0
          persist-credentials: false
      - name: Run checker unit tests
        run: python3 -m unittest discover -s .github/scripts -p 'test_*.py'
      - name: Check site security invariants
        run: python3 .github/scripts/check_site_security.py
      - name: Check JavaScript syntax
        run: node --check assets/js/main.js
      - name: Check changed lines for whitespace errors
        env:
          EVENT_NAME: ${{ github.event_name }}
          BASE_SHA: ${{ github.event.pull_request.base.sha }}
          HEAD_SHA: ${{ github.event.pull_request.head.sha }}
          BEFORE_SHA: ${{ github.event.before }}
          CURRENT_SHA: ${{ github.sha }}
        run: |
          set -euo pipefail
          if [ "$EVENT_NAME" = "pull_request" ]; then
            git diff --check "$BASE_SHA...$HEAD_SHA"
          elif [ "$BEFORE_SHA" = "0000000000000000000000000000000000000000" ]; then
            git show --check --format= "$CURRENT_SHA"
          else
            git diff --check "$BEFORE_SHA...$CURRENT_SHA"
          fi
"""


def valid_html(body: str = "") -> str:
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  {CSP_META}
  <link rel="stylesheet" href="assets/css/main.css">
</head>
<body>
  {body}
  <img src="https://drive.google.com/thumbnail?id=public-file" alt="Resume preview">
  <script src="assets/js/main.js"></script>
</body>
</html>
"""


def workflow_with(old: str, new: str) -> str:
    if VALID_WORKFLOW.count(old) != 1:
        raise AssertionError("Workflow mutation must change exactly one fixture fragment")
    return VALID_WORKFLOW.replace(old, new, 1)


class CSPTests(unittest.TestCase):
    def test_reviewed_html_passes(self) -> None:
        self.assertEqual(checker.audit_html(valid_html()).errors, [])

    def test_reordered_attributes_directives_and_comments_pass(self) -> None:
        directives = "; ".join(reversed(VALID_CSP.split("; ")))
        replacement = (
            '<!-- The policy precedes automatic resources. -->\n'
            f'<meta content="{directives}" http-equiv="Content-Security-Policy">'
        )
        errors = checker.audit_html(valid_html().replace(CSP_META, replacement)).errors
        self.assertEqual(errors, [])

    def test_missing_csp_fails(self) -> None:
        errors = checker.audit_html(valid_html().replace(CSP_META, "")).errors
        self.assertTrue(any("CSP" in error for error in errors))

    def test_csp_in_inactive_context_fails(self) -> None:
        for wrapper in ("template", "noscript"):
            with self.subTest(wrapper=wrapper):
                document = valid_html().replace(CSP_META, f"<{wrapper}>{CSP_META}</{wrapper}>")
                errors = checker.audit_html(document).errors
                self.assertTrue(any("CSP" in error for error in errors))

    def test_csp_in_body_before_resources_fails(self) -> None:
        document = valid_html().replace("<head>", "<head></head><body>")
        document = document.replace("</head>\n<body>", "")
        errors = checker.audit_html(document).errors
        self.assertTrue(any("CSP" in error for error in errors))

    def test_text_implicitly_ending_head_before_csp_fails(self) -> None:
        for text in ("Visible text", "&nbsp;"):
            with self.subTest(text=text):
                document = valid_html().replace(CSP_META, text + CSP_META)
                errors = checker.audit_html(document).errors
                self.assertTrue(any("CSP" in error for error in errors))

    def test_resource_before_csp_fails(self) -> None:
        document = valid_html().replace(CSP_META, '<img src="early.png">' + CSP_META)
        errors = checker.audit_html(document).errors
        self.assertTrue(any("before" in error and "CSP" in error for error in errors))

    def test_weakened_csp_fails(self) -> None:
        document = valid_html().replace(
            "script-src 'self'", "script-src 'self' https: 'unsafe-inline'"
        )
        errors = checker.audit_html(document).errors
        self.assertTrue(any("script-src" in error for error in errors))

    def test_duplicate_csp_attribute_fails_and_first_value_is_audited(self) -> None:
        document = valid_html().replace(
            f'content="{VALID_CSP}"', f'content="default-src *" content="{VALID_CSP}"'
        )
        errors = checker.audit_html(document).errors
        self.assertTrue(any("duplicate attribute" in error for error in errors))
        self.assertTrue(any("default-src" in error for error in errors))


class HTMLResourceTests(unittest.TestCase):
    def test_remote_script_fails(self) -> None:
        document = valid_html().replace(
            '<script src="assets/js/main.js"></script>',
            '<script src="https://example.com/app.js"></script>',
        )
        errors = checker.audit_html(document).errors
        self.assertTrue(any("unapproved origin" in error for error in errors))

    def test_inline_script_fails(self) -> None:
        errors = checker.audit_html(valid_html("<script>run()</script>")).errors
        self.assertTrue(any("inline script" in error for error in errors))

    def test_inline_event_handler_fails(self) -> None:
        document = valid_html('<button onclick="run()">Run</button>')
        errors = checker.audit_html(document).errors
        self.assertTrue(any("inline event handler" in error for error in errors))

    def test_javascript_url_fails(self) -> None:
        errors = checker.audit_html(valid_html('<a href="javascript:run()">Run</a>')).errors
        self.assertTrue(any("javascript: URL" in error for error in errors))

    def test_unapproved_image_origin_fails(self) -> None:
        errors = checker.audit_html(valid_html('<img src="https://example.com/pixel">')).errors
        self.assertTrue(any("unapproved origin https://example.com" in error for error in errors))

    def test_approved_origin_for_wrong_resource_fails(self) -> None:
        document = valid_html('<img src="https://fonts.googleapis.com/not-an-image">')
        errors = checker.audit_html(document).errors
        self.assertTrue(any("img[src] uses unapproved origin" in error for error in errors))

    def test_unapproved_svg_resource_fails(self) -> None:
        for tag in ("image", "feImage"):
            with self.subTest(tag=tag):
                document = valid_html(
                    f'<svg><{tag} href="https://example.com/pixel"></{tag}></svg>'
                )
                errors = checker.audit_html(document).errors
                self.assertTrue(any("unapproved origin" in error for error in errors))

    def test_malformed_srcset_url_fails(self) -> None:
        document = valid_html('<img srcset="local.png 1x, https:malformed 2x">')
        errors = checker.audit_html(document).errors
        self.assertTrue(any("malformed HTTP(S) URL" in error for error in errors))

    def test_target_blank_requires_safe_rel(self) -> None:
        document = valid_html('<a href="https://example.com" target="_blank">Open</a>')
        errors = checker.audit_html(document).errors
        self.assertTrue(any('target="_blank"' in error for error in errors))

    def test_safe_external_navigation_passes(self) -> None:
        document = valid_html(
            '<a rel="noreferrer noopener" target="_blank" href="https://example.com">Open</a>'
        )
        self.assertEqual(checker.audit_html(document).errors, [])


class JavaScriptReviewTests(unittest.TestCase):
    def test_normal_javascript_has_no_advisory(self) -> None:
        self.assertEqual(
            checker.review_javascript("document.body.classList.remove('ready');"), []
        )

    def test_prose_word_import_has_no_advisory(self) -> None:
        for source in (
            "// import another concept here\ndocument.body.classList.remove('ready');",
            'const message = "Please import your settings";',
        ):
            with self.subTest(source=source):
                self.assertEqual(checker.review_javascript(source), [])

    def test_sensitive_operations_produce_possible_match_advisories(self) -> None:
        examples = {
            "eval(source)": "eval",
            "element.innerHTML = value": "HTML assignment",
            "element['outerHTML'] += value": "HTML assignment",
            "import './second.js';": "JavaScript import",
            "import helper from './second.js';": "JavaScript import",
            "import/*comment*/('./second.js');": "JavaScript import",
            "fetch('/data')": "fetch",
            "navigator.serviceWorker.register('/sw.js')": "service-worker registration",
        }
        for source, label in examples.items():
            with self.subTest(source=source):
                notes = checker.review_javascript(source)
                self.assertTrue(any(label in note for note in notes))
                self.assertTrue(all("possible" in note.lower() for note in notes))

    def test_api_text_in_comments_is_advisory_not_proof_of_execution(self) -> None:
        notes = checker.review_javascript("// fetch('/data') would need review")
        self.assertTrue(notes)
        self.assertTrue(all("possible" in note.lower() for note in notes))


class WorkflowTests(unittest.TestCase):
    def test_pinned_read_only_workflow_passes(self) -> None:
        self.assertEqual(checker.check_workflow_text(VALID_WORKFLOW, "workflow.yml"), [])

    def test_comments_blank_lines_and_trailing_space_pass(self) -> None:
        workflow = workflow_with(
            "  contents: read\n", "  # Keep the token read-only.\n  contents: read # policy\n\n"
        )
        workflow = "\n".join(line + "  " for line in workflow.splitlines()) + "\n"
        self.assertEqual(checker.check_workflow_text(workflow, "workflow.yml"), [])

    def test_quoted_keys_and_scalar_values_pass(self) -> None:
        workflow = VALID_WORKFLOW.replace("contents: read", 'contents: "read"')
        workflow = workflow.replace("permissions:", '"permissions":')
        workflow = workflow.replace("runs-on: ubuntu-latest", "runs-on: 'ubuntu-latest'")
        workflow = workflow.replace(
            "run: node --check assets/js/main.js", 'run: "node --check assets/js/main.js"'
        )
        self.assertEqual(checker.check_workflow_text(workflow, "workflow.yml"), [])

    def test_consistent_indentation_change_passes(self) -> None:
        lines = []
        for line in VALID_WORKFLOW.splitlines():
            content = line.lstrip(" ")
            indentation = len(line) - len(content)
            if content.startswith("- "):
                content = "-   " + content[2:]
            lines.append(" " * (indentation * 2) + content)
        workflow = "\n".join(lines) + "\n"
        self.assertEqual(checker.check_workflow_text(workflow, "workflow.yml"), [])

    def test_display_names_job_identifier_and_runner_can_change(self) -> None:
        workflow = VALID_WORKFLOW.replace("Security invariants", "Website checks")
        workflow = workflow.replace("security-invariants:", "website-checks:")
        workflow = workflow.replace("ubuntu-latest", "ubuntu-24.04")
        self.assertEqual(checker.check_workflow_text(workflow, "workflow.yml"), [])

    def test_scalar_concurrency_settings_pass(self) -> None:
        for cancellation in (None, "true", "false", "${{ github.ref != 'refs/heads/main' }}"):
            with self.subTest(cancellation=cancellation):
                settings = "  group: checks-${{ github.workflow }}-${{ github.ref }}\n"
                if cancellation is not None:
                    settings += f"  cancel-in-progress: {cancellation}\n"
                workflow = workflow_with("jobs:\n", f"concurrency:\n{settings}jobs:\n")
                self.assertEqual(checker.check_workflow_text(workflow, "workflow.yml"), [])

    def test_nested_concurrency_values_fail(self) -> None:
        cases = {
            "group mapping": "  group:\n    name: checks\n  cancel-in-progress: true\n",
            "group list": "  group:\n    - checks\n  cancel-in-progress: true\n",
            "cancellation mapping": "  group: checks\n  cancel-in-progress:\n    enabled: true\n",
            "cancellation list": "  group: checks\n  cancel-in-progress:\n    - true\n",
        }
        for name, settings in cases.items():
            with self.subTest(name=name):
                workflow = workflow_with("jobs:\n", f"concurrency:\n{settings}jobs:\n")
                errors = checker.check_workflow_text(workflow, "workflow.yml")
                self.assertTrue(any("concurrency" in error.lower() for error in errors))

    def test_write_permission_fails(self) -> None:
        workflow = workflow_with("contents: read", "contents: write")
        errors = checker.check_workflow_text(workflow, "workflow.yml")
        self.assertTrue(any("permission" in error.lower() for error in errors))

    def test_pull_request_target_fails(self) -> None:
        workflow = workflow_with("  pull_request:\n", "  pull_request_target:\n")
        errors = checker.check_workflow_text(workflow, "workflow.yml")
        self.assertTrue(any("trigger" in error.lower() for error in errors))

    def test_mutable_action_tag_fails(self) -> None:
        workflow = workflow_with(
            "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1", "actions/checkout@v7"
        )
        errors = checker.check_workflow_text(workflow, "workflow.yml")
        self.assertTrue(any("action" in error.lower() for error in errors))

    def test_unapproved_action_fails(self) -> None:
        workflow = workflow_with(
            "      - name: Run checker unit tests\n",
            "      - uses: example/action@0000000000000000000000000000000000000000\n"
            "      - name: Run checker unit tests\n",
        )
        errors = checker.check_workflow_text(workflow, "workflow.yml")
        self.assertTrue(any("action" in error.lower() for error in errors))

    def test_secret_expression_fails(self) -> None:
        workflow = VALID_WORKFLOW + "\nenv:\n  TOKEN: ${{secrets.TOKEN}}\n"
        errors = checker.check_workflow_text(workflow, "workflow.yml")
        self.assertTrue(any("secret" in error.lower() for error in errors))

    def test_conditional_or_nonblocking_step_fails(self) -> None:
        for setting in ("if: ${{ false }}", "continue-on-error: true"):
            with self.subTest(setting=setting):
                workflow = workflow_with(
                    "      - name: Run checker unit tests\n",
                    f"      - name: Run checker unit tests\n        {setting}\n",
                )
                errors = checker.check_workflow_text(workflow, "workflow.yml")
                self.assertTrue(any(
                    "conditional" in error or "non-blocking" in error for error in errors
                ))

    def test_missing_validation_command_fails(self) -> None:
        workflow = workflow_with(
            "run: python3 .github/scripts/check_site_security.py", "run: python3 --version"
        )
        errors = checker.check_workflow_text(workflow, "workflow.yml")
        self.assertTrue(any("validation" in error.lower() for error in errors))

    def test_tool_download_fails(self) -> None:
        workflow = VALID_WORKFLOW + "\n      - run: curl https://example.com/tool\n"
        errors = checker.check_workflow_text(workflow, "workflow.yml")
        self.assertTrue(any("download" in error.lower() for error in errors))

    def test_empty_workflow_fails(self) -> None:
        self.assertTrue(checker.check_workflow_text("", "workflow.yml"))

    def test_unsupported_formats_require_review(self) -> None:
        cases = {
            "flow mapping": workflow_with(
                "permissions:\n  contents: read", "permissions: {contents: read}"
            ),
            "anchor": workflow_with("permissions:\n", "permissions: &read_permissions\n"),
            "folded run": workflow_with("        run: |\n", "        run: >\n"),
        }
        for name, workflow in cases.items():
            with self.subTest(name=name):
                errors = checker.check_workflow_text(workflow, "workflow.yml")
                self.assertTrue(any("unsupported" in error.lower() for error in errors))
                self.assertTrue(any("review" in error.lower() for error in errors))


class CSSResourceTests(unittest.TestCase):
    def test_local_assets_and_approved_import_pass(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "theme.css").write_text(
                '@import url("https://fonts.googleapis.com/css?family=Test");\n'
                '.hero { background: url("images/local.png"); }\n', encoding="utf-8"
            )
            self.assertEqual(checker.check_css_origins(root), [])

    def test_unapproved_nested_css_resource_fails(self) -> None:
        for value in (
            'url("https://example.com/pixel.png")',
            'image-set("https://example.com/pixel.png" 1x)',
        ):
            with self.subTest(value=value), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                nested = root / "nested"
                nested.mkdir()
                (nested / "theme.css").write_text(
                    '@import url("https://fonts.googleapis.com/css?family=Test");\n'
                    f'.hero {{ background: {value}; }}\n', encoding="utf-8"
                )
                errors = checker.check_css_origins(root)
                self.assertTrue(any("https://example.com" in error for error in errors))


class RepositoryRuleTests(unittest.TestCase):
    def test_script_must_remain_classic(self) -> None:
        document = valid_html().replace(
            '<script src="assets/js/main.js"></script>',
            '<script type="module" src="assets/js/main.js"></script>',
        )
        errors = checker.audit_html(document).errors
        self.assertTrue(any("classic scripts" in error for error in errors))

    def test_package_manifest_is_reported_as_repository_rule(self) -> None:
        for filename in ("package.json", "requirements-dev.txt", "Cargo.toml"):
            with self.subTest(filename=filename), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                (root / filename).write_text("unapproved tooling\n", encoding="utf-8")
                errors = checker.check_project_tooling(root)
                self.assertTrue(any(filename in error for error in errors))
                self.assertTrue(all("repository rule" in error.lower() for error in errors))

    def test_plain_static_files_pass(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "README.md").write_text("Static website\n", encoding="utf-8")
            self.assertEqual(checker.check_project_tooling(root), [])


class CheckerIntegrationTests(unittest.TestCase):
    def test_current_repository_passes(self) -> None:
        self.assertEqual(checker.audit_repository(REPOSITORY_ROOT), [])

    def test_javascript_review_notes_are_not_repository_failures(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            fixtures = {
                "index.html": valid_html(),
                "assets/js/main.js": "fetch('/data');",
                "assets/css/main.css": '@import "https://fonts.googleapis.com/css?family=Test";',
                ".github/workflows/security-invariants.yml": VALID_WORKFLOW,
            }
            for name, content in fixtures.items():
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content, encoding="utf-8")
            self.assertTrue(checker.review_javascript(fixtures["assets/js/main.js"]))
            self.assertEqual(checker.audit_repository(root), [])

    def test_javascript_advisory_does_not_fail_cli(self) -> None:
        output = io.StringIO()
        advisory = "Possible fetch match; comments and strings may also match."
        with (
            patch.object(checker, "audit_repository", return_value=[]),
            patch.object(checker, "review_javascript", return_value=[advisory]) as review,
            redirect_stdout(output),
            redirect_stderr(output),
        ):
            status = checker.main()
        self.assertEqual(status, 0)
        review.assert_called_once()
        self.assertIn(advisory, output.getvalue())

    def test_security_failure_fails_cli(self) -> None:
        output = io.StringIO()
        with (
            patch.object(checker, "audit_repository", return_value=["CSP is missing"]),
            redirect_stdout(output),
            redirect_stderr(output),
        ):
            status = checker.main()
        self.assertNotEqual(status, 0)
        self.assertIn("CSP is missing", output.getvalue())


if __name__ == "__main__":
    unittest.main()
