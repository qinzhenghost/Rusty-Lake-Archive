# Step 10 — Visual Asset System + First Image Batch

## Goal

Move Rusty Lake Archive from a mostly text-only archive into a visual reading experience without copying official screenshots or coupling the site to a heavy media service.

## Asset model

The existing `assetRef` is now reused across three contexts:

1. image StoryBlocks inside the reader;
2. game `heroAsset`;
3. character / concept / location `heroAsset`.

Every asset records:

- `assetType`: placeholder / original / official-licensed;
- `rights`: placeholder / owned / licensed;
- `src`;
- bilingual `alt`;
- optional bilingual `caption`.

Game and archive-entity hero assets are optional so incomplete stubs can still render cleanly.

## First original batch

Twelve lightweight SVG illustrations are stored under `public/visuals/`:

- game-seasons.svg
- game-the-lake.svg
- game-arles.svg
- character-laura.svg
- character-harvey.svg
- character-vincent.svg
- character-corrupted-soul.svg
- concept-black-cube.svg
- concept-white-cube.svg
- location-lauras-room.svg
- location-lake-cabin.svg
- location-arles-bedroom.svg

These are original archive-style illustrations, not extracted game screenshots or traced official artwork.

## Reader images

The first chapter of each complete game now contains one real image StoryBlock:

- Seasons / Spring 1964 → Laura's room;
- The Lake / Arrival → lake cabin;
- Arles / Bedroom → Arles bedroom.

The React reader renders a real image whenever `asset.src` exists and keeps the old placeholder renderer only for placeholder assets.

Reader images use:

- native lazy loading;
- async decoding;
- fixed intrinsic dimensions;
- responsive CSS aspect ratios;
- bilingual alt / caption from content data.

## Card and dossier visuals

- Games index uses game hero artwork.
- Game detail pages show the hero artwork before the summary.
- Character and concept grids use available hero artwork instead of generic blocks.
- Character, concept, and location detail pages display their hero artwork.
- Missing visuals still fall back to the existing placeholder UI.

## Rights boundary

Step10 deliberately uses `assetType: original` + `rights: owned` for the first batch.

Future official press-kit images may only use `official-licensed / licensed` when the project has verified that the specific asset may be used. The presence of an official source URL alone is not treated as an image license.

## Replacement path

The visual system is file-format agnostic. A later high-detail WebP / AVIF asset can replace an SVG by changing `src` while keeping the same data contract, alt text, caption, and page components.

## Acceptance checks

1. Game, character, concept, and location schemas accept optional heroAsset.
2. All first-batch hero assets are original/owned and point to local files.
3. Twelve SVG assets exist and contain no external URLs.
4. All three complete games have hero artwork.
5. Laura, Harvey, Vincent, Corrupted Soul, Black Cube, White Cube and three key locations have hero artwork.
6. First chapters of Seasons, The Lake and Arles contain real image StoryBlocks.
7. Reader uses real <img> tags for source-backed image blocks with lazy loading / async decoding.
8. Game/character/concept/location pages render VisualAsset when available.
9. Bilingual alt and captions remain supported.
10. No official screenshot or unlicensed raster asset is introduced.
11. Step04–Step09 and i18n regression QA remain green.
12. Astro diagnostics and production build pass.
