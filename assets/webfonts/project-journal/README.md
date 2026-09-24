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
interface labels. The page title and body copy keep their ordinary system fonts.

## Japanese and Hong Kong Traditional Chinese

`fusion-pixel-12px-proportional-ja.woff2` and
`fusion-pixel-12px-proportional-zh_hk.woff2` are unmodified
[Fusion Pixel Font](https://github.com/TakWolf/fusion-pixel-font) binaries by
TakWolf and contributors. The Japanese and Hong Kong variants use their respective
regional glyph shapes. Compact interface labels use the active language's face
at its native 12px size; English keeps its existing 11px face. The homepage badge
does not synthesize a bold weight for these regular-only CJK fonts.

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
journal content's existing `lang` attribute and load on demand, without a new
runtime origin, script, or package. `font-display: swap` keeps labels readable
while a font loads; existing system fonts remain the fallback if it fails.
Future upgrades should replace the relevant binaries and license notices
together and update this source revision, file sizes, and checksums.
