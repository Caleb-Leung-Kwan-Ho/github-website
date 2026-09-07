# Maintaining this website

## Keep it simple

This is a static, single-page personal website. Keep it that way unless a task explicitly calls for an architectural change. Prefer a small, focused HTML, CSS, or vanilla-JavaScript edit over a framework, component runtime, state manager, build system, or dependency.

These are repository defaults, not prohibitions against necessary changes. If a request genuinely requires departing from them, explain the reason and tradeoff before making the change.

Make the smallest coherent change that solves the request. Do not combine a content update with an unrelated redesign or cleanup.

For requests limited to planning or review, keep the work read-only. Agreement on a plan is not permission to edit; wait for an explicit implementation request. Once implementation is requested, perform the relevant local validation below as part of that work.

## Keep personal content factual

Preserve the meaning and scope of factual claims when editing copy. Base additions on user-provided information or verifiable sources; do not invent or inflate credentials, dates, achievements, ownership, proficiency, or metrics. If a fact needed for the requested change is missing or conflicting, ask rather than infer it.

## Work in the existing shapes

- `index.html` is the page entry point and source of the site content, sections, navigation, and asset links.
- `assets/css/one-page.css` is the hand-authored site-specific styling layer. It is intentionally loaded after the compiled HTML5 UP base theme in `assets/css/main.css`.
- `assets/sass/` is the source for the baseline theme CSS. `assets/js/main.js` contains the site’s only loaded custom behavior.
- Use `images/` for local visual assets. Keep `LICENSE.txt` and the theme attribution comments intact.

For a new main section, follow the existing `profile-section` pattern: give the section a stable `id`, a heading connected with `aria-labelledby`, and a matching `#site-nav` link. The navigation href-to-section mapping is used by `main.js` to set the active link, so keep them aligned.

Reuse an existing class when the new element represents the same component, layout pattern, or behavior. Create a new descriptive class when an element has a distinct styling role; section-specific classes are acceptable when they keep the code understandable.

Extract a shared class when multiple elements genuinely share a repeated concept. Do not force unrelated elements to share a class merely because their current styles happen to be similar. Avoid unnecessary wrappers and isolated utility classes that do not belong to an intentional utility system.

## CSS and responsive behavior

For CSS or layout-related HTML work, use the [maintain-site-css skill](.agents/skills/maintain-site-css/SKILL.md) for selector tracing and focused visual checks. The rules in this file remain the source of truth for repository conventions.

Put site-specific styling in `assets/css/one-page.css`, not inline in `index.html` and not in the unlinked root `style.css`. Preserve the `main.css` then `one-page.css` load order.

`one-page.css` has a structural single-page layer followed by a liquid-glass visual layer. Extend the appropriate existing layer instead of adding another stylesheet or scattered overrides. Reuse the existing `--glass-*` variables for repeated visual values.

Keep responsive rules close to the styles they modify. Reuse the current `980px`, `736px`, and `480px` breakpoints unless a new one is genuinely necessary, and preserve reduced-motion and reduced-transparency behavior.

Do not directly edit the generated `assets/css/main.css` for ordinary site changes. Put site-specific changes in `one-page.css`. If a task genuinely requires changing the baseline theme, update the Sass source only when its compiled CSS can be reproduced reliably; otherwise explain the missing build workflow before proceeding.

## JavaScript, comments, and dependencies

Keep interactions progressively enhanced and dependency-free where practical. Add small page behavior to `assets/js/main.js`; do not modify minified vendor files for custom work.

Comments should capture a non-obvious contract or reason—such as CSS load order, the navigation/section relationship, a browser workaround, or an accessibility constraint—not narrate obvious code. Update a nearby comment when changing the contract it describes.

Before adding a dependency or package tooling, confirm that the existing static stack cannot solve the problem cleanly and that the maintenance cost is justified. This repository currently has no package manifest, build, lint, format, or deployment configuration; its automated tests are limited to the dependency-free security checks below.

## Security boundaries

For security audits or hardening, and for changes to JavaScript, dependencies, automatically loaded external resources, forms, embeds, network requests, CSP or other security metadata, secrets, GitHub Actions, or Pages deployment, use the [maintain-site-security skill](.agents/skills/maintain-site-security/SKILL.md). Ordinary copy and layout work does not require it unless the change crosses one of those boundaries.

Keep browser-executable code local and limited to one classic script, `assets/js/main.js`. The single-script and no-package-tooling checks enforce repository conventions; an authorized architectural change must update those checks and the documentation together. Google Fonts and the Google Drive resume thumbnail are the approved automatically loaded third-party resources; adding another origin or any external JavaScript requires explicit user approval and corresponding updates to the CSP, security checker, and documentation.

Never commit credentials, tokens, private keys, or other secrets. If one is discovered, do not reproduce it in output; identify its location safely and advise the user to revoke or rotate it. Do not weaken the CSP with wildcards, a broad `https:` source, `'unsafe-inline'`, or `'unsafe-eval'` unless the user explicitly approves the documented tradeoff.

GitHub Actions must use minimal permissions and immutable full-commit action references. Prefer `pull_request` to `pull_request_target`; never expose secrets or write-capable credentials to untrusted pull-request code.

## Preserve behavior and validate

Preserve the visual design, responsiveness, anchors, navigation, keyboard access, skip link, focus styles, image alt text, and external-link safety unless the task explicitly changes them. Keep external links opening in a new tab paired with `rel="noopener noreferrer"`.

For all code changes, run `python3 .github/scripts/check_site_security.py` and `git diff --check`. Run `node --check assets/js/main.js` when JavaScript changes. When the security checker or workflow changes, also run `python3 -m unittest discover -s .github/scripts -p 'test_*.py'`.

Treat security failures and repository-rule failures as blocking. JavaScript review advisories are non-blocking prompts for manual inspection, not confirmed vulnerabilities; text matches can include comments or strings and miss dynamic or aliased operations. Review changed JavaScript even when automated checks pass.

The workflow checker intentionally supports a limited block-YAML format. Review unsupported structures manually and update the checker before adopting them; do not bypass a failure by assuming the workflow is safe. Command-presence checks do not prove execution. Verify the GitHub run separately, and do not infer branch protection or account settings from local results.

For user-visible changes, serve the site locally with `python3 -m http.server 8000`, inspect the affected sections at desktop and narrow widths, then stop the server. Test affected anchors and keyboard navigation. Capture desktop and narrow screenshots for the handoff; do not commit validation screenshots unless the user asks. If browser-based inspection is unavailable, report that clearly instead of claiming it was completed.

In the final handoff, explain the result in plain language and list any automatically loaded external origins added or removed; say explicitly when there were none.

Potential cleanup work—such as auditing the unlinked `style.css`, creating a reproducible Sass workflow, or optimizing large images—should be a separate, deliberate task.
