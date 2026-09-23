# Internet Explorer 6 artwork

`internet-explorer-6.ico` is the original multi-size icon extracted from
Microsoft's Internet Explorer 6 SP1 executable. It is the source of truth for
the browser mark in `website-shortcut.svg`.

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

My Websites uses `internet-explorer-6.ico` directly for its desktop shortcut,
title bar, address bar, Favorites links, Start entry, and taskbar button.
The browser selects the ICO frame appropriate to the displayed size.

`website-shortcut.svg` embeds a lossless PNG conversion of the original
48 × 48, 32-bit frame (`RT_ICON` 7, language 1033). Its pixels, transparency,
colors, proportions, and shading are unchanged. It is placed at its native
48-pixel size inside the site's existing document and shortcut-arrow artwork.
That surrounding SVG artwork is custom; the complete composite is not an
original Windows icon.

Use the original ICO frames for future IE6 icons rather than redrawing or
recoloring the logo. The SVG embeds the PNG so it remains self-contained when
loaded as an image. No external image requests are made.

## SHA-256 provenance

- `IE_S1.CAB`: `40e8b813e1d0a853de42779dbcff72de1d92d7afbc60eb49d54d65a4642c480b`
- `IEXPLORE.EXE`: `414d5191aebccfcb8c23b9f81ead7e455587373cd4efdaf8e4484d0b4589ebc8`
- `internet-explorer-6.ico`: `62682ff9a9fa489fb069375298f117b79b26b7b6f5e80256789ea44751f64617`
- Embedded PNG: `59a76494b2afec41b337d3e606672c18ec35c3c80fe78691c7381d97b1291ae5`

Internet Explorer artwork and trademarks belong to Microsoft Corporation.
This is third-party artwork, not part of this repository's custom-artwork
license. The software archives and executables are not included in the site.
