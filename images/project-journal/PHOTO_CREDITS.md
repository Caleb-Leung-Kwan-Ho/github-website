# Photo credits and reuse

The Project Lab footer links to a Photo credits disclosure with the three title, creator, source, and license credits below. These local display images retain their individual licenses. The source manifest `photos.json` was imported from the supplied kit: its `file` and `sourceOriginalFile` fields retain kit-relative provenance paths, while `suggestedRepoPath` identifies each deployed file.

### S01 — Shinjuku · rainy night

[Walking around Kabukicho, Shinjuku at night. (29362470401)](https://commons.wikimedia.org/wiki/File:Walking_around_Kabukicho,_Shinjuku_at_night._(29362470401).jpg) — [Daniel Ramirez](https://www.flickr.com/people/21442511@N08), [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).

- File: `shinjuku-rain-2016.jpg`
- Captured: 2016-06-16, as recorded by the source. The website's early-2000s look is a design style, not the photo's capture date.
- Original source: https://www.flickr.com/photos/danramarch/29362470401/
- Changes: the downloaded JPEG was downscaled to 180 pixels tall and re-saved as a quality-45 JPEG for an early-2000s web look (see `PHOTO_PROCESSING.md`); the header uses CSS display cropping. The unmodified download's SHA-256, size, and dimensions are retained in `photos.json` as `sourceOriginalFacts`.

### T01 — Yamanote Line · Shibuya

[Shibuya Station Yamanote Line Platform 20080522](https://commons.wikimedia.org/wiki/File:Shibuya_Station_Yamanote_Line_Platform_20080522.jpg) — [Rukin](https://commons.wikimedia.org/wiki/User:Rukin), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

- Display file: `yamanote-shibuya-2008-graded.jpg`
- Unmodified source retained in the original handoff kit, not deployed here: `assets/photos/sources/yamanote-shibuya-2008-original.jpg`. Its SHA-256 is retained in `photos.json`.
- Captured: 2008-05-22, as recorded by the source. This is an indoor platform, not a dusk outdoor shot.
- Changes: the original photo was graded with lower brightness, slightly higher contrast, cooler tones, lower saturation, and light grain, then downscaled to 180 pixels tall and re-saved as a quality-45 JPEG for an early-2000s web look (see `PHOTO_PROCESSING.md`); the header also uses CSS display cropping. No scene objects were intentionally added or removed. The full-size graded file's facts are retained in `photos.json` as `gradedFileFacts`.
- **Use the source link, Rukin credit, license link, and an explicit “color and tone edited” notice in the site's visible credits. The adapted display photo remains CC BY-SA 4.0.** Do not substitute the generative preview from the conversation.

### H01 — Mong Kok · Portland Street

[HK Portland Street Night](https://commons.wikimedia.org/wiki/File:HK_Portland_Street_Night.jpg) — [UCLARodent](https://en.wikipedia.org/wiki/User:UCLARodent), [CC BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5/).

- File: `mong-kok-portland-street.jpg`
- Original upload: 2007-01-13. The exact capture date is unrecorded; do not caption this as a verified 2007 photo.
- Changes: the downloaded JPEG was downscaled to 180 pixels tall and re-saved as a quality-45 JPEG for an early-2000s web look (see `PHOTO_PROCESSING.md`); the header uses CSS display cropping. The unmodified download's facts are retained in `photos.json` as `sourceOriginalFacts`. The adapted display photo remains CC BY-SA 2.5.
- The source offers several license options. This kit chooses CC BY-SA 2.5.

## Implementation requirements

- Serve the three display JPEGs locally. Do not hotlink Wikimedia/Flickr, use remote embeds, or load remote photos in CSS. Keep the unmodified source files in the original kit as provenance references; the live page only needs the downscaled display files.
- Retain each photo's title, creator, source link, license link, and accurate changes notice. The site templates and locale dictionaries contain translated labels, alt text, captions, and a photo-change notice.
- The two adapted/ShareAlike source licenses apply to their individual photos. Do not apply a blanket code license to third-party photographs or imply the photographers endorse the website. Merely collecting photos in a kit does not relicense the rest of the site.
- If later changing the image files or their displayed crop, keep each credit and update its changes notice. Each photographer's file page provides the authoritative reuse terms.

## Other assets

`references/approved-design.png` is the generated layout reference approved in the conversation. Its header photos are placeholders; do not crop its image pixels, logos, or browser UI into production. Use the three selected real source photos instead.

The supplied kit records its source-check date as 2026-09-24. Machine-readable metadata, exact file hashes, and source revisions are preserved in `photos.json`; its provenance paths are relative to the original kit root.
