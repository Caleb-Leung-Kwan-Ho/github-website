# Personal Website

Caleb Leung's static, single-page personal website, presented as a retro Windows-style desktop and built with HTML, CSS, and vanilla JavaScript on the HTML5 UP Dimension base theme. The portfolio includes an introduction, work, Projects & Research, resume, skills, interests, and contact links. A separate simulated window contains the personal hobbies website.

## Preview locally

From the repository root, run:

```sh
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000). Stop the server with `Ctrl-C` when finished. Python 3 is required for this preview command; there is no package installation or build step.

## File map

| Path | Purpose |
| --- | --- |
| [`index.html`](index.html) | Page content, sections, navigation, and asset links. |
| [`assets/css/one-page.css`](assets/css/one-page.css) | Hand-authored desktop, Explorer-window, responsive, and content styles. |
| [`assets/css/main.css`](assets/css/main.css) | Compiled HTML5 UP Dimension base theme, loaded before the site styles. |
| [`assets/css/noscript.css`](assets/css/noscript.css) | Readable static fallback styles loaded when JavaScript is disabled. |
| [`assets/sass/`](assets/sass/) | Sass source for the baseline theme styles. |
| [`assets/js/main.js`](assets/js/main.js) | The only loaded script; handles section navigation, simulated windows, the start menu, taskbar state, the clock, and hobby language switching. |
| [`images/`](images/) | Local image assets. |
| [`assets/css/fontawesome-all.min.css`](assets/css/fontawesome-all.min.css), [`assets/webfonts/`](assets/webfonts/) | Local Font Awesome styles and icon fonts. |
| [`.agents/skills/maintain-site-security/SKILL.md`](.agents/skills/maintain-site-security/SKILL.md) | Review procedure for security-sensitive website and deployment changes. |
| [`.github/scripts/check_site_security.py`](.github/scripts/check_site_security.py) | Checks security boundaries and repository rules, and prints JavaScript review advisories. |
| [`.github/workflows/security-invariants.yml`](.github/workflows/security-invariants.yml) | Runs the security checks for pull requests and pushes to `main`. |
| [`LICENSE.txt`](LICENSE.txt) | Theme license and attribution requirements. |
| [`ARTWORK_TERMS.md`](ARTWORK_TERMS.md) | Separate terms for the custom pixel-art decorations; third-party artwork retains its own rights. |

## Assets and external services

- The base stylesheet imports Source Sans Pro from Google Fonts.
- The resume preview is a Google Drive thumbnail; its link opens the resume PDF on Google Drive. Both depend on the remote file remaining available and shared appropriately.
- Font Awesome and the site's local images are served from this repository.
- The only automatically contacted external origins are `fonts.googleapis.com`, `fonts.gstatic.com`, `drive.google.com`, and the thumbnail redirect host `lh3.googleusercontent.com`. External links that load only after a visitor clicks them are not runtime dependencies.

## Desktop controls

The four featured folders lead to Work, Projects, Resume, and Skills. Hobbies remains available from the desktop, sidebar, Start menu, and File menu.

The portfolio and hobbies windows share File, Edit, View, and Help disclosures. Tab and Enter operate the menus; arrow keys navigate commands and Escape dismisses a menu before closing an auxiliary window. Copy commands write only after a click and report clipboard failure with selectable text. Hobbies language choices stay synchronized with the controls inside its page.

On screens wider than 736px, drag a restored window by its title bar, or choose View → Move window and use the arrow keys (Shift moves farther). Enter commits and Escape cancels a keyboard move. View → Reset position restores the default layout. Maximized and mobile windows stay fixed; resizing the viewport resets custom positions to keep controls reachable. Drag updates use one animation frame at a time, with no library, network requests, persistent storage, or background animation loop.

Portfolio Back and Forward traverse portfolio destinations in the current page session using browser history. Browser Back/Forward also restore the hobbies destination. Starting a new navigation after going back discards the forward branch. Reloading starts a fresh in-page history boundary, so the toolbar never navigates away from the site.

## Projects & Research

Projects and the former research notebook are combined in the portfolio's Projects & Research section. Anime MCP is marked as in development, with its retrieval work and expandable research reading kept together. No published demo or project website is implied.

The research content summarizes Anime MCP's evaluation and lexical-retrieval work, the hybrid-fusion question, and planned calibration and query-adaptive fusion. Paper links are user-initiated external links, not embeds or automatic requests. Update this content when the project or research notes change. The introduction and Work section describe Caleb's extraction, transformation, chunking, embedding, and metadata-extraction contributions before giving the wider team's pipeline scale; ownership is limited to the distributed embedding stage. Skills include Graphite.

## Personal hobbies website

The hobbies window follows the supplied desktop and mobile references, with English, Japanese, and conversational Hong Kong Cantonese written in Traditional Chinese. Its English content remains readable without JavaScript. Links within the hobbies document scroll its own pane; the return link opens the portfolio.

- Decorative originals live in `images/hobbies/decorations/`; their manifest records original dimensions and hashes. CSS crops transparent margins and displays the artwork proportionally with pixelated rendering. The originals are preserved; web-size optimization is a separate task.
- The 16 locally served title thumbnails and their official sources are documented in [`images/hobbies/THUMBNAIL_SOURCES.md`](images/hobbies/THUMBNAIL_SOURCES.md). The source artwork may differ from the mockup's illustrative placeholders.
- Advice for International Students contains three topics: choosing a degree with career goals in mind, deciding why to study in America, and preparing before arrival. It includes links to official guidance and a note that more writing will follow.
- Training shows the weekly routine and a brief elbow-injury note. Private medical/PT details, personal training logs, and the source workbook are not published or linked. No PDF download is shown before a public program-only file exists.
- The Hong Kong introduction identifies Sha Tin, 芝士鮮魷, 大排檔, and 茶餐廳, with an invitation to email restaurant recommendations. Games retains the May–November 2025 period. Other supplied years stay unchanged; the game title is corrected to “Mobile Suit Gundam Extreme VS. Maxiboost ON” without an extra “2.” The Reze arc and Fate/Zero choices remain tentative.
- Language buttons replace text from fixed local dictionaries, without network calls or stored preferences. The brand and supplied proper names stay consistent.

## Artwork and licensing

The HTML5 UP Dimension theme remains under the Creative Commons Attribution 3.0 license in [`LICENSE.txt`](LICENSE.txt), with its attribution intact. The custom pixel-art decorations have separate, scoped [artwork terms](ARTWORK_TERMS.md): ask Caleb before reusing them. This does not revoke any valid license already granted or restrict uses permitted by law. AI generation alone is not a claim of copyright ownership over every element.

Anime, manga, and game thumbnails belong to their respective rights holders. Their [source ledger](images/hobbies/THUMBNAIL_SOURCES.md) records provenance; neither the theme license nor the custom artwork notice grants reuse rights to third-party images.

## Maintenance

Read [`AGENTS.md`](AGENTS.md) for the repository's editing rules, accessibility requirements, security boundaries, and validation commands. Use the [`maintain-site-css` skill](.agents/skills/maintain-site-css/SKILL.md) for CSS investigation and verification, and the [`maintain-site-security` skill](.agents/skills/maintain-site-security/SKILL.md) for security-sensitive changes.

Edit content in `index.html`, site-specific styles in `assets/css/one-page.css`, and page behavior in `assets/js/main.js`. Keep changes focused and preserve the base-theme-before-site-styles load order.

Run the local security checks with:

```sh
python3 -m unittest discover -s .github/scripts -p 'test_*.py'
python3 .github/scripts/check_site_security.py
```

The checker distinguishes three kinds of result:

- **Security failures** block the check: for example, an unapproved external origin, weakened CSP, or unsafe workflow setting.
- **Repository-rule failures** also block the check: the site keeps one classic local script and no package tooling. These are maintenance conventions, not proof that other architectures are unsafe.
- **JavaScript review advisories** do not block the check. They flag text patterns for a person to inspect; comments and strings can match, while dynamic or aliased operations can escape detection. Review changed JavaScript even when the check passes without advisories.

The workflow reader supports simple block YAML, including comments, blank lines, and plain or quoted scalar values. Unsupported structures fail the check and need manual review and a checker update. Finding a command in a workflow does not prove that GitHub will execute it; inspect the actual workflow run as well.

Pull requests can propose changes to the checker and workflow themselves, so this is a review guardrail rather than proof against a deliberately weakened check. Review changes to security-control files carefully.

After the workflow has completed successfully on GitHub at least once, make it a merge gate by requiring the `Security invariants` status check in the `main` branch ruleset. Repository files cannot enable that GitHub setting by themselves.

## Current limitations

- The checker handles this site's simple source formats. It does not fully parse HTML, CSS, JavaScript, or YAML; unusual syntax still needs source and browser review. CSS checks inspect literal references, including examples in comments and unlinked source files.
- The repository has no package manifest or configured build, lint, or formatting tools. Its only automated tests are the dependency-free security checks above; validation also includes the browser checks described in `AGENTS.md`.
- The Sass source is present, but there is no checked-in configuration for reproducibly compiling the theme CSS.
- Root `style.css` is not linked by the page. The unused `jquery.min.js`, `browser.min.js`, `breakpoints.min.js`, and `util.js` helpers were removed; `assets/js/main.js` is the only runtime script.
- There is no checked-in deployment configuration or documented hosting procedure.
- The policy is delivered through a meta element, so header-only CSP directives such as `frame-ancestors` are not available from this repository.
