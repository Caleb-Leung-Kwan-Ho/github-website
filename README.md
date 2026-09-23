# Caleb’s website

A Windows XP-style desktop containing an engineering portfolio and Personal Hobbies, with DVD Project Lab preserved but temporarily disabled. Built with static HTML, CSS, and browser-native JavaScript modules. No framework, package installation, or backend.

The portfolio opens in Work, with an Explorer-style case-study list and an Overview / Engineering details preview. Folder links change the content in the same window; the identity header and Resume / Contact actions stay above each view. The complete content remains readable without JavaScript. Resume shortcuts use the shared local `images/resume-pdf.svg` artwork.

## Where to edit

| Change | File or folder |
| --- | --- |
| Desktop, window frames, Start, taskbar, and menu markup | [`desktop/page.html`](desktop/page.html) |
| Window behavior and shared navigation | [`desktop/`](desktop/) JavaScript files |
| Desktop and window appearance | [`desktop/styles.css`](desktop/styles.css) |
| Portfolio content, appearance, and behavior | [`sites/portfolio/`](sites/portfolio/) |
| Hobbies content, appearance, behavior, and translations | [`sites/hobbies/`](sites/hobbies/) |
| Project Lab content, appearance, behavior, and catalogue | [`sites/projects/`](sites/projects/) |
| My folder directory, website shortcuts, appearance, and behavior | [`sites/my-folder/`](sites/my-folder/) |
| Website shortcut names and destinations | [`sites/my-folder/websites.json`](sites/my-folder/websites.json) |
| Connect sites to the desktop | [`assets/js/main.js`](assets/js/main.js) |
| Images and artwork sources | [`images/`](images/) |

Each site has `content.html`, `styles.css`, and `site.js`. Hobbies also has `translations.js`; English is authored in its HTML. Project Lab keeps its project copy in `projects.json`, rendered into HTML during the build. My folder uses `websites.json` for its shortcut list and one `shortcut.html` template for every file's IE icon, label, and link. **Edit these source files, not the generated root `index.html`.** The content files are fragments used by the build, not separate public webpages.

## Growing the collection

The collection of websites will continue to grow. Every future website belongs in its own `sites/<name>/` folder, with its content, styles, and site-specific JavaScript kept together. The shared desktop provides window controls and navigation.

The design goal is **open for extension, closed for modification**: add a site's implementation in its own folder, reuse the shared interfaces, and keep changes to existing code limited to the necessary integration points. This keeps additions easy to review and reduces the risk of breaking existing sites. See the [site extension workflow](docs/MAINTENANCE.md#adding-a-mini-site-later).

Visitor navigation must also accommodate growth. **My Websites**, near the bottom of the portfolio, contains **My folder**. Opening it shows an XP Explorer window with Internet Explorer-style website shortcuts, currently Personal Hobbies. Portfolio remains the parent folder, not a website file. Click or tap a file once, or use Tab and Enter, to open its site. The folder's sidebar shows locations; Back follows browsing history and Up returns to My Websites. Reach the section from the desktop, portfolio sidebar, or Start menu. Add a name and destination to `sites/my-folder/websites.json` for each integrated site; the build uses the shared template to generate its shortcut. The grid wraps, scrolls, and counts the available links automatically. This visitor-facing organization is separate from where the site files live.

## Build and preview

From the repository root:

```sh
python3 scripts/build_site.py
python3 -m http.server 8000
```

Open [localhost:8000](http://localhost:8000). Stop the server with `Ctrl-C`. After an HTML edit, rebuild and refresh; CSS and JavaScript edits only need a refresh. Use the local server rather than opening HTML directly from disk.

The build combines local HTML files, renders My folder's shortcuts from local JSON, and, when enabled, renders the Project Lab catalogue. It does not download anything or change the authored content. Rebuild after editing a catalogue or template as well as HTML. Commit the regenerated `index.html` alongside source changes so the published copy stays current; CI checks this without changing deployment settings.

DVD Project Lab is controlled by `PROJECT_LAB_ENABLED = False` in [`scripts/build_site.py`](scripts/build_site.py). Set it to `True` and rebuild to restore the lab and its entry points. Its content, artwork, styles, and routing remain in the repository while disabled.

For the short explanation of how the pieces fit together and which checks to run, read [Maintaining the site](docs/MAINTENANCE.md). Editing conventions are in [AGENTS.md](AGENTS.md).

## Resources and licenses

The HTML5 UP Dimension base theme is retained under [its license](LICENSE.txt). Keep its attribution. Custom decorations have an [email-and-credit sharing policy](ARTWORK_TERMS.md); third-party images retain their owners’ rights. See the [thumbnail sources](images/hobbies/THUMBNAIL_SOURCES.md) and [decoration inventory](images/hobbies/decorations/README.md).

The only automatically loaded external origins are `fonts.googleapis.com`, `fonts.gstatic.com`, `drive.google.com`, and the resume-thumbnail redirect `lh3.googleusercontent.com`. Other external links load when clicked.
