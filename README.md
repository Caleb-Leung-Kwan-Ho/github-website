# Caleb’s website

A Windows XP-style desktop containing an engineering portfolio, Personal Hobbies, and a Project Lab journal, with DVD Project Lab archived. Built with static HTML, CSS, and browser-native JavaScript modules. No framework, package installation, or backend.

The portfolio opens in Work, with an Explorer-style case-study list and an Overview / Engineering details preview. Folder links change the content in the same window; the identity header and Resume / Contact actions stay above each view. The complete content remains readable without JavaScript. Resume shortcuts use the shared local `images/resume-pdf.svg` artwork.

## Where to edit

| Change | File or folder |
| --- | --- |
| Desktop, window placement, Start, taskbar, and portfolio frame | [`desktop/page.html`](desktop/page.html) |
| Shared Internet Explorer window and header | [`desktop/browser-window.html`](desktop/browser-window.html), [`desktop/browser.js`](desktop/browser.js), and [`desktop/styles.css`](desktop/styles.css) |
| Window behavior and shared navigation | [`desktop/`](desktop/) JavaScript files |
| Desktop and window appearance | [`desktop/styles.css`](desktop/styles.css) |
| Portfolio content, appearance, and behavior | [`sites/portfolio/`](sites/portfolio/) |
| Hobbies content, appearance, behavior, and translations | [`sites/hobbies/`](sites/hobbies/) |
| Project Lab journal, project data, and three-language content | [`sites/project-journal/`](sites/project-journal/) |
| Project Lab photographs and source/license credits | [`images/project-journal/`](images/project-journal/) |
| Archived Project Lab content, appearance, behavior, and catalogue | [`sites/archieve/projects/`](sites/archieve/projects/) |
| My Websites directory, catalogue for shared Favorites, appearance, and behavior | [`sites/my-websites/`](sites/my-websites/) |
| Website names, destinations, descriptions, and thumbnails | [`sites/my-websites/websites.json`](sites/my-websites/websites.json) |
| Choose active sites and their source folders | [`scripts/site_config.py`](scripts/site_config.py) |
| Connect active sites to the desktop | [`assets/js/main.js`](assets/js/main.js) and generated `assets/js/site-registry.js` |
| Images and artwork sources | [`images/`](images/) |

Each active site has `content.html`, `styles.css`, and `site.js`. Hobbies also has `translations.js`; English is authored in its HTML. The Project Lab journal keeps canonical facts in `projects.json` and English, Japanese, and Hong Kong Traditional Chinese copy in `locales/`; its `translations.js` is generated from those sources and the compact, translated display copy in `excerpts.json`. The complete original descriptions remain in expandable sections. Its `templates/` folder owns the page and repeated project markup. The archived DVD site retains its independent `projects.json` snapshot. My Websites uses `websites.json` and one `shortcut.html` template for its directory rows; the shared browser derives Favorites from those rendered links. Directory content remains in `sites/my-websites/`; browser headers and Favorites controls belong to `desktop/`. **Edit the source files, not the generated `index.html`, `assets/js/site-registry.js`, `assets/css/one-page.css`, or `sites/project-journal/translations.js`.** The content files are fragments used by the build, not separate public webpages.

## Growing the collection

The collection of websites will continue to grow. Every future website belongs in its own `sites/<name>/` folder, with its content, styles, and site-specific JavaScript kept together. Hobbies, My Websites, Project Lab, and future non-portfolio sites use the shared Internet Explorer header: title bar, File/Edit/View/Favorites/Tools/Help menus, Back/Forward/Home/Favorites toolbar, and Address/Go row. The portfolio keeps its own Explorer frame, and archived DVD Project Lab remains unchanged. Configure a site's `BrowserWindow` in `scripts/site_config.py` and place its browser-window marker in `desktop/page.html`; do not copy the header or its JavaScript into a site.

The design goal is **open for extension, closed for modification**: add a site's implementation in its own folder, reuse the shared interfaces, and keep changes to existing code limited to the necessary integration points. This keeps additions easy to review and reduces the risk of breaking existing sites. See the [site extension workflow](docs/MAINTENANCE.md#adding-a-mini-site-later).

Visitor navigation must also accommodate growth. **My Websites** opens directly in an XP-era Internet Explorer window from the desktop, Start menu, or the portfolio's small footer link. Its directory shows website thumbnails and descriptions for Personal Hobbies and Project Lab. Click or tap a row once, or use Tab and Enter, to open the site's existing window. Each shared browser window has its own current local address and a Favorites panel/menu drawn from the same catalogue, closed by default. Home returns to the directory, Back/Forward follow this desktop's browsing history, and Back to portfolio returns to Work. Hobbies and Project Lab expose their language choices in View. The old `#my-folder` and `#hobbies` links resolve to `#websites`. Add a name and destination to `sites/my-websites/websites.json`, optionally with a description, local thumbnail, and topics. Rows stack on small screens, lists scroll, and counts follow the available entries. The portfolio remains the initial destination and the hobby site's own content is unchanged.

Individual sites stay out of the Start menu; Start → All Programs → My Websites lets visitors see the full collection and its site count.

**Project Lab** opens at `#project-journal` from My Websites or Favorites. Its early-2000s homepage design combines a searchable project list, development notes, roadmaps, and local Tokyo/Hong Kong photographs. Each project has a stable `#project-journal-<id>` link. English is the readable no-JavaScript baseline; Japanese and Hong Kong Traditional Chinese are local enhancements. This journal is separate from the disabled DVD site and the curated professional portfolio.

## Build and preview

From the repository root:

```sh
python3 scripts/build_site.py
python3 -m http.server 8000
```

Open [localhost:8000](http://localhost:8000). Stop the server with `Ctrl-C`. After an HTML edit, rebuild and refresh; CSS and JavaScript edits only need a refresh. Use the local server rather than opening HTML directly from disk.

The build expands browser-window markers using `scripts/browser_content.py` and the shared `desktop/browser-window.html` template, inserts site content, renders My Websites and the Project Lab journal from local JSON, and generates the active site JavaScript registry and CSS import list from `scripts/site_config.py`. `scripts/project_journal_content.py` validates the journal's project data and all three locales, renders its English fallback, and generates `sites/project-journal/translations.js`. When enabled, the build also renders the archived DVD catalogue. It does not download anything or change the authored content. Rebuild after editing a catalogue, locale, template, or site configuration as well as HTML. Commit all four generated files alongside their sources so the published copy stays current; CI checks this without changing deployment settings.

DVD Project Lab is disabled in [`scripts/site_config.py`](scripts/site_config.py), and its source is stored in `sites/archieve/projects/`. To restore it, move that folder back to `sites/projects/`, enable its configuration entry, restore that path in the security checker's module allowlist, and rebuild. Its disabled state removes its HTML, JavaScript import, and CSS import together. Other sites need an HTML feature gate before they can be disabled.

For the short explanation of how the pieces fit together and which checks to run, read [Maintaining the site](docs/MAINTENANCE.md). Editing conventions are in [AGENTS.md](AGENTS.md).

## Resources and licenses

The HTML5 UP Dimension base theme is retained under [its license](LICENSE.txt). Keep its attribution. Custom decorations have an [email-and-credit sharing policy](ARTWORK_TERMS.md); third-party images retain their owners’ rights. See the [thumbnail sources](images/hobbies/THUMBNAIL_SOURCES.md) and [decoration inventory](images/hobbies/decorations/README.md).

Project Lab's three photographs are served locally with visible photo credits and a [credit and license record](images/project-journal/PHOTO_CREDITS.md). Preserve the individual licenses, the notice that all three were downscaled and re-compressed for the early-2000s look, and the Yamanote photo's “color and tone edited” notice. The site's early-2000s design is not a claim about the photographs' capture dates.

Journal updates can opt into a red `NEW` badge with `"isNew": true` in `sites/project-journal/projects.json`. The marker is editorial, not inferred from missing dates; remove it or set it to `false` when the update is no longer new. It remains visible across language changes. Rebuild after changing the marker.

Project Lab's pixel lettering uses local CC BY-SA 3.0 font recreations by lou for English and OFL 1.1 Fusion Pixel fonts for Japanese and Hong Kong Traditional Chinese; retain their [font notices](assets/webfonts/project-journal/README.md). Each language button uses its own language's font regardless of the active page language, so both CJK fonts can load when the buttons appear. Pixel lettering covers compact list and table text, focus labels, form values, language labels, and expandable project text, always at the fonts' native sizes; the “Show project details” toggle keeps a 20px line height. Full descriptions, expanded focus values, and update and milestone details use the regular local pixel font at 11px in English or 12px in Japanese and Hong Kong Traditional Chinese, with 16px line height. The retro lettering, controls, and immediate hover/pressed states are scoped to `.project-journal-content` below the shared browser header; the title bar, menus, toolbar, and address row retain the common browser styling. The page title and panel and project headings use smooth bold Tahoma with regional CJK system fallbacks, like the pre-rendered heading graphics of XP-era sites; the subtitle uses the same stack at regular weight. The title and subtitle use burgundy tones from the reference, while remaining explanatory prose uses regular Tahoma/Arial with the existing CJK system-font fallbacks. Header photo captions are visually hidden but remain available to assistive technology; the place names also appear in the alt text and photo credits. Its status selector and project-list scrollbar buttons use local [pixel control artwork](images/project-journal/controls/README.md). Its footer also offers an opt-in “CRT effect” toggle, off by default and remembered in browser storage, that draws one static layer of light scanlines, a faint RGB phosphor mask, and a soft vignette over Project Lab's page area only; the shared browser header, other windows, and the desktop are unaffected. The effect and its toggle are hidden for increased-contrast and forced-color preferences and in print. There is no added runtime dependency.

Internet Explorer icons use a local SVG reconstruction of Microsoft's XP-era design. Microsoft retains ownership of the underlying logo and original artwork; this project is not affiliated with or endorsed by Microsoft. See the [artwork provenance](images/internet-explorer-6.source.md) and [third-party notices](THIRD_PARTY_NOTICES.md). Attribution is not permission to reuse the artwork.

The only automatically loaded external origins are `fonts.googleapis.com`, `fonts.gstatic.com`, `drive.google.com`, and the resume-thumbnail redirect `lh3.googleusercontent.com`. Other external links load when clicked.
