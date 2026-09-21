# Caleb’s website

A Windows XP-style desktop containing an engineering portfolio and Personal Hobbies. Built with static HTML, CSS, and browser-native JavaScript modules. No framework, package installation, or backend.

## Where to edit

| Change | File or folder |
| --- | --- |
| Desktop, window frames, Start, taskbar, and menu markup | [`desktop/page.html`](desktop/page.html) |
| Window behavior and shared navigation | [`desktop/`](desktop/) JavaScript files |
| Desktop and window appearance | [`desktop/styles.css`](desktop/styles.css) |
| Portfolio content, appearance, and behavior | [`sites/portfolio/`](sites/portfolio/) |
| Hobbies content, appearance, behavior, and translations | [`sites/hobbies/`](sites/hobbies/) |
| Connect the two sites to the desktop | [`assets/js/main.js`](assets/js/main.js) |
| Images and artwork sources | [`images/`](images/) |

Each site has `content.html`, `styles.css`, and `site.js`. Hobbies also has `translations.js`; English is authored in its HTML. **Edit these source files, not the generated root `index.html`.** The content files are fragments used by the build, not separate public webpages.

## Build and preview

From the repository root:

```sh
python3 scripts/build_site.py
python3 -m http.server 8000
```

Open [localhost:8000](http://localhost:8000). Stop the server with `Ctrl-C`. After an HTML edit, rebuild and refresh; CSS and JavaScript edits only need a refresh. Use the local server rather than opening HTML directly from disk.

The build only combines local HTML files. It does not download anything or change the site’s content. Commit the regenerated `index.html` alongside source changes so the published copy stays current; CI checks this without changing deployment settings.

For the short explanation of how the pieces fit together and which checks to run, read [Maintaining the site](docs/MAINTENANCE.md). Editing conventions are in [AGENTS.md](AGENTS.md).

## Resources and licenses

The HTML5 UP Dimension base theme is retained under [its license](LICENSE.txt). Keep its attribution. Custom decorations have an [email-and-credit sharing policy](ARTWORK_TERMS.md); third-party images retain their owners’ rights. See the [thumbnail sources](images/hobbies/THUMBNAIL_SOURCES.md) and [decoration inventory](images/hobbies/decorations/README.md).

The only automatically loaded external origins are `fonts.googleapis.com`, `fonts.gstatic.com`, `drive.google.com`, and the resume-thumbnail redirect `lh3.googleusercontent.com`. Other external links load when clicked.
