# Photo processing

## T01 source-faithful color grade

The selected train photo is Rukin's real 2008 Shibuya Station Yamanote platform photograph. `assets/photos/sources/yamanote-shibuya-2008-original.jpg` in the original handoff kit is the unmodified downloaded source; `yamanote-shibuya-2008-graded.jpg` beside this record is the deployed website display asset. Only the display image is copied into this repository; the source hash and original kit path are retained in `photos.json`. The approved mockup's train scene is generated reference art and is not used as photo content.

The display file was made with conventional ImageMagick color/contrast controls: brightness 93%, saturation 87%, contrast +9, brightness -5, blue channel ×1.05, a 5% navy colorization, and a subtle Gaussian grain. It keeps the same 1500×1125 frame and scene. The grain operation was unseeded, so rerunning the recipe creates slightly different bytes; `gradedFileFacts` in `photos.json` identifies the supplied approved output. No weather, objects, or new scenery were added. Do not claim the original was shot at dusk: it is an indoor station photograph.

Display the grade without an extra page-wide filter. If a different edit is made later, update the change notice and credit. Attribution must name Rukin, link the source and CC BY-SA 4.0 license, identify the color edit, and keep the adapted photo under CC BY-SA 4.0.

## Early-2000s web export (all three photos)

On 2026-09-24 each deployed file (the unmodified S01 and H01 downloads and the graded T01 file) was downscaled to 180 pixels tall, keeping its aspect ratio, and re-saved as a JPEG at quality 45 with macOS sips (`sips-316`, macOS 26.6.2):

```sh
sips --resampleHeight 180 -s format jpeg -s formatOptions 45 input.jpg --out output.jpg
```

The results are 320×180 (S01) and 240×180 (T01, H01), near their 1x header size, so compression artifacts and softness read like photos on an early-2000s web page. The stylesheet scales them with `image-rendering: pixelated` to keep that texture on high-density screens. No objects, weather, or scenery were added or removed. Other sips versions may produce different bytes; the `sha256` in `photos.json` identifies the deployed output, while `sourceOriginalFacts` and `gradedFileFacts` record the inputs. The visible change notice in every locale describes this export.
