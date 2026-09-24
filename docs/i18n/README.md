# Global bilingual interface

The archive now uses a single site-wide language preference stored in `rla-language-v1`.

- Chinese (`zhHans`) is the default.
- English (`en`) is available from the top navigation on every page.
- Static Astro copy uses paired bilingual markup.
- React islands listen to the same `rla-language-change` event and read the same localStorage key.
- The reader no longer maintains an independent language mode.
- Chinese entity/game titles are primary names; English originals remain secondary labels in Chinese mode and become primary in English mode.
- Search continues indexing both languages regardless of current interface language.
- Spoiler progress and language preferences remain independent.

Chinese primary-name examples:
- 逃离方块：四季 / Cube Escape: Seasons
- 逃离方块：锈湖湖畔 / Cube Escape: The Lake
- 逃离方块：磨坊 / Cube Escape: The Mill
- 劳拉·范德布姆 / Laura Vanderboom
- 哈维 / Harvey
- 腐化灵魂 / Corrupted Soul
