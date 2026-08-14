# Maintaining this personal website

## Keep the architecture simple

This repository is a static, single-page personal website. It has no application framework, component runtime, package manifest, checked-in build script, test suite, linter, formatter, or deployment configuration. The site is intentionally easy to understand: the page structure and content live in one HTML document, with a small amount of vanilla JavaScript and layered CSS.

Preserve that simplicity. A content, layout, or small interaction change should normally be a focused edit to the existing files—not a reason to add a framework, a client-side router, a state-management library, a template system, or a build pipeline.

Make the smallest coherent change that solves the requested problem. Do not combine routine updates with an unrelated redesign or cleanup.

## Repository map

- `index.html` is the site entry point and the source of all page content. It contains the header, the primary navigation, the `main` sections, the footer, metadata, and the asset/script links.
- `assets/css/main.css` is the compiled baseline **Dimension by HTML5 UP** theme. It supplies reset, typography, image, icon, layout, and background styles.
- `assets/css/one-page.css` is the active hand-authored customization layer, loaded after `main.css`. It turns the base theme into the scrolling profile site and contains both the one-page layout rules and the liquid-glass visual treatment.
- `assets/css/noscript.css` is the no-JavaScript fallback stylesheet.
- `assets/sass/` contains the Sass source for the baseline `main.css` and `noscript.css` files. Its `base/`, `components/`, `layout/`, and `libs/` folders reflect the upstream theme structure; `main.scss` is the import entry point.
- `assets/js/main.js` is the only JavaScript loaded by `index.html`. It removes the loading state and keeps the active navigation link in sync with the visible section. It is deliberately dependency-free.
- `assets/js/browser.min.js`, `breakpoints.min.js`, `jquery.min.js`, and `util.js` are retained template/vendor assets but are not loaded by the current page. Do not delete or revive them as part of an unrelated feature.
- `assets/webfonts/` and `assets/css/fontawesome-all.min.css` support the Font Awesome icons used in the header and contact links.
- `images/` holds the background, overlay, and profile photograph. Keep page-relative asset paths working from `index.html` and CSS.
- `style.css` is not linked by `index.html`; do not add new styles there. Treat its removal or consolidation as a separately scoped cleanup after verifying it has no external consumer.
- `LICENSE.txt` and the attribution comments in the theme source are part of the inherited HTML5 UP material. Preserve applicable attribution and license notices when modifying or replacing that material.

The current checked-out repository has no tracked deployment configuration. Keep `index.html` usable as a static site with its current relative paths; do not assume a server-side runtime or introduce a build-dependent deployment process without an explicit request.

## Page and navigation contract

The site is a scrolling document, not a collection of routes. The primary sections currently use the IDs `intro`, `resume`, `skills`, `beyond`, and `contact`.

When adding or renaming a main section:

1. Use `<section id="..." class="profile-section" aria-labelledby="...-title">` inside `#main`.
2. Give it a meaningful heading whose `id` matches `aria-labelledby`; use the established `.section-heading` and optional `.eyebrow` pattern where appropriate.
3. Add, rename, or reorder the matching `#site-nav a[href="#..."]` link at the same time.
4. Preserve stable anchors unless a URL change is explicitly intended. Navigation links, the header logo, bookmarks, and `assets/js/main.js` depend on those IDs.

`assets/js/main.js` derives its section list from `#site-nav` anchor targets and applies `aria-current="page"`. Keep every in-page navigation target valid, unique, and present in the document. If navigation behavior changes, preserve keyboard usability and the active-state semantics rather than replacing them with a visual-only solution.

Use the existing semantic structure (`header`, `nav`, `main`, `section`, `footer`, real headings, lists, and links) before adding wrapper elements. Keep the skip link, heading associations, descriptive image `alt` text, visible focus states, and `rel="noopener noreferrer"` on external links that open in a new tab.

## HTML organization and reuse

The single page is small enough that content belongs in `index.html`. Do not introduce a data layer or a component system merely to render a handful of biography entries, skills, or links.

Reuse the concepts already present before inventing new markup or classes:

- `.profile-section` for major page sections
- `.section-heading` and `.eyebrow` for section introductions
- `.profile-hero` and `.profile-image` for the introductory layout
- `.skill-groups`, `.skill-group`, `.skill-list`, and `.skill` for grouped skill chips
- `.learning-block` for the current-learning panel
- `.contact-section` and the existing Font Awesome icon-list pattern for contact links

Keep code local when it describes one section. Extract a shared class or helper only when it names a genuine reusable visual/content concept, separates a clear responsibility, or makes multiple uses easier to read and maintain. Do not force unrelated sections into a generic abstraction just to eliminate a few repeated lines, and do not split simple markup into a proliferation of wrappers.

## Styling rules

`main.css` is the base theme and `one-page.css` is the custom layer. Preserve that load order and place new site-specific styles in `assets/css/one-page.css`, not inline in `index.html` and not in the unused root `style.css`.

`one-page.css` deliberately has two related layers:

1. Its opening rules establish the single-page layout, sticky navigation, section layouts, and responsive behavior.
2. The later “Liquid glass treatment” refines those same surfaces visually with the `--glass-*` custom properties.

Extend the appropriate existing layer instead of adding a third stylesheet or a scattered collection of overrides. For a repeated color, edge, highlight, shadow, or glass-surface value, prefer the existing `--glass-*` variables. For a one-off, section-specific layout rule, use a specific class that describes that section rather than a vague utility class.

The custom stylesheet uses responsive breakpoints at `980px`, `736px`, and `480px`, plus reduced-motion and reduced-transparency preferences. Keep base and responsive rules near the relevant component, reuse those thresholds unless the design genuinely needs another one, and validate changes at desktop and narrow widths. Do not duplicate equivalent media-query blocks or add a second styling system.

The Sass files remain the source for the baseline theme CSS. If a task truly requires changing the base theme or no-JavaScript fallback, edit the relevant file in `assets/sass/` and regenerate its matching compiled CSS in the same change. There is no checked-in Sass command or dependency definition, so do not silently create a new toolchain or make long-lived baseline changes only in generated CSS. Prefer `one-page.css` for ordinary site-specific changes.

## JavaScript and dependencies

Keep interactions small and progressively enhanced. Write new behavior in modern, readable vanilla JavaScript alongside the existing code in `assets/js/main.js` when it directly supports this page. Avoid adding a library for behavior that the DOM, CSS, or a short isolated function can handle.

Before adding a dependency or tooling, confirm that the current static stack cannot solve the problem cleanly and that the maintenance cost is justified. The repository currently has no package manager metadata; adding one is an architectural change and requires an explicit reason, reproducible commands, and a scoped task.

Do not modify minified vendor files for custom behavior. If an upstream asset needs a deliberate upgrade or removal, audit every reference, license implication, and fallback in a dedicated change.

## Assets, content, and external links

Add images under `images/` with clear names, suitable dimensions, and compression appropriate to their rendered size. Update `alt` text, dimensions/aspect-ratio styling, and responsive presentation together when replacing a visible image. Avoid adding a large image when a web-sized version will do.

The resume preview and several skill links point to external services. Preserve their destination, target behavior, accessible labels, and fallback readability unless the requested change is specifically about that content. Never expose credentials or put secrets in this static repository.

## Refactoring and scope discipline

Preserve visual appearance, responsive layout, anchors, navigation, accessibility behavior, and static deployment behavior during cleanup unless the task explicitly changes them. A small nearby refactor is appropriate only when it directly makes the requested change clearer or prevents immediate duplication.

Comments should explain a non-obvious reason, compatibility constraint, or dependency—not restate what clear HTML, CSS, or JavaScript already says. Prefer descriptive names and straightforward control flow over clever shorthand.

Potential maintenance follow-ups, not work to fold into routine content changes, are:

- audit the unlinked `style.css` and unused template JavaScript assets before removing them;
- decide and document a reproducible Sass compilation workflow if baseline theme styling will be actively edited;
- optimize large image assets, especially when changing the profile photograph or background.

## Validation

There are no repository-provided build, test, lint, format, or type-check commands to run. Do not claim that `npm test`, a framework build, or a Sass build exists unless a task explicitly adds and documents one.

For a page change, use the checks that match the edit:

```sh
# Serve the static site locally from the repository root.
python3 -m http.server 8000

# Check the edited first-party script for syntax when changing it.
node --check assets/js/main.js

# Catch whitespace errors in the pending change.
git diff --check
```

Then inspect the site in a browser. Verify the changed content at a desktop width and around the existing narrow breakpoints; follow every affected navigation anchor; tab through the header, links, and skip link; check external links; and, when styling or motion changes, verify the reduced-motion/reduced-transparency fallbacks. If JavaScript changes, confirm the navigation state updates while scrolling and clicking anchors, and that the page remains readable and navigable without JavaScript.

For documentation-only changes, review the rendered Markdown and run `git diff --check`.
