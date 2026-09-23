# Step 08 — Full Archive Search + Spoiler-safe Discovery

## Goal

Add a static, progress-aware search layer that can find story text and lore across the whole archive, while keeping the project deployable as a pure Astro static site.

## Search coverage

The build-time index contains:

- games;
- chapters;
- individual searchable story blocks;
- characters;
- concepts;
- locations;
- dated events;
- dossier entries;
- structured relations.

Each search document preserves the original `SpoilerRule`, source IDs, destination route, optional Lore Network focus key, and up to three related reader routes.

## Spoiler behavior

Search does not score all documents and redact afterward. It first filters the index through the shared `canView()` function using:

- `rla-progress-v1`;
- `rla-manual-reveals-v1`;
- the original content ID for manual reveal compatibility.

Only the resulting visible set participates in query matching and ranking. A locked The Lake dossier entry or relation therefore does not appear merely because a user types a matching keyword.

This is a user-interface spoiler boundary for a static site. The project does not claim cryptographic secrecy for published static content.

## Navigation

Search results can provide three paths:

1. open the canonical archive/detail route;
2. jump directly into relevant story chapters;
3. focus the matching entity inside `/network`.

Character, concept, and location dossier pages also expose “Quick Paths” back to the story and the network.

## Search implementation

- no external search service;
- no database;
- no Fuse/Lunr/Algolia dependency;
- deterministic local substring ranking;
- bilingual Chinese/English search text;
- URL state through `?q=` and `?kind=`;
- desktop `/` shortcut focuses the search box;
- maximum 60 visible results per query.

## Acceptance checks

1. `/search` exists and is linked from desktop/mobile navigation.
2. Search index covers all intended content classes.
3. Story search is block-level rather than only chapter-title search.
4. Dossier entries and relations retain their spoiler rules.
5. Search filters with shared `canView()` before scoring.
6. Manual reveals use the original content ID and remain compatible.
7. Search query/type state can be shared through the URL.
8. Results expose canonical archive, reader, and Lore Network jumps when available.
9. Character/concept/location pages expose direct reader + network Quick Paths.
10. No heavyweight search dependency is added.
11. Step04–Step07 regression QA remains green.
12. Astro diagnostics and production static build remain green.
