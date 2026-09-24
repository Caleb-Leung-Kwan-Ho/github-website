# Project Journal pixel lettering

`ms-sans-serif.woff2` and `ms-sans-serif-bold.woff2` are the regular and bold
FontStruct recreations of MS Sans Serif by **lou**, converted to WOFF2 by
[98.css](https://github.com/jdan/98.css/tree/main/fonts). These are not official
Microsoft font binaries. No font files have been modified here.

Both fonts are licensed under
[Creative Commons Attribution-ShareAlike 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
The accompanying `LICENSE-regular.txt`, `LICENSE-bold.txt`, `README-regular.txt`,
and `README-bold.txt` retain the original author notices. The fonts are not
covered by the website's custom-artwork terms or 98.css's code license.

Original designs:
- [MS Sans Serif](https://fontstruct.com/fontstructions/show/1384746)
- [MS Sans Serif Bold](https://fontstruct.com/fontstructions/show/1384862)

Downloaded on 2026-09-24 from these 98.css paths:
- `fonts/converted/ms_sans_serif.woff2`
- `fonts/converted/ms_sans_serif_bold.woff2`
- `fonts/src/ms-sans-serif/{license,readme}.txt`
- `fonts/src/ms-sans-serif-bold/{license,readme}.txt`

The English journal uses these faces at their native 11px size for compact
interface labels, project-list names, update and roadmap rows, and filter values.
Focus labels and NEW badges use the bold face; panel and project headings use
the regular face at 18px for a smaller, lighter treatment. The “Show project details”
toggle remains 13px with 20px line height. Full descriptions, expanded focus
values, and update and milestone details use the photo captions' regular local
pixel face at 11px in English or 12px in Japanese and Hong Kong Traditional
Chinese, with 16px line height and no synthesized font styles.
Remaining explanatory prose uses regular Tahoma/Arial with the existing CJK
system-font fallbacks.
The page title uses bold English pixel lettering at 24px, or 20px on narrow
layouts, in burgundy. The regular-only CJK faces retain their original glyphs
without synthesized bold. The subtitle stays regular at 16px, or 14px on narrow
layouts, in a slightly redder burgundy. The shared browser header keeps its common fonts.
The English language button uses the regular face at 11px in every locale.

## Japanese and Hong Kong Traditional Chinese

`fusion-pixel-12px-proportional-ja.woff2` and
`fusion-pixel-12px-proportional-zh_hk.woff2` are unmodified
[Fusion Pixel Font](https://github.com/TakWolf/fusion-pixel-font) binaries by
TakWolf and contributors. The Japanese and Hong Kong variants use their respective
regional glyph shapes. Compact interface text uses the active language's face
at its native 12px size, and panel and project headings use it at 18px.
These regular-only CJK fonts do not synthesize a bold weight.
The Japanese and Hong Kong Chinese language buttons each use their own regional
face at 12px, regardless of the active page language.

Heading sizes deliberately soften the pixel appearance instead of enlarging
the native grid by a whole multiple. NEW badges keep the English bold face at
11px in every locale.

These are official demo snapshots downloaded on 2026-09-24, not the 2026.09.01
release (which does not contain the Hong Kong variant). The demo was built from
commit `71cfc3c842f1c61620b297c64795e2a307da9cc8` by
[Pages run 35981082512](https://github.com/TakWolf/fusion-pixel-font/actions/runs/35981082512).
Only the local filenames omit upstream's `.otf` segment; the bytes are unchanged.

| Variant | Upstream asset | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| Japanese | [ja WOFF2](https://fusion-pixel-font.takwolf.com/fusion-pixel-12px-proportional-ja.otf.woff2) | 673768 | `88b5b1c08d566211cc97e5d7a107d74fc73c7cc73295ec80a89a77a3300a13ae` |
| Hong Kong | [zh_hk WOFF2](https://fusion-pixel-font.takwolf.com/fusion-pixel-12px-proportional-zh_hk.otf.woff2) | 670992 | `1d784b4191aefa58ad57bf9d8125fee8f81f85cfe35d13ca86abbbeb8c110ca0` |

The fonts use SIL Open Font License 1.1. Retain the complete upstream notices
in `LICENSE-fusion-pixel.txt`, `LICENSE-ark-pixel.txt`, `LICENSE-cubic-11.txt`
(including its M+ attribution), and `LICENSE-galmuri.txt`. Their pinned sources
are `LICENSE-OFL`, `assets/fonts/ark-pixel/OFL.txt`,
`assets/fonts/cubic-11/OFL.txt`, and `assets/fonts/galmuri/LICENSE.txt` at the
commit above. They are separate from the website's custom-artwork terms.

All four font binaries are served locally. CJK faces are selected by the
journal content's existing `lang` attribute and each language button's own
`lang` attribute, so both CJK fonts can load when the language buttons appear.
No new runtime origin, script, or package is required. `font-display: swap` keeps labels readable
while a font loads; existing system fonts remain the fallback if it fails.
Future upgrades should replace the relevant binaries and license notices
together and update this source revision, file sizes, and checksums.
