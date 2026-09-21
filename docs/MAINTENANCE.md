# Maintaining the site

Start with the [README file map](../README.md#where-to-edit). There are two existing mini-sites and one shared desktop; no future sites are scaffolded.

## How a page reaches the browser

`desktop/page.html` contains the outer page and window frames. Its two include markers insert `sites/portfolio/content.html` and `sites/hobbies/content.html`. Running `python3 scripts/build_site.py` writes the complete root `index.html`.

Visitors receive that complete HTML immediately. The browser never fetches HTML fragments to open a window. The content remains readable through the existing no-JavaScript fallback.

`assets/css/main.css` remains the original theme. `assets/css/one-page.css` loads desktop, portfolio, and hobbies styles in that order. Keep that order: moving files does not isolate CSS, so site-specific selectors must stay limited to their own content.

`assets/js/main.js` connects the existing sites to the shared desktop. Browser-native modules keep responsibilities in separate files without a bundler or package manager.

## Who owns what

- **Desktop:** window movement and resizing, focus, minimize/maximize/close, Start, taskbar, and common menu behavior. Window labels and menu entries are declared in `desktop/page.html`.
- **Navigation:** shareable fragments and browser history. It finds the site that owns a destination and asks that site to navigate there.
- **Portfolio:** section navigation, the address label, its Back/Forward buttons, and professional content.
- **Hobbies:** its internal scrolling, language choices, translations, and decorative layout.

Site code uses the shared desktop through a small set of callbacks; it does not implement its own dragging or taskbar. The entry point lists the available sites explicitly. Keep one window per site. Adding a framework, embedded webpages, or dynamically downloaded HTML would be a separate architectural decision.

## Common edits

- **Change text or links:** edit the appropriate `content.html`, rebuild, and include the updated `index.html` with the change. Preserve existing section IDs so bookmarks keep working.
- **Translate Hobbies:** update its English HTML and the corresponding Japanese/Hong Kong Traditional Chinese entries in `translations.js`. Keep the `data-hobby-text` keys aligned.
- **Change appearance:** edit the owning site’s CSS, or `desktop/styles.css` for shared controls. Keep the existing responsive breakpoints and focus styles.
- **Change window behavior:** edit the relevant desktop module. Check both windows because they share it.

Asset links in HTML are relative to the published root `index.html`, even inside a content fragment. CSS image links are relative to the CSS file itself. Keep large artwork and the base theme in their current locations unless a separate task calls for changing them.

## Adding a mini-site later

No new site is needed for the current reorganization. When one is ready, follow these steps:

1. Create `sites/<name>/content.html`, `styles.css`, and `site.js`, using a short lowercase name with optional hyphens. Author an HTML fragment, not another full page. Give its destinations unique, stable IDs and scope its CSS under a site-specific class.
2. Add one window to `desktop/page.html`, following the existing `.os-window` structure: a unique `data-window`, labelled title, `data-titlebar`, window controls, and a focusable content area. Insert `<!-- include: sites/<name>/content.html -->` inside it. Keep the new window and its matching `data-task-window` button initially `hidden`; add a Start entry or desktop shortcut. Reuse the shared controls rather than copying their JavaScript.
3. Export a site factory from `site.js`. Use the existing factories as examples; its returned object connects content to the desktop:

   | Member | Purpose |
   | --- | --- |
   | `id`, `element`, `homeId` | Match the window's `data-window`, reference its element, and identify its home destination. |
   | `acceptsTarget(target)` | Recognize destinations belonging to this site; return false for `null` or another site's content. |
   | `navigate(target)` | Scroll the site's content pane to a destination without moving the desktop. |
   | `getLinkId()` | Supply the destination for the shared Copy link menu, if included. |
   | Optional callbacks | `focus()` chooses a focus target (otherwise the window element must be focusable); `initialize(navigation, desktop)` connects site-specific behavior; `selectLanguage()` supports language menus. |

   Optional `aliases` preserve old destination IDs, and `closeOnEscape` enables Escape-to-close. Keep content behavior here and window management in `desktop/`.

4. Import and create the factory in `assets/js/main.js`; keep Portfolio first because it is the default destination. Use single-line static relative JavaScript imports. Import the new stylesheet after the existing sites in `assets/css/one-page.css`. Add the exact `sites/<name>` path to `MODULE_DIRECTORIES` in `.github/scripts/check_site_security.py` so its local modules are permitted and checked.
5. Link to destinations with ordinary `href="#destination-id"` links, including links from Hobbies. The shared navigation opens the owning site's existing window. Use `data-open-window="<name>"` for a button that opens the window without choosing a destination.
6. Extend `assets/css/noscript.css` to make the new window and its content readable without JavaScript. Its current rules name only the existing windows; a new hidden window will not become readable automatically.
7. Run `python3 scripts/build_site.py`, commit `index.html` with its sources, and follow the checks below. Also check a direct link to the new site, links between sites, and the no-JavaScript fallback. Update the README file map when adding the folder.

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
