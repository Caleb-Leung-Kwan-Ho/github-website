# Maintaining the site

Start with the [README file map](../README.md#where-to-edit). Portfolio, Personal Hobbies, Project Lab, and My Websites each keep their content, styles, and behavior under `sites/`; DVD Project Lab is temporarily disabled. My Websites is an Internet Explorer-style directory window maintained in `sites/my-websites/`.

## How a page reaches the browser

`desktop/page.html` contains the outer page and window frames. Its include markers insert the `content.html` fragment from each of `sites/portfolio/`, `sites/hobbies/`, `sites/projects/`, and `sites/my-websites/`. The dedicated `<!-- project-catalogue -->` marker in Project Lab is rendered from `sites/projects/projects.json` by `scripts/project_content.py`. The directory's `<!-- website-shortcuts -->` marker is rendered from `sites/my-websites/websites.json` and its shared `shortcut.html` template by `scripts/website_content.py`. Both renderers run through `scripts/build_site.py`; no JSON is fetched by the browser. Running `python3 scripts/build_site.py` writes the complete root `index.html`.

Visitors receive that complete HTML immediately. The browser never fetches HTML fragments to open a window. The content remains readable through the existing no-JavaScript fallback.

`PROJECT_LAB_ENABLED` in `scripts/build_site.py` defaults to `False`. The paired `<!-- project-lab:start -->` / `<!-- project-lab:end -->` blocks omit its window, Start entry, and taskbar button before includes are expanded. The directory record's `"feature": "project-lab"` uses that same flag to omit its shortcut; it does not introduce another enable switch. Any future lab shortcut or link must use the same gate. Its factory returns before installing observers, listeners, or animation work when the window is absent. Disabled lab URLs fall back to the portfolio, and the no-JavaScript view cannot expose the omitted content. Set the flag to `True` and rebuild to re-enable; set it back to `False` and rebuild after a temporary preview. Keep the source files, styles, assets, catalogue, and route handling intact.

`assets/css/main.css` remains the original theme. `assets/css/one-page.css` loads desktop, portfolio, hobbies, Project Lab, and My Websites styles in that order. Keep that order: moving files does not isolate CSS, so site-specific selectors must stay limited to their own content.

`assets/js/main.js` connects the existing sites to the shared desktop. Browser-native modules keep responsibilities in separate files without a bundler or package manager.

## Who owns what

- **Desktop:** window movement and resizing, focus, minimize/maximize/close, Start, taskbar, and common menu behavior. Window labels and menu entries are declared in `desktop/page.html`.
- **Navigation:** shareable fragments and browser history. It finds the site that owns a destination and asks that site to navigate there.
- **Portfolio:** folder views, the Work case-study preview, the address label, its Back/Forward buttons, and professional content. Work is the default view; the identity header remains above every view. The local module hides inactive `.profile-section` elements only after enhancement, preserving the full readable document without JavaScript. Keep each section's ID, heading, and sidebar link aligned; `data-section-name` supplies its location label, and optional `data-item-count` supplies a real collection count. The Work preview's Overview / Engineering details tabs are also enhanced locally, with both panels readable without JavaScript.
- **Hobbies:** its internal scrolling, language choices, translations, and decorative layout.
- **Project Lab:** the DVD animation, expandable project workspace, catalogue filtering, selection, roadmaps, and updates.
- **My Websites:** `sites/my-websites/` owns destination `#websites`, the `websites.json` catalogue, shared `shortcut.html` row template, Favorites panel/menu, scoped styles, and directory behavior. Its window ID remains `websites`, and its frame stays in `desktop/page.html`. The portfolio has a small footer link to the directory, rather than another directory section. `#my-folder` and `#hobbies` are aliases for `#websites`; empty anchor markers also preserve them without JavaScript. Each row is one keyboard-accessible link. The local initializer derives Favorites links and counts from the rendered rows before shared navigation binds links, so adding an entry needs no second list or site-specific navigation branch. Favorites is closed by default and scrolls independently; Escape closes it before the window, restoring focus when necessary. Home shows the directory, Back/Forward traverse the shared desktop history, and website links open the destination site's existing window.

Site code uses the shared desktop through a small set of callbacks; it does not implement its own dragging or taskbar. The entry point lists the available sites explicitly, with Portfolio first as the default. Keep one window per site and keep each site's specific content, styles, and behavior in its own `sites/<name>/` folder. Navigation passes a clicked link as the window opener so closing a window restores focus to its shortcut. Adding a framework, embedded webpages, or dynamically downloaded HTML would be a separate architectural decision.

## Design for a growing collection

More websites will be added over time. Every new website must live under `sites/<name>/`, with its `content.html`, `styles.css`, `site.js`, and any site-specific helper modules. Shared desktop behavior stays in `desktop/`; visual assets continue to follow the existing `images/` convention.

Apply **open for extension, closed for modification** through these ownership boundaries. Implement new site behavior inside its folder and reuse the existing site callbacks and window controls. Adding a site should not require changing another site's implementation or adding site-specific conditions to shared window and navigation logic.

Small integration edits are expected: window and launch markup, factory registration, stylesheet imports, the no-JavaScript fallback, the exact security allowlist, documentation, and rebuilt HTML. The extension steps below identify these points. When a genuinely shared requirement needs a shared interface change, explain why and validate the affected existing sites. Avoid speculative abstractions or unrelated refactoring.

Consider **build-time rendering** when a collection will gain entries regularly, such as a growing list of posts: keep each entry as data and let one shared template produce consistent HTML during `scripts/build_site.py`. This avoids copying list-item markup and drifting details. Keep small and stable or one-off content in `content.html`; add a renderer only when expected growth justifies its code. Keep its data and template with the owning site, and use the existing standard-library build with validation and HTML escaping. My Websites and Project Lab are current examples.

Visitor navigation must grow alongside the folders:

- Keep every site discoverable through an overview or navigation list. **My Websites** opens the directory directly from the desktop, Start menu, or portfolio footer. Each row pairs a website's thumbnail with its name, description, and optional topics; the optional Favorites panel provides a compact version of the same collection.
- Let lists and folder views accommodate additional entries without layouts or navigation logic tied to today's item count. Keep desktop and featured shortcuts selective as the collection grows.
- Use clear labels and introduce grouping when the collection warrants it. Preserve direct links, keyboard access, and usable scrolling at desktop and narrow widths as entries increase.

The professional portfolio remains a curated selection of relevant experience. Project Lab serves casual experiments and progress updates; the directory helps visitors find websites. These purposes guide what is listed in each place without changing the `sites/<name>/` ownership rule.

## Common edits

- **Change text or links:** edit the appropriate `content.html`, rebuild, and include the updated `index.html` with the change. Preserve existing section IDs so bookmarks keep working.
- **Update My Websites:** edit `sites/my-websites/websites.json`, then rebuild. Each record requires a `name` and local home-fragment `target`, for example `{"name": "Personal Hobbies", "target": "#hobby-top"}`. Optional fields are `description` (nonempty text), `thumbnail` (a safe local image path under `images/`), `topics` (a list of nonempty text), and `"feature": "project-lab"` (the existing lab gate). Thumbnail paths reject traversal, remote URLs, and query/hash components; omitted thumbnails use `images/website-shortcut.svg`. Put directory artwork in `images/websites/`; keep the supplied hobby thumbnail uncropped. Every record uses `sites/my-websites/shortcut.html`, a standard-library `string.Template` with `$name`, `$target`, `$thumbnail`, `$description`, and `$topics` placeholders. The renderer escapes text and builds the optional description/topic paragraphs. Keep the `<!-- website-shortcuts -->` marker inside the directory list in `content.html`; add records rather than copying rows or Favorites. A directory record links to an integrated site; it does not create the site's content or window.
- **Update Project Lab:** edit `sites/projects/projects.json`, then rebuild. Preserve stable project, milestone, and update IDs. Use the supported project/milestone statuses; optional update dates use `YYYY-MM-DD` or `null`. Omit unconfirmed links and facts. The renderer validates relationships, IDs, dates, and HTTPS links and escapes content. Search labels, project rows, roadmaps, related links, and update notes come from that same catalogue.
- **Translate Hobbies:** update its English HTML and the corresponding Japanese/Hong Kong Traditional Chinese entries in `translations.js`. Keep the `data-hobby-text` keys aligned.
- **Change appearance:** edit the owning site’s CSS, or `desktop/styles.css` for shared controls. Keep the existing responsive breakpoints and focus styles.
- **Change window behavior:** edit the relevant desktop module. Check all existing windows because they share it.
- **Add a Start menu entry:** put it in `#start-programs` in `desktop/page.html`, or in `#start-featured` if it is one of the most important shortcuts. Keep each entry in only one view; All Programs scrolls within the menu as the list grows.

Asset links in HTML are relative to the published root `index.html`, even inside a content fragment. CSS image links are relative to the CSS file itself. Keep large artwork and the base theme in their current locations unless a separate task calls for changing them.

## Adding a mini-site later

For each future website, follow these steps:

1. Create `sites/<name>/content.html`, `styles.css`, and `site.js`, using a short lowercase name with optional hyphens. Author an HTML fragment, not another full page. Give its destinations unique, stable IDs and scope its CSS under a site-specific class.
2. Add one window to `desktop/page.html`, following the existing `.os-window` structure: a unique `data-window`, labelled title, `data-titlebar`, window controls, and a focusable content area. Insert `<!-- include: sites/<name>/content.html -->` inside it. Keep the new window and its matching `data-task-window` button initially `hidden`. Add one record to `sites/my-websites/websites.json` with the site's display `name` and home-fragment `target`, plus a description, local thumbnail, and topics when useful. The shared `shortcut.html` template supplies its directory row; do not copy that markup or Favorites links per site. The actual link uses the home fragment, and the directory count comes from the generated links after build-time feature gates. Add a Start entry when appropriate; keep desktop shortcuts selective. Reuse the shared controls rather than copying their JavaScript.
3. Export a site factory from `site.js`. Use the existing factories as examples; its returned object connects content to the desktop:

   | Member | Purpose |
   | --- | --- |
   | `id`, `element`, `homeId` | Match the window's `data-window`, reference its element, and identify its home destination. |
   | `acceptsTarget(target)` | Recognize destinations belonging to this site; return false for `null` or another site's content. |
   | `navigate(target)` | Reveal the destination in the site's content pane without moving the desktop. Portfolio switches folder views; other sites may scroll to a section. |
   | `getLinkId()` | Supply the destination for the shared Copy link menu, if included. |
   | Optional callbacks | `focus()` chooses a focus target (otherwise the window element must be focusable); `initialize(navigation, desktop)` connects site-specific behavior; `selectLanguage()` supports language menus. |

   Optional `aliases` preserve old destination IDs, and `closeOnEscape` enables Escape-to-close. Keep content behavior here and window management in `desktop/`.

4. Import and create the factory in `assets/js/main.js`; keep Portfolio first because it is the default destination. Use single-line static relative JavaScript imports. Import the new stylesheet after the existing sites in `assets/css/one-page.css`. Add the exact `sites/<name>` path to `MODULE_DIRECTORIES` in `.github/scripts/check_site_security.py` so its local modules are permitted and checked.
5. Link to destinations with ordinary `href="#destination-id"` links, including links from Hobbies. The shared navigation opens the owning site's existing window. Use `data-open-window="<name>"` for a button that opens the window without choosing a destination.
6. Extend `assets/css/noscript.css` to make the new window and its content readable without JavaScript. Its current rules name only the existing windows; a new hidden window will not become readable automatically.
7. Run `python3 scripts/build_site.py`, commit `index.html` with its sources, and follow the checks below. Also check a direct link to the new site, links between sites, directory discovery, and the no-JavaScript fallback. Check that lists still work with additional entries and long names. Update the README file map when adding the folder.

## Before handing off a change

Python 3 is used for assembly and security checks; Node.js is used only for JavaScript syntax checks. No packages need installing.

```sh
python3 scripts/build_site.py --check
python3 -m unittest discover -s .github/scripts -p 'test_*.py'
python3 .github/scripts/check_site_security.py
python3 .github/scripts/check_javascript.py
git diff --check
```

For appearance or behavior changes, preview at desktop and phone widths. Check the affected links, keyboard access, Back/Forward, language switching, and window controls. Restored windows resize from any edge or corner, or through View → Resize window with the arrow keys (Shift for larger steps, Enter to save, Escape to cancel). Each site uses the shared `site-window` CSS container so its layout follows the window width. Maximize/restore preserves the chosen size; View → Reset size and position or a browser viewport change restores the fitted layout. The existing mobile drag behavior lets a window slide down while keeping its title bar reachable; maximize/reset or reopening a minimized window restores a fitted layout.

The GitHub workflow validates the committed source and output. It does not publish the site or configure branch protection. Security checks enforce local modules and the existing external-resource policy; JavaScript advisories still require human review.

## Files usually left alone

- `index.html`: generated output; rebuild it instead of editing it.
- `assets/css/main.css` and `assets/sass/`: inherited theme; no configured Sass build.
- `assets/css/noscript.css`: readable fallback when JavaScript is disabled.
- Root `style.css`: unlinked legacy file; cleanup is a separate task.
- `LICENSE.txt`: theme license and attribution.
