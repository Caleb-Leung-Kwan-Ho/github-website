# Maintaining the site

Start with the [README file map](../README.md#where-to-edit). Portfolio, Personal Hobbies, and My Websites each keep their content, styles, and behavior under `sites/`; DVD Project Lab is archived in `sites/archieve/projects/`. Hobbies and My Websites share an Internet Explorer window header maintained in `desktop/`; the portfolio keeps its own Explorer frame.

## How a page reaches the browser

`desktop/page.html` contains the outer page, the portfolio frame, and markers such as `<!-- browser-window: hobbies -->`. `scripts/browser_content.py` expands each browser-window marker using `desktop/browser-window.html` and its site's `BrowserWindow(id, title, home_id)` configuration in `scripts/site_config.py`. The build then inserts each enabled site's `content.html` through the usual include markers. The directory's `<!-- website-shortcuts -->` marker is rendered from `sites/my-websites/websites.json` and its shared `shortcut.html` template by `scripts/website_content.py`. If Project Lab is restored and enabled, `scripts/project_content.py` renders its `<!-- project-catalogue -->` marker from `sites/projects/projects.json`. The renderers run through `scripts/build_site.py`; no JSON is fetched by the browser. Running `python3 scripts/build_site.py` writes the complete root `index.html`, `assets/js/site-registry.js`, and `assets/css/one-page.css`.

Visitors receive that complete HTML immediately. The browser never fetches HTML fragments to open a window. The content remains readable through the existing no-JavaScript fallback.

The Project Lab entry in `scripts/site_config.py` is disabled. The paired `<!-- project-lab:start -->` / `<!-- project-lab:end -->` blocks omit its window, Start entry, and taskbar button before includes are expanded. The directory record's `"feature": "project-lab"` uses the same site configuration to omit its shortcut. The build also omits its JavaScript and CSS imports, so moving its folder into the archive does not break startup. Disabled lab URLs fall back to the portfolio, and the no-JavaScript view cannot expose the omitted content. To restore it, move `sites/archieve/projects/` back to `sites/projects/`, enable the Project Lab entry in `scripts/site_config.py`, restore `sites/projects` in the security checker's module allowlist, and rebuild. Other sites remain enabled until they have equivalent HTML gates; the build rejects disabling them prematurely. Follow the archive's `note.md` while it remains archived.

`assets/css/main.css` remains the original theme. The generated `assets/css/one-page.css` loads desktop styles, followed by enabled site styles in configuration order. Keep that order in `scripts/site_config.py`: moving files does not isolate CSS, so site-specific selectors must stay limited to their own content.

`assets/js/main.js` connects the shared desktop to factories from the generated `assets/js/site-registry.js`. The registry imports only enabled sites in configuration order, with Portfolio first as the default. Browser-native modules keep responsibilities in separate files without a bundler or package manager.

## Who owns what

- **Desktop:** window movement and resizing, focus, minimize/maximize/close, Start, taskbar, and common menu behavior. The outer page and portfolio frame live in `desktop/page.html`. Browser-window labels come from `scripts/site_config.py`; their shared frame and menus live in `desktop/browser-window.html`.
- **Shared browser:** `desktop/browser.js` connects browser windows through `setupBrowserWindows(sites, navigation)`. `desktop/browser-window.html` supplies the IE title bar, six menus, Back/Forward/Home/Favorites toolbar, address row, and Favorites panel; `desktop/styles.css` owns their appearance. Each window keeps its own current local address. Home opens `#websites`, and Back/Forward traverse the shared desktop history. Favorites uses the catalogue exposed by a site's optional `getFavorites()` callback. It is closed by default and scrolls independently; Escape closes it before the window and restores focus when necessary. The same header applies to Hobbies, My Websites, and future non-portfolio sites. Archived Project Lab remains unchanged.
- **Navigation:** shareable fragments and browser history. It finds the site that owns a destination and asks that site to navigate there.
- **Portfolio:** folder views, the Work case-study preview, the address label, its Back/Forward buttons, and professional content. Work is the default view; the identity header remains above every view. The local module hides inactive `.profile-section` elements only after enhancement, preserving the full readable document without JavaScript. Keep each section's ID, heading, and sidebar link aligned; `data-section-name` supplies its location label, and optional `data-item-count` supplies a real collection count. The Work preview's Overview / Engineering details tabs are also enhanced locally, with both panels readable without JavaScript.
- **Hobbies:** its internal scrolling, language choices, translations, and decorative layout. It exposes its language options to the shared View menu and handles selection through `selectLanguage()`.
- **Project Lab:** the DVD animation, expandable project workspace, catalogue filtering, selection, roadmaps, and updates.
- **My Websites:** `sites/my-websites/` owns destination `#websites`, the `websites.json` catalogue, shared `shortcut.html` row template, scoped content styles, and directory behavior. Its window ID remains `websites`; its frame uses the shared browser template. The portfolio has a small footer link to the directory, rather than another directory section. `#my-folder` and `#hobbies` are aliases for `#websites`; empty anchor markers also preserve them without JavaScript. Each row is one keyboard-accessible link. The local module derives counts and exposes `getFavorites()` records from the rendered rows; shared browser setup creates Favorites links before navigation binds links. Adding an entry needs no second list or site-specific navigation branch. Website links open the destination site's existing window.

Site code uses the shared desktop through a small set of callbacks; it does not implement its own dragging or taskbar. `scripts/site_config.py` lists the available sites, with Portfolio first as the default. Keep one window per site and keep each active site's specific content, styles, and behavior in its own `sites/<name>/` folder. Navigation passes a clicked link as the window opener so closing a window restores focus to its shortcut. Adding a framework, embedded webpages, or dynamically downloaded HTML would be a separate architectural decision.

## Design for a growing collection

More websites will be added over time. Every new website must live under `sites/<name>/`, with its `content.html`, `styles.css`, `site.js`, and any site-specific helper modules. Shared desktop behavior stays in `desktop/`; visual assets continue to follow the existing `images/` convention.

Apply **open for extension, closed for modification** through these ownership boundaries. Implement new site behavior inside its folder and reuse the existing site callbacks and window controls. Adding a site should not require changing another site's implementation or adding site-specific conditions to shared window and navigation logic.

Small integration edits are expected: a browser-window marker and launch markup, one site configuration entry, the exact security allowlist, documentation, and rebuilt outputs. The shared `.browser-window` rules already support the no-JavaScript fallback; site-specific content still needs inspection. The extension steps below identify these points. When a genuinely shared requirement needs a shared interface change, explain why and validate the affected existing sites. Avoid speculative abstractions or unrelated refactoring.

Consider **build-time rendering** when a collection will gain entries regularly, such as a growing list of posts: keep each entry as data and let one shared template produce consistent HTML during `scripts/build_site.py`. This avoids copying list-item markup and drifting details. Keep small and stable or one-off content in `content.html`; add a renderer only when expected growth justifies its code. Keep its data and template with the owning site, and use the existing standard-library build with validation and HTML escaping. My Websites and Project Lab are current examples.

Visitor navigation must grow alongside the folders:

- Keep every site discoverable through an overview or navigation list. **My Websites** opens the directory directly from the desktop, Start menu, or portfolio footer. Each row pairs a website's thumbnail with its name, description, and optional topics; the optional Favorites panel provides a compact version of the same collection.
- Let lists and folder views accommodate additional entries without layouts or navigation logic tied to today's item count. Keep desktop and featured shortcuts selective as the collection grows.
- Use clear labels and introduce grouping when the collection warrants it. Preserve direct links, keyboard access, and usable scrolling at desktop and narrow widths as entries increase.

The professional portfolio remains a curated selection of relevant experience. Project Lab serves casual experiments and progress updates; the directory helps visitors find websites. These purposes guide what is listed in each place without changing the `sites/<name>/` ownership rule.

## Common edits

- **Change text or links:** edit the appropriate `content.html`, rebuild, and include the updated `index.html` with the change. Preserve existing section IDs so bookmarks keep working.
- **Update My Websites:** edit `sites/my-websites/websites.json`, then rebuild. Each record requires a `name` and local home-fragment `target`, for example `{"name": "Personal Hobbies", "target": "#hobby-top"}`. Optional fields are `description` (nonempty text), `thumbnail` (a safe local image path under `images/`), `topics` (a list of nonempty text), and `"feature": "project-lab"` (the existing lab gate). Thumbnail paths reject traversal, remote URLs, and query/hash components; omitted thumbnails use `images/website-shortcut.svg`. Put directory artwork in `images/websites/`; keep the supplied hobby thumbnail uncropped. Every record uses `sites/my-websites/shortcut.html`, a standard-library `string.Template` with `$name`, `$target`, `$thumbnail`, `$description`, and `$topics` placeholders. The renderer escapes text and builds the optional description/topic paragraphs. Keep the `<!-- website-shortcuts -->` marker inside the directory list in `content.html`; add records rather than copying rows or Favorites. A directory record links to an integrated site; it does not create the site's content or window.
- **Restore or update Project Lab:** move `sites/archieve/projects/` back to `sites/projects/`, enable it in `scripts/site_config.py`, restore `sites/projects` in `.github/scripts/check_site_security.py`'s module allowlist, and rebuild. Once restored, edit `sites/projects/projects.json` for catalogue changes. Preserve stable project, milestone, and update IDs. Use the supported project/milestone statuses; optional update dates use `YYYY-MM-DD` or `null`. Omit unconfirmed links and facts. The renderer validates relationships, IDs, dates, and HTTPS links and escapes content. Search labels, project rows, roadmaps, related links, and update notes come from that same catalogue.
- **Translate Hobbies:** update its English HTML and the corresponding Japanese/Hong Kong Traditional Chinese entries in `translations.js`. Keep the `data-hobby-text` keys aligned.
- **Change appearance:** edit the owning site’s CSS, or `desktop/styles.css` for shared controls. Keep the existing responsive breakpoints and focus styles.
- **Change window behavior:** edit the relevant desktop module. Check all existing windows because they share it.
- **Add a Start menu entry:** put it in `#start-programs` in `desktop/page.html`, or in `#start-featured` if it is one of the most important shortcuts. Keep each entry in only one view; All Programs scrolls within the menu as the list grows.

Asset links in HTML are relative to the published root `index.html`, even inside a content fragment. CSS image links are relative to the CSS file itself. Keep large artwork and the base theme in their current locations unless a separate task calls for changing them.

## Adding a mini-site later

For each future website, follow these steps:

1. Create `sites/<name>/content.html`, `styles.css`, and `site.js`, using a short lowercase name with optional hyphens. Author an HTML fragment, not another full page. Give its destinations unique, stable IDs and scope its CSS under a site-specific class.
2. Add `<!-- browser-window: <name> -->` to `desktop/page.html`. Every future non-portfolio site uses the shared `desktop/browser-window.html` shell; do not copy a window header or its JavaScript. The template supplies a labelled, initially hidden `.os-window.browser-window` with the site-specific `<id>-window` class, title bar, controls, menus, browser toolbar, address row, Favorites panel, and content include. Give the site's content a focusable destination. Add a matching `data-task-window` button, initially `hidden`. Add one record to `sites/my-websites/websites.json` with the site's display `name` and home-fragment `target`, plus a description, local thumbnail, and topics when useful. The shared `shortcut.html` template supplies its directory row and shared Favorites uses the same catalogue. Add a Start entry when appropriate; keep desktop shortcuts selective.
3. Export a site factory from `site.js`. Use the existing factories as examples; its returned object connects content to the desktop:

   | Member | Purpose |
   | --- | --- |
   | `id`, `element`, `homeId` | Match the window's `data-window`, reference its element, and identify its home destination. |
   | `acceptsTarget(target)` | Recognize destinations belonging to this site; return false for `null` or another site's content. |
   | `navigate(target)` | Reveal the destination in the site's content pane without moving the desktop. Portfolio switches folder views; other sites may scroll to a section. |
   | `getLinkId()` | Supply the destination for the shared Copy link menu, if included. |
   | Optional callbacks | `focus()` chooses a focus target (otherwise the window element must be focusable); `initialize(navigation, desktop)` connects site-specific behavior. |
   | Optional `languages`, `selectLanguage(id)` | `languages` lists `{ id, label, selected }` options for the shared View menu; the site handles language selection and content translation. |
   | Optional `getFavorites()` | Supplies `{ href, name }` records for shared Favorites. My Websites exposes its rendered catalogue through this callback; new sites normally reuse that catalogue. |

   Optional `aliases` preserve old destination IDs, and `closeOnEscape` enables Escape-to-close. Keep content behavior here and window management in `desktop/`.

4. Add one enabled entry to `scripts/site_config.py` with the site's folder name, exported factory name, and `browser=BrowserWindow(id="<window-id>", title="<display name>", home_id="<destination-id>")`. The marker uses the folder name; the window ID and home destination must match the site factory. Keep Portfolio first because it is the default destination. Portfolio has no browser configuration; archived Project Lab retains its existing frame. The build generates the static factory imports in `assets/js/site-registry.js` and stylesheet imports in `assets/css/one-page.css`; do not edit those outputs directly. Add the exact `sites/<name>` path to `MODULE_DIRECTORIES` in `.github/scripts/check_site_security.py` so its local modules are permitted and checked. This allowlist is a separate security review boundary.
5. Link to destinations with ordinary `href="#destination-id"` links, including links from Hobbies. The shared navigation opens the owning site's existing window. Use `data-open-window="<name>"` for a button that opens the window without choosing a destination.
6. Inspect the site without JavaScript. `assets/css/noscript.css` reveals shared `.browser-window` windows and hides browser controls automatically; keep site content readable before enhancement. Add a fallback rule only if the site's own content requires one.
7. Run `python3 scripts/build_site.py`, commit `index.html`, `assets/js/site-registry.js`, and `assets/css/one-page.css` with their sources, and follow the checks below. Also check a direct link to the new site, links between sites, directory discovery, and the no-JavaScript fallback. Check that lists still work with additional entries and long names. Update the README file map when adding the folder.

## Before handing off a change

Python 3 is used for assembly and security checks; Node.js is used only for JavaScript syntax checks. No packages need installing.

```sh
python3 scripts/build_site.py --check
python3 -m unittest discover -s .github/scripts -p 'test_*.py'
python3 .github/scripts/check_site_security.py
python3 .github/scripts/check_javascript.py
git diff --check
```

For appearance or behavior changes, preview at desktop and phone widths. Check the affected links, keyboard access, Back/Forward, language switching, and window controls. Restored windows resize from any edge or corner, or through View → Resize window with the arrow keys (Shift for larger steps, Enter to save, Escape to cancel). Each site uses the shared `site-window` CSS container so its layout follows the window width. Maximize/restore preserves the chosen size. The reset command lives under Tools in shared browser windows and View in the portfolio; it or a browser viewport change restores the fitted layout. The existing mobile drag behavior lets a window slide down while keeping its title bar reachable; maximize/reset or reopening a minimized window restores a fitted layout.

The GitHub workflow validates the committed source and output. It does not publish the site or configure branch protection. Security checks enforce local modules and the existing external-resource policy; JavaScript advisories still require human review.

## Files usually left alone

- `index.html`, `assets/js/site-registry.js`, and `assets/css/one-page.css`: generated outputs; rebuild them instead of editing them.
- `assets/css/main.css` and `assets/sass/`: inherited theme; no configured Sass build.
- `assets/css/noscript.css`: readable fallback when JavaScript is disabled.
- Root `style.css`: unlinked legacy file; cleanup is a separate task.
- `LICENSE.txt`: theme license and attribution.
