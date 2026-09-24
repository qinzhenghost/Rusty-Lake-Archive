# Step 09 — Cube Escape: Arles + Third Complete Archive

## Goal

Add **Cube Escape: Arles** as the third complete reading archive while keeping the site static, bilingual, spoiler-aware, and narrative-first.

## Source decisions

- Rusty Lake's current FAQ recommends the order **Seasons → The Lake → Arles**.
- The official Arles game page identifies it as the third Cube Escape episode and places the player in a bedroom in Arles surrounded by art.
- Rusty Lake's June 5, 2015 release post describes Arles as a side step from the Seasons / The Lake story.
- The archive therefore does **not** invent a direct story reference from Arles to Seasons or The Lake.
- The archive does **not** turn the release date into an in-universe date.

## Reading structure

Four narrative sections:

1. 被画作包围的房间 / A Room Surrounded by Art
2. 完成画布 / Completing the Canvas
3. 进入耳中 / Into the Ear
4. 镜中的另一面 / The Other Side of the Mirror

All four chapters use `timeline: null` and no Event records.

## New archive entities

- 文森特·梵高 / Vincent van Gogh
- 阿尔勒卧室 / Bedroom in Arles
- 白色方块 / White Cube

Existing files expanded:

- 黑色方块 / Black Cube
- 腐化灵魂 / Corrupted Soul

The historical artist is treated explicitly as a **game adaptation**, not as a literal biographical or psychological claim.

## Spoiler behavior

Late Arles dossier entries and relations require `arles` in `rla-progress-v1`.

This applies to:

- White Cube acquisition;
- Black Cube's Arles appearance;
- Corrupted Soul's mirror appearance;
- late-game relation edges.

The story reader itself remains readable in sequence without requiring the user to pre-mark the game complete.

## Copyright / walkthrough boundary

- no long dialogue;
- no official art bundled;
- no puzzle passwords;
- no code solutions;
- no step-by-step walkthrough reproduction;
- only original narrative summaries and structural notes.

## Acceptance checks

1. Arles is a complete game in official recommended position 3.
2. Four chapters exist and each has substantial narrative content.
3. No fake chronology or Event record is created.
4. No known puzzle codes are present in reader content.
5. Vincent, Bedroom in Arles, and White Cube have structured files.
6. Black Cube and Corrupted Soul gain Arles-specific gated entries.
7. Lore Network contains valid Arles relations without inventing direct cross-game references.
8. Arles has a distinct reader accent.
9. Home, Games, About, Progress, Search, and Network integrate Arles through shared data.
10. Full Chinese/English behavior remains intact.
11. Step04–Step08 and i18n regression QA remain green.
12. Astro diagnostics and production build pass.
