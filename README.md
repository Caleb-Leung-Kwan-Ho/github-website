# Personal Website

Caleb Leung's static, single-page personal website, built with HTML, CSS, and vanilla JavaScript on the HTML5 UP Dimension theme. The page includes an introduction, resume, skills, interests, and contact links.

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
| [`assets/css/one-page.css`](assets/css/one-page.css) | Hand-authored site styles: structural single-page rules followed by the liquid-glass visual layer. |
| [`assets/css/main.css`](assets/css/main.css) | Compiled HTML5 UP Dimension base theme, loaded before the site styles. |
| [`assets/css/noscript.css`](assets/css/noscript.css) | Theme fallback styles loaded when JavaScript is disabled. |
| [`assets/sass/`](assets/sass/) | Sass source for the baseline theme styles. |
| [`assets/js/main.js`](assets/js/main.js) | The only loaded script; handles active navigation and the initial loading state. |
| [`images/`](images/) | Local image assets. |
| [`assets/css/fontawesome-all.min.css`](assets/css/fontawesome-all.min.css), [`assets/webfonts/`](assets/webfonts/) | Local Font Awesome styles and icon fonts. |
| [`.agents/skills/maintain-site-security/SKILL.md`](.agents/skills/maintain-site-security/SKILL.md) | Review procedure for security-sensitive website and deployment changes. |
| [`.github/scripts/check_site_security.py`](.github/scripts/check_site_security.py) | Checks security boundaries and repository rules, and prints JavaScript review advisories. |
| [`.github/workflows/security-invariants.yml`](.github/workflows/security-invariants.yml) | Runs the security checks for pull requests and pushes to `main`. |
| [`LICENSE.txt`](LICENSE.txt) | Theme license and attribution requirements. |

## Assets and external services

- The base stylesheet imports Source Sans Pro from Google Fonts.
- The resume preview is a Google Drive thumbnail; its link opens the resume PDF on Google Drive. Both depend on the remote file remaining available and shared appropriately.
- Font Awesome and the site's local images are served from this repository.
- The only automatically contacted external origins are `fonts.googleapis.com`, `fonts.gstatic.com`, `drive.google.com`, and the thumbnail redirect host `lh3.googleusercontent.com`. External links that load only after a visitor clicks them are not runtime dependencies.

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
