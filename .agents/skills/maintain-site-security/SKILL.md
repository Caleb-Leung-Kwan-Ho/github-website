---
name: maintain-site-security
description: Review or implement security-sensitive changes for this static personal website. Use for security audits or hardening and changes to JavaScript, external runtime resources, dependencies or package tooling, CSP, secrets, GitHub Actions, or deployment; exclude ordinary copy and styling changes that do not alter resource loading or security controls.
---

# Maintain site security

Read the repository-root [AGENTS.md](../../../AGENTS.md) for project rules and authorization boundaries, and [README.md](../../../README.md) for the runtime and file map. Paths below are relative to the repository root. Match the requested mode: an audit, review, or plan is read-only, while an implementation request authorizes only its stated repository changes. It does not authorize installing or downloading software, committing, pushing, publishing, changing GitHub settings, or handling a discovered secret beyond reporting it safely.

## Establish the real runtime surface

- Begin at `index.html` and trace what the browser can actually load. Follow HTML resource attributes, script imports and dynamic loaders, CSS `@import` and `url(...)`, network APIs, workers, service workers, frames, forms, and redirects. Search the repository before deciding that a file is used or safe to remove.
- Classify findings as automatically loaded runtime resources, user-initiated navigation such as an external link, or dormant/unreferenced files. Do not describe a file as executing merely because it exists in the repository, a branch, or Git history.
- When resource loading changes, verify the browser network log and console from the local preview. Record redirect destinations and final response origins; source inspection alone may not reveal them.

The expected browser-executable surface is one local script, `assets/js/main.js`. The approved automatic remote resources are narrowly limited to the existing Google Fonts stylesheet (`https://fonts.googleapis.com`), its font files (`https://fonts.gstatic.com`), the Google Drive resume thumbnail (`https://drive.google.com`), and its observed image redirect (`https://lh3.googleusercontent.com`). This approval preserves those non-JavaScript resources only. It does not authorize analytics, embeds, remote scripts, or other Google products. External course, social, resume-PDF, and email links are user-initiated navigation and do not belong in runtime-resource allowlists.

## Preserve the trust boundary

- Prefer the existing static HTML, CSS, local assets, and vanilla JavaScript. Do not add a package manager, dependency, remote executable code, third-party form or embed, analytics, or a new automatic remote origin without the user's explicit approval of that tradeoff.
- Treat JavaScript URLs, dynamically evaluated code, HTML injection sinks, message handlers, storage, and network inputs as security-sensitive. Keep data and code separate; validate origins and input at the boundary actually exposed by the change.
- If a third-party resource is approved, document its purpose, data exposure, failure behavior, provenance, and maintenance cost. Prefer an immutable version and integrity verification where the resource type supports it. Trust in one service or resource is not blanket approval for others.

## Keep resources, CSP, and checks aligned

- Derive CSP sources from the automatic runtime inventory and place each exact scheme-and-host origin only in the directive that needs it. Account for redirect destinations. Do not allow an origin merely because a normal hyperlink points there.
- Update resource markup or CSS, the CSP in `index.html`, the security checker's allowlist, and its tests as one coherent change. A stale allowlist is a bug even if the page still appears to work.
- Preserve restrictive defaults. Do not introduce `*`, scheme-wide sources such as `https:`, `'unsafe-inline'`, `'unsafe-eval'`, or executable `data:`/`blob:` sources for convenience. If a requested feature genuinely requires weakening a directive, explain the exact exposure and obtain approval before doing so.
- Keep a meta-delivered CSP before every governed resource. Do not claim that header-only protections such as `frame-ancestors` are enforced from a meta element; report GitHub Pages response-header limits separately.

## Protect secrets and automation

- Never add credentials, tokens, private keys, `.env` contents, or sensitive personal data to source, tests, workflows, URLs, comments, or logs. If one is found, do not echo it: report only its category and redacted location, stop any action that could publish it, and recommend revocation or rotation. History cleanup is a separate destructive task requiring explicit authorization.
- Treat workflow and deployment files as executable code. Keep validation workflows dependency-free where practical, use `pull_request` rather than `pull_request_target` for untrusted changes, grant only `contents: read` unless a requested operation demonstrably needs more, avoid secrets and writable credentials, and never interpolate untrusted event data into shell commands.
- Pin every external GitHub Action to a reviewed full commit SHA; a tag or branch is not an immutable pin. Keep deployment behavior separate from validation, and do not create or alter publishing credentials, environments, Pages settings, branch rules, or required checks unless the user explicitly asks.

## Verify and report without overclaiming

For implementation, run the repository checks that apply, including:

```sh
python3 .github/scripts/check_site_security.py
python3 -m unittest discover -s .github/scripts -p 'test_*.py'
git diff --check
```

Also run `node --check assets/js/main.js` when JavaScript changes. For runtime-resource or CSP changes, use the local preview to confirm expected resources load, unexpected requests are absent, and the console has no CSP violations; test the affected behavior with the approved remote resource unavailable when practical.

Report confirmed issues separately from defense-in-depth improvements and unverified external settings. State the files changed, checks actually run, any automatic network origins added or removed, and anything not verified. For user-visible changes, include desktop and narrow browser screenshots in the handoff when the tooling supports it; do not add validation screenshots to the repository unless asked. Never claim the repository is secure, hacker-proof, or that GitHub account, ruleset, Pages, or secret-scanning settings are enabled unless they were directly inspected through an authoritative interface.
