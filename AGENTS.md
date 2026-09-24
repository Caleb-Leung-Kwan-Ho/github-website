# Maintaining this website

## Keep it simple

This is a static, single-page personal website with a shared desktop and separately maintained sites. Keep the dependency-free HTML assembly and browser-native JavaScript modules simple. Prefer a focused edit over a framework, component runtime, state manager, or dependency.

These are repository defaults, not prohibitions against necessary changes. If a request genuinely requires departing from them, explain the reason and tradeoff before making the change.

Make the smallest coherent change that solves the request. Do not combine a content update with an unrelated redesign or cleanup.

For requests limited to planning or review, keep the work read-only. Agreement on a plan is not permission to edit; wait for an explicit implementation request. Once implementation is requested, perform the relevant local validation below as part of that work.

## Keep personal content factual

Preserve the meaning and scope of factual claims when editing copy. Base additions on user-provided information or verifiable sources; do not invent or inflate credentials, dates, achievements, ownership, proficiency, or metrics. If a fact needed for the requested change is missing or conflicting, ask rather than infer it.

## Work in the existing shapes

- `desktop/page.html` owns the page shell and window placement. Its `browser-window` markers use `desktop/browser-window.html` for the shared Internet Explorer frame, with `BrowserWindow` metadata in `scripts/site_config.py`; Portfolio and archived Project Lab retain their authored frames. Each active site's `content.html` owns its content; archived Project Lab and My Websites also use site-owned data for build-time rendering, and My Websites has a shared shortcut template. `scripts/site_config.py` lists active sites and their source folders. Run `python3 scripts/build_site.py` after HTML or site-configuration edits; commit the generated `index.html`, `assets/js/site-registry.js`, and `assets/css/one-page.css` with their sources rather than editing those outputs directly.
- `desktop/styles.css` and each active site's `styles.css` own their respective styling. The generated `assets/css/one-page.css` imports desktop styles followed by enabled site styles in configuration order, after the compiled HTML5 UP theme in `assets/css/main.css`.
- `assets/js/main.js` connects the desktop to the generated `assets/js/site-registry.js`, which imports enabled site factories. `desktop/*.js` owns common windows, menus, dragging, and navigation; each active site's `site.js` owns its content behavior. Hobbies translations live in `sites/hobbies/translations.js`.
- `assets/sass/` remains the source for the baseline theme CSS. See `README.md` and `docs/MAINTENANCE.md` for the concise file map and workflow.
- Use `images/` for local visual assets. Keep `LICENSE.txt` and the theme attribution comments intact.

For a new portfolio section, follow the existing `profile-section` pattern: give the section a stable `id`, a heading connected with `aria-labelledby`, and a matching `#site-nav` link. `sites/portfolio/site.js` uses that mapping to set the active link, so keep them aligned. Keep site behavior behind the existing site callbacks; the desktop should not contain site-specific selectors or duplicate window logic.

Reuse an existing class when the new element represents the same component, layout pattern, or behavior. Create a new descriptive class when an element has a distinct styling role; section-specific classes are acceptable when they keep the code understandable.

Extract a shared class when multiple elements genuinely share a repeated concept. Do not force unrelated elements to share a class merely because their current styles happen to be similar. Avoid unnecessary wrappers and isolated utility classes that do not belong to an intentional utility system.

## Design for growth

The website collection will continue to grow. Put every future website in its own `sites/<name>/` folder with `content.html`, `styles.css`, `site.js`, and any site-specific helper modules. Follow the extension workflow in `docs/MAINTENANCE.md`.

Future non-portfolio sites use the shared Internet Explorer frame: title bar, File/Edit/View/Favorites/Tools/Help menus, Back/Forward/Home/Favorites toolbar, and address row. Register its browser metadata and marker instead of copying the header. Keep browser controls and Favorites behavior in `desktop/browser.js`, shared styling in `desktop/styles.css`, and each site's design below the header in its own folder. Portfolio keeps its separate frame; leave archived Project Lab unchanged unless its migration is requested.

Apply open for extension, closed for modification: keep new site behavior in its own folder and reuse the shared site callbacks and desktop controls. Limit edits to existing code to the documented integration points and genuinely shared requirements. Adding a site should not require changes to unrelated sites or site-specific branches in shared desktop logic. Explain necessary shared interface changes and validate the affected existing behavior; avoid speculative abstractions.

Use build-time rendering selectively for repeated collections expected to keep growing when one data record per item and a shared template prevent copied markup and inconsistent entries. Keep small and stable or one-off content as authored HTML. Reuse the existing Python standard-library build, keep data and templates with the owning site, and add only the renderer code the repetition justifies. Validate and escape generated content.

When implementing or reviewing visitor navigation, account for a growing number of sites, lists, items, and folders. Keep sites discoverable, shortcuts selective, and lists usable beyond today's item count, including keyboard access and narrow layouts. The My Websites directory is the portfolio’s overview of personal sites; add an entry there when adding a website. Keep professional project selection curated separately from casual project updates and website discovery. These principles guide authorized changes; they do not authorize an unrelated UI redesign.

## CSS and responsive behavior

For CSS or layout-related HTML work, use the [maintain-site-css skill](.agents/skills/maintain-site-css/SKILL.md) for selector tracing and focused visual checks. The rules in this file remain the source of truth for repository conventions.

Do not add or modify CSS, inline styles, or styling-related markup unless the user explicitly requests a visual or styling change. Content, metadata, crawler, and SEO work must preserve the existing presentation and must not introduce styling-only classes.

Put styling in the owning desktop or site stylesheet, not inline in HTML and not in the unlinked root `style.css`. Preserve the `main.css` then `one-page.css` load order and the site order in `scripts/site_config.py`.

Keep selectors limited to the component or site they belong to. Moving CSS into another file does not isolate it. Shared window controls belong to the desktop; reuse the existing CSS variables for repeated visual values.

Keep responsive rules close to the styles they modify. Reuse the current `980px`, `736px`, and `480px` breakpoints unless a new one is genuinely necessary, and preserve reduced-motion and reduced-transparency behavior.

Do not directly edit the generated `assets/css/main.css` for ordinary site changes. If a task genuinely requires changing the baseline theme, update the Sass source only when its compiled CSS can be reproduced reliably; otherwise explain the missing Sass build workflow before proceeding.

## JavaScript, comments, and dependencies

Keep interactions progressively enhanced and dependency-free. Add behavior to the owning local module, register its factory in `scripts/site_config.py`, and keep `assets/js/main.js` as composition only. The build generates single-line static relative imports in `assets/js/site-registry.js`; review and update the checker's limited grammar before adopting other module syntax. Do not modify minified vendor files for custom work.

Comments should capture a non-obvious contract or reason—such as CSS load order, the navigation/section relationship, a browser workaround, or an accessibility constraint—not narrate obvious code. Update a nearby comment when changing the contract it describes.

Before adding a dependency or package tooling, confirm that the existing static stack cannot solve the problem cleanly and that the maintenance cost is justified. The HTML assembler uses Python's standard library. There is no package manifest, bundler, or deployment configuration.

## Security boundaries

For security audits or hardening, and for changes to JavaScript, dependencies, automatically loaded external resources, forms, embeds, network requests, CSP or other security metadata, secrets, GitHub Actions, or Pages deployment, use the [maintain-site-security skill](.agents/skills/maintain-site-security/SKILL.md). Ordinary copy and layout work does not require it unless the change crosses one of those boundaries.

Keep browser-executable code local, starting at the single module entry `assets/js/main.js`, with static relative imports in the approved desktop and site locations. The checker audits the reachable module graph; no-package-tooling rules remain in force. An authorized architectural change must update checks and documentation together. Google Fonts and the Google Drive resume thumbnail are the approved automatically loaded third-party resources; adding another origin or any external JavaScript requires explicit user approval and corresponding updates to the CSP, security checker, and documentation.

Never commit credentials, tokens, private keys, or other secrets. If one is discovered, do not reproduce it in output; identify its location safely and advise the user to revoke or rotate it. Do not weaken the CSP with wildcards, a broad `https:` source, `'unsafe-inline'`, or `'unsafe-eval'` unless the user explicitly approves the documented tradeoff.

GitHub Actions must use minimal permissions and immutable full-commit action references. Prefer `pull_request` to `pull_request_target`; never expose secrets or write-capable credentials to untrusted pull-request code.

## Preserve behavior and validate

Preserve the visual design, responsiveness, anchors, navigation, keyboard access, skip link, focus styles, image alt text, and external-link safety unless the task explicitly changes them. Keep external links opening in a new tab paired with `rel="noopener noreferrer"`.

For all code changes, run `python3 scripts/build_site.py --check`, `python3 .github/scripts/check_site_security.py`, and `git diff --check`. Run `python3 .github/scripts/check_javascript.py` when JavaScript changes. When assembly, the security checker, or workflow changes, also run `python3 -m unittest discover -s .github/scripts -p 'test_*.py'`.

Treat security failures and repository-rule failures as blocking. JavaScript review advisories are non-blocking prompts for manual inspection, not confirmed vulnerabilities; text matches can include comments or strings and miss dynamic or aliased operations. Review changed JavaScript even when automated checks pass.

The workflow checker intentionally supports a limited block-YAML format. Review unsupported structures manually and update the checker before adopting them; do not bypass a failure by assuming the workflow is safe. Command-presence checks do not prove execution. Verify the GitHub run separately, and do not infer branch protection or account settings from local results.

For user-visible changes, serve the site locally with `python3 -m http.server 8000`, inspect the affected sections at desktop and narrow widths, then stop the server. Test affected anchors and keyboard navigation. Capture desktop and narrow screenshots for the handoff; do not commit validation screenshots unless the user asks. If browser-based inspection is unavailable, report that clearly instead of claiming it was completed.

In the final handoff, explain the result in plain language and list any automatically loaded external origins added or removed; say explicitly when there were none.

Potential cleanup work—such as auditing the unlinked `style.css`, creating a reproducible Sass workflow, or optimizing large images—should be a separate, deliberate task.
