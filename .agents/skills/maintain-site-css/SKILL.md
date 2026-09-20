---
name: maintain-site-css
description: Plan, implement, or review CSS and layout-related HTML changes for this single-page personal website. Use for styling, layout, component, class, or CSS refactors; exclude copy-only edits that leave layout and classes unchanged.
---

# Maintain site CSS

Read the repository-root [AGENTS.md](../../../AGENTS.md) for conventions, authorization boundaries, and required validation, and [README.md](../../../README.md) for the file map and preview setup. Paths below are relative to the repository root. Match the requested mode: planning and review do not authorize edits.

## Trace the affected styles

- Search each affected selector in the authored HTML (`desktop/page.html`, `sites/*/content.html`), `desktop/styles.css`, `sites/*/styles.css`, and inherited `assets/css/main.css` rules. Trace the import order through `assets/css/one-page.css` and inspect all responsive overrides before proposing a change.
- Identify every component or section reached by a shared selector or CSS variable. Treat base and breakpoint rules as one unit of review; the desktop, portfolio, and hobbies import order is intentional.
- Inspect existing ID and direct-child selectors as contracts with the HTML5 UP theme and page structure. Preserve the necessary specificity when editing an override; do not replace these patterns merely to enforce a class-only convention.
- When navigation or section markup changes, inspect the mapping in `sites/portfolio/site.js` and `desktop/navigation.js`, along with IDs and ARIA relationships in the authored HTML. Account for sticky-header height and anchor scroll offsets when layout changes.

## Work within the current layers

For implementation, edit the owning desktop or site stylesheet and authored HTML, following `AGENTS.md`. Keep `one-page.css` as the import manifest and rebuild `index.html` after HTML edits. Use inherited theme rules to understand the cascade rather than treating generated `main.css` as the normal edit target.

For grid and flex changes, consider content minimum widths, gaps, wrapping, and shrinking together. If child count or order changes, inspect positional selectors and track placement. For typography or available-width changes, account for long headings and skill labels with both Source Sans Pro and the existing fallback font stack.

## Verify the affected behavior

Use the local preview and checks required by `AGENTS.md` during implementation. In a planning or review-only task, distinguish source inspection from checks that still need to be performed.

- For responsive layout changes, inspect just below, at, and above each affected custom breakpoint (`980px`, `736px`, or `480px`), plus representative desktop and narrow widths. Include inherited theme boundaries if an affected rule uses them.
- Check layout and typography changes at 200% zoom and with the remote font unavailable. Look for clipped content, collisions, awkward wrapping, and unintended page overflow; horizontal scrolling inside the narrow navigation is intentional.
- For header, navigation, or section changes, test affected anchors and keyboard navigation, including the skip link, visible focus, active-link state, and whether target headings remain visible below the sticky header.
- For changes to motion or glass surfaces, inspect the relevant reduced-motion or reduced-transparency state. Keep these checks focused on the behavior the change can affect.

Review the final diff for unintended selector, markup, or content changes. Report the checks and viewport widths actually used, and identify anything left unverified without implying it passed.
