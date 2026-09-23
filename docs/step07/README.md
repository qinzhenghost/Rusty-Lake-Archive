# Step 07 — Lore Network + Reverse Navigation

## Goal

Turn the existing structured Relation records into a user-visible exploration layer without adding a graph database or a heavyweight visualization dependency.

## Product decisions

- The network is generated only from `content/relations/*.json`.
- Visual proximity never creates a relationship; every edge must already exist as a Relation.
- The network respects the same local progress keys as the story reader.
- A gated relation is omitted entirely until its spoiler requirements are satisfied, so even the target node identity is not leaked by that edge.
- Search and relation-type filters are view controls only; they do not mutate content data.
- Character, concept, game, and location dossiers expose reverse relationships through the same Relation records.
- Location entities now have stable detail routes under `/locations/[slug]`.
- Full character/concept/location dossier entries now use the same spoiler gate as the reader drawer. Step06's The Lake-specific Black Cube and Corrupted Soul entries therefore remain redacted outside the reader as well.
- Keep the implementation static-friendly: Astro for pages, React islands for progress-aware interactivity, no D3, graph database, server session, or API.

## Acceptance checks

1. `/network` is a statically generated route and appears in desktop/mobile navigation.
2. The network consumes all currently valid Relation records.
3. Relation nodes cover games, characters, concepts, locations, and events when those types are present in visible relations.
4. Relation filtering and node search are interactive.
5. Gated relations use `canView` and the existing local progress keys.
6. Focus links such as `/network?focus=concept:black-cube` select the requested node.
7. Game, character, concept, and location pages link back into the network and show their visible reverse relations.
8. Full dossier pages no longer statically expose gated archive entries.
9. Location nodes have real detail routes.
10. Step04–Step06 regression QA, Astro diagnostics, and static build all remain green.
