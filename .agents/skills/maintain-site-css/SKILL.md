---
name: maintain-site-css
description: Plan, implement, or review CSS and layout-related HTML changes for this single-page personal website. Use for styling, layout, component, class, or CSS refactors; exclude copy-only edits that leave layout and classes unchanged.
---

# Maintain site CSS

Read the repository-root [AGENTS.md](../../../AGENTS.md) for conventions, authorization boundaries, and required validation, and [README.md](../../../README.md) for the file map and preview setup. Paths below are relative to the repository root. Match the requested mode: planning and review do not authorize edits.

## Trace the affected styles

- Search each affected selector in `index.html`, `assets/css/one-page.css`, and the inherited `assets/css/main.css` rules. Include imported styles when they contribute to the affected component, and inspect all responsive overrides before proposing a change.
- Identify every component or section reached by a shared selector or `--glass-*` variable. Treat its structural rules, later glass treatment, and breakpoint overrides as one unit of review; the two custom styling layers are intentional.
- Inspect existing ID and direct-child selectors as contracts with the HTML5 UP theme and page structure. Preserve the necessary specificity when editing an override; do not replace these patterns merely to enforce a class-only convention.
- When navigation or section markup changes, inspect the href-to-section mapping in `assets/js/main.js` and the affected IDs and ARIA relationships in `index.html`. Account for sticky-header height and anchor scroll offsets when layout changes.

## Work within the current layers

For implementation, edit the relevant existing blocks in `assets/css/one-page.css` and any HTML in scope, following `AGENTS.md`. Use inherited theme rules to understand the cascade rather than treating generated `main.css` as the normal edit target.

For grid and flex changes, consider content minimum widths, gaps, wrapping, and shrinking together. If child count or order changes, inspect positional selectors and track placement. For typography or available-width changes, account for long headings and skill labels with both Source Sans Pro and the existing fallback font stack.

## Verify the affected behavior

Use the local preview and checks required by `AGENTS.md` during implementation. In a planning or review-only task, distinguish source inspection from checks that still need to be performed.

- For responsive layout changes, inspect just below, at, and above each affected custom breakpoint (`980px`, `736px`, or `480px`), plus representative desktop and narrow widths. Include inherited theme boundaries if an affected rule uses them.
- Check layout and typography changes at 200% zoom and with the remote font unavailable. Look for clipped content, collisions, awkward wrapping, and unintended page overflow; horizontal scrolling inside the narrow navigation is intentional.
- For header, navigation, or section changes, test affected anchors and keyboard navigation, including the skip link, visible focus, active-link state, and whether target headings remain visible below the sticky header.
- For changes to motion or glass surfaces, inspect the relevant reduced-motion or reduced-transparency state. Keep these checks focused on the behavior the change can affect.

Review the final diff for unintended selector, markup, or content changes. Report the checks and viewport widths actually used, and identify anything left unverified without implying it passed.
