# Step 06 — The Lake + Cross-game Spoiler Validation

## Goal

Add **Cube Escape: The Lake** as the second complete reading archive and replace the old placeholder cross-game spoiler demo with real cross-game data.

## Product decisions

- Follow Rusty Lake's current official recommended order: **Seasons → The Lake**.
- Do **not** treat recommended play order or release date as in-universe chronology.
- The Lake's four reading sections keep `timeline: null` because the current primary/official sources used by this project do not establish a reliable story year for this archive.
- Do not create a fake timeline event just to make the timeline page look fuller.
- Keep the reader narrative-first: describe causality and motifs, but omit puzzle passwords and step-by-step walkthrough instructions.
- The cross-game connection is represented structurally: The Lake references Seasons, and the black cube bridges both games.
- The Lake-specific Black Cube and Corrupted Soul dossier entries require `the-lake` in completed-game progress, so opening those dossiers from Seasons stays spoiler-safe.
- The old Laura → The Mill demo-only spoiler entry is removed. The Mill remains a stub for future content but is no longer needed to prove the gate works.

## Acceptance checks

1. The Lake is `complete` and has four readable sections.
2. All four sections are undated and create no fake Event records.
3. The reader exposes an explicit undated state instead of showing Seasons' “RETURN” label.
4. The Lake has a distinct lake accent in the reader.
5. Cross-game relations resolve without broken references.
6. At least one real dossier entry and one relation require completing `the-lake`.
7. The Black Cube connects Seasons and The Lake.
8. No walkthrough codes or quote transcript are included.
9. Legacy Seasons QA remains green.
10. `npm test` and static build pass before Step06 is considered stable.
