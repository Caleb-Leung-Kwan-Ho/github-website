# Internet Explorer 6 artwork

`internet-explorer-6.ico` is the original multi-size icon extracted from
Microsoft's Internet Explorer 6 SP1 executable. It is retained as the visual
reference for the site's scalable recreation of the browser mark.

## Source

- [Archived Microsoft IE6 SP1 distribution](https://web.archive.org/web/20130312132456id_/http://download.microsoft.com/download/ie6sp1/finrel/6_sp1/W98NT42KMeXP/EN-US/IE_S1.CAB).
- Archive path: `IE_S1.CAB` → `IE_1.CAB` → `IEXPLORE.EXE`.
- Executable version: `6.00.2800.1106`, Microsoft Corporation, 2002.
- Resource: `RT_GROUP_ICON` 32528, language 1033 (English, United States).
- The ICO retains the original 16-, 32-, and 48-pixel frames at 4-, 8-, and
  32-bit color depths. Only the ICO container was assembled; resource image
  payloads were copied unchanged.
- [Microsoft's IE6 SP1 documentation](https://learn.microsoft.com/en-us/security-updates/securitybulletins/2004/ms04-040)
  identifies version `6.00.2800.1106` as IE6 SP1 for Windows XP SP1 and Windows
  2000.

## Website use

My Websites uses `internet-explorer-6.svg` for its desktop shortcut, title bar,
address bar, Favorites links, Start entry, and taskbar button. This is an
unofficial vector reconstruction based on the original icon, made with paths
and gradients so it can scale without enlarging bitmap pixels. It is not an
untouched Microsoft asset or a pixel-identical replacement for every ICO frame.

`website-shortcut.svg` contains the same vector browser artwork within the
site's custom document and shortcut-arrow artwork. Neither SVG embeds the old
PNG conversion or loads an external image. The complete composite is not an
original Windows icon. Use the retained ICO as the reference when refining
the XP-era shape, colors, and shading.

## SHA-256 provenance

- `IE_S1.CAB`: `40e8b813e1d0a853de42779dbcff72de1d92d7afbc60eb49d54d65a4642c480b`
- `IEXPLORE.EXE`: `414d5191aebccfcb8c23b9f81ead7e455587373cd4efdaf8e4484d0b4589ebc8`
- `internet-explorer-6.ico`: `62682ff9a9fa489fb069375298f117b79b26b7b6f5e80256789ea44751f64617`

These hashes document the original source and retained ICO, not the recreated
SVG files. The software archives and executables are not included in the site.

## Ownership and permissions

The Internet Explorer logo and original icon artwork belong to Microsoft.
Reconstructing the mark in SVG does not transfer ownership of the underlying
design to this repository's authors. The mark is excluded from the repository's
custom-artwork sharing policy and software/theme license.

See [Third-party notices](../THIRD_PARTY_NOTICES.md) for the ownership and
non-affiliation notice and links to Microsoft's published guidance. Attribution
does not grant permission or establish legal clearance for use of the artwork.
