# Maintaining this website

## Keep it simple

This is a static, single-page personal website. Keep it that way unless a task explicitly calls for an architectural change. Prefer a small, focused HTML, CSS, or vanilla-JavaScript edit over a framework, component runtime, state manager, build system, or dependency.

These are repository defaults, not prohibitions against necessary changes. If a request genuinely requires departing from them, explain the reason and tradeoff before making the change.

Make the smallest coherent change that solves the request. Do not combine a content update with an unrelated redesign or cleanup.

## Work in the existing shapes

- `index.html` is the page entry point and source of the site content, sections, navigation, and asset links.
- `assets/css/one-page.css` is the hand-authored site-specific styling layer. It is intentionally loaded after the compiled HTML5 UP base theme in `assets/css/main.css`.
- `assets/sass/` is the source for the baseline theme CSS. `assets/js/main.js` contains the site’s only loaded custom behavior.
- Use `images/` for local visual assets. Keep `LICENSE.txt` and the theme attribution comments intact.

For a new main section, follow the existing `profile-section` pattern: give the section a stable `id`, a heading connected with `aria-labelledby`, and a matching `#site-nav` link. The navigation href-to-section mapping is used by `main.js` to set the active link, so keep them aligned.

Reuse an existing class when the new element represents the same component, layout pattern, or behavior. Create a new descriptive class when an element has a distinct styling role; section-specific classes are acceptable when they keep the code understandable.

Extract a shared class when multiple elements genuinely share a repeated concept. Do not force unrelated elements to share a class merely because their current styles happen to be similar. Avoid unnecessary wrappers and isolated utility classes that do not belong to an intentional utility system.

## CSS and responsive behavior

Put site-specific styling in `assets/css/one-page.css`, not inline in `index.html` and not in the unlinked root `style.css`. Preserve the `main.css` then `one-page.css` load order.

`one-page.css` has a structural single-page layer followed by a liquid-glass visual layer. Extend the appropriate existing layer instead of adding another stylesheet or scattered overrides. Reuse the existing `--glass-*` variables for repeated visual values.

Keep responsive rules close to the styles they modify. Reuse the current `980px`, `736px`, and `480px` breakpoints unless a new one is genuinely necessary, and preserve reduced-motion and reduced-transparency behavior.

Do not directly edit the generated `assets/css/main.css` for ordinary site changes. Put site-specific changes in `one-page.css`. If a task genuinely requires changing the baseline theme, update the Sass source only when its compiled CSS can be reproduced reliably; otherwise explain the missing build workflow before proceeding.

## JavaScript, comments, and dependencies

Keep interactions progressively enhanced and dependency-free where practical. Add small page behavior to `assets/js/main.js`; do not modify minified vendor files for custom work.

Comments should capture a non-obvious contract or reason—such as CSS load order, the navigation/section relationship, a browser workaround, or an accessibility constraint—not narrate obvious code. Update a nearby comment when changing the contract it describes.

Before adding a dependency or package tooling, confirm that the existing static stack cannot solve the problem cleanly and that the maintenance cost is justified. This repository currently has no package manifest, build, test, lint, format, or deployment configuration.

## Preserve behavior and validate

Preserve the visual design, responsiveness, anchors, navigation, keyboard access, skip link, focus styles, image alt text, and external-link safety unless the task explicitly changes them. Keep external links opening in a new tab paired with `rel="noopener noreferrer"`.

For all code changes, run `git diff --check`. Run `node --check assets/js/main.js` when JavaScript changes.

For user-visible changes, serve the site locally with `python3 -m http.server 8000`, inspect the affected sections at desktop and narrow widths, then stop the server. Test affected anchors and keyboard navigation. If browser-based inspection is unavailable, report that clearly instead of claiming it was completed.

Potential cleanup work—such as auditing the unlinked `style.css`, unused template JavaScript, a reproducible Sass workflow, or large images—should be a separate, deliberate task.
