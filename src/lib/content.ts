import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { EntityRef } from '../content/schema';
import type {
  ArchiveEntity,
  ChapterData,
  EntityRecord,
  EventData,
  GameData,
  RelationData,
  RelationSetData,
  SearchDocument,
  SearchReaderLink,
  StoryBlockData,
} from './models';

const contentRoot = join(process.cwd(), 'content');

function parseJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function jsonFiles(dir: string): string[] {
  const full = join(contentRoot, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full, { withFileTypes: true }).flatMap((entry) => {
    const path = join(full, entry.name);
    if (entry.isDirectory()) {
      return readdirSync(path, { withFileTypes: true })
        .filter((child) => child.isFile() && child.name.endsWith('.json'))
        .map((child) => join(path, child.name));
    }
    return entry.isFile() && entry.name.endsWith('.json') ? [path] : [];
  });
}

export function getGames(): GameData[] {
  return jsonFiles('games')
    .map((path) => parseJson<GameData>(path))
    .filter((item) => item.kind === 'game')
    .sort((a, b) => (a.recommendedPlayOrder ?? 999) - (b.recommendedPlayOrder ?? 999));
}

export function getGameBySlug(slug: string): GameData | undefined {
  return getGames().find((game) => game.slug === slug);
}

export function getChapters(): ChapterData[] {
  return jsonFiles('chapters')
    .map((path) => parseJson<ChapterData>(path))
    .filter((item) => item.kind === 'chapter')
    .sort((a, b) => a.narrativeOrder - b.narrativeOrder);
}

export function getChaptersForGame(gameId: string): ChapterData[] {
  return getChapters().filter((chapter) => chapter.gameId === gameId);
}

export function getChapter(gameId: string, slug: string): ChapterData | undefined {
  return getChapters().find((chapter) => chapter.gameId === gameId && chapter.slug === slug);
}

export function getArchiveEntities(): ArchiveEntity[] {
  return ['characters', 'concepts', 'locations'].flatMap((dir) =>
    jsonFiles(dir).map((path) => parseJson<ArchiveEntity>(path)),
  );
}

export function getCharacters(): ArchiveEntity[] {
  return getArchiveEntities().filter((item) => item.kind === 'character');
}

export function getConcepts(): ArchiveEntity[] {
  return getArchiveEntities().filter((item) => item.kind === 'concept');
}

export function getLocations(): ArchiveEntity[] {
  return getArchiveEntities().filter((item) => item.kind === 'location');
}

export function getEvents(): EventData[] {
  return jsonFiles('events')
    .map((path) => parseJson<EventData>(path))
    .filter((item) => item.kind === 'event')
    .sort((a, b) => a.timeline.sortKey.localeCompare(b.timeline.sortKey));
}

export function getRelationSets(): RelationSetData[] {
  return jsonFiles('relations')
    .map((path) => parseJson<RelationSetData>(path))
    .filter((item) => item.kind === 'relationSet');
}

export function getRelations(): RelationData[] {
  return getRelationSets().flatMap((set) => set.relations);
}

export function getRelationsForRef(ref: EntityRef): RelationData[] {
  return getRelations().filter((relation) =>
    (relation.from.type === ref.type && relation.from.id === ref.id) ||
    (relation.to.type === ref.type && relation.to.id === ref.id),
  );
}

export function getEntityRecord(ref: EntityRef): EntityRecord | undefined {
  if (ref.type === 'game') return getGames().find((item) => item.id === ref.id);
  if (ref.type === 'chapter') return getChapters().find((item) => item.id === ref.id);
  if (ref.type === 'event') return getEvents().find((item) => item.id === ref.id);
  return getArchiveEntities().find((item) => item.id === ref.id && item.kind === ref.type);
}

export function getEntityMap(): Record<string, EntityRecord> {
  const records: EntityRecord[] = [...getGames(), ...getChapters(), ...getEvents(), ...getArchiveEntities()];
  return Object.fromEntries(records.map((record) => [`${record.kind}:${record.id}`, record]));
}

export function entityKey(ref: EntityRef): string {
  return `${ref.type}:${ref.id}`;
}

export function routeForRef(ref: EntityRef): string | null {
  if (ref.type === 'character') {
    const entity = getArchiveEntities().find((item) => item.id === ref.id && item.kind === 'character');
    return entity ? `/characters/${entity.slug}` : null;
  }
  if (ref.type === 'concept') {
    const entity = getArchiveEntities().find((item) => item.id === ref.id && item.kind === 'concept');
    return entity ? `/lore/${entity.slug}` : null;
  }
  if (ref.type === 'location') {
    const entity = getArchiveEntities().find((item) => item.id === ref.id && item.kind === 'location');
    return entity ? `/locations/${entity.slug}` : null;
  }
  if (ref.type === 'game') {
    const game = getGames().find((item) => item.id === ref.id);
    return game ? `/games/${game.slug}` : null;
  }
  if (ref.type === 'chapter') {
    const chapter = getChapters().find((item) => item.id === ref.id);
    const game = chapter && getGames().find((item) => item.id === chapter.gameId);
    return chapter && game ? `/read/${game.slug}/${chapter.slug}` : null;
  }
  if (ref.type === 'event') {
    const event = getEvents().find((item) => item.id === ref.id);
    const chapter = event?.chapterIds[0] && getChapters().find((item) => item.id === event.chapterIds[0]);
    const game = chapter && getGames().find((item) => item.id === chapter.gameId);
    return chapter && game ? `/read/${game.slug}/${chapter.slug}` : '/timeline';
  }
  return null;
}


function richTextToText(tokens: { kind: string; text?: string; label?: string; entity?: EntityRef }[], locale: 'zhHans' | 'en'): string {
  return tokens.map((token) => {
    if (token.kind === 'text') return token.text ?? '';
    if (token.entity) {
      const record = getEntityRecord(token.entity);
      if (record && 'title' in record) return record.title[locale];
    }
    return token.label ?? '';
  }).join('');
}

function storyBlockText(block: StoryBlockData, locale: 'zhHans' | 'en'): string {
  if (block.type === 'paragraph' || block.type === 'dialogue' || block.type === 'note') {
    return richTextToText(block.content[locale], locale);
  }
  if (block.type === 'event') return richTextToText(block.summary[locale], locale);
  if (block.type === 'scene') return [block.title[locale], block.subtitle?.[locale] ?? ''].filter(Boolean).join(' · ');
  if (block.type === 'quote') return block.content[locale];
  if (block.type === 'interaction') return block.label[locale];
  if (block.type === 'image') return [block.asset.alt[locale], block.asset.caption?.[locale] ?? ''].filter(Boolean).join(' · ');
  return '';
}

function networkFocusForRef(ref: EntityRef): string | undefined {
  return ['game', 'character', 'concept', 'location', 'event'].includes(ref.type)
    ? entityKey(ref)
    : undefined;
}

export function getReaderLinksForRef(ref: EntityRef): SearchReaderLink[] {
  const games = getGames();
  const chapters = getChapters();
  if (ref.type === 'chapter') {
    const chapter = chapters.find((item) => item.id === ref.id);
    const game = chapter && games.find((item) => item.id === chapter.gameId);
    return chapter && game ? [{ title: chapter.title, route: `/read/${game.slug}/${chapter.slug}` }] : [];
  }
  if (ref.type === 'event') {
    const event = getEvents().find((item) => item.id === ref.id);
    return (event?.chapterIds ?? []).flatMap((chapterId) => {
      const chapter = chapters.find((item) => item.id === chapterId);
      const game = chapter && games.find((item) => item.id === chapter.gameId);
      return chapter && game ? [{ title: chapter.title, route: `/read/${game.slug}/${chapter.slug}` }] : [];
    }).slice(0, 3);
  }
  if (ref.type === 'game') {
    const game = games.find((item) => item.id === ref.id);
    if (!game) return [];
    return getChaptersForGame(game.id).slice(0, 3).map((chapter) => ({
      title: chapter.title,
      route: `/read/${game.slug}/${chapter.slug}`,
    }));
  }
  return chapters
    .filter((chapter) => chapter.featuredRefs.some((item) => item.type === ref.type && item.id === ref.id))
    .slice(0, 3)
    .flatMap((chapter) => {
      const game = games.find((item) => item.id === chapter.gameId);
      return game ? [{ title: chapter.title, route: `/read/${game.slug}/${chapter.slug}` }] : [];
    });
}

function entitySearchDocument(record: EntityRecord): SearchDocument {
  const ref: EntityRef = { type: record.kind, id: record.id };
  const route = routeForRef(ref) ?? '/';
  const summary = 'summary' in record
    ? record.summary
    : { zhHans: record.title.zhHans, en: record.title.en };
  const extraZh = record.kind === 'character' ? (record.aliases ?? []).join(' ') : '';
  const extraEn = extraZh;
  return {
    id: `entity:${record.kind}:${record.id}`,
    contentId: record.id,
    kind: record.kind,
    title: record.title,
    excerpt: summary,
    searchText: {
      zhHans: [record.title.zhHans, summary.zhHans, record.id, extraZh].filter(Boolean).join(' '),
      en: [record.title.en, summary.en, record.id, extraEn].filter(Boolean).join(' '),
    },
    route,
    networkFocus: networkFocusForRef(ref),
    readerLinks: getReaderLinksForRef(ref),
    spoiler: record.spoiler,
    sourceIds: record.sourceIds,
  };
}

export function getSearchDocuments(): SearchDocument[] {
  const games = getGames();
  const chapters = getChapters();
  const archiveEntities = getArchiveEntities();
  const events = getEvents();
  const entityMap = getEntityMap();

  const entityDocs = [...games, ...chapters, ...archiveEntities, ...events].map(entitySearchDocument);

  const storyDocs: SearchDocument[] = chapters.flatMap((chapter) => {
    const game = games.find((item) => item.id === chapter.gameId);
    if (!game) return [];
    return chapter.storyBlocks
      .map((block): SearchDocument | null => {
        const zh = storyBlockText(block, 'zhHans').trim();
        const en = storyBlockText(block, 'en').trim();
        if (!zh && !en) return null;
        return {
          id: `story:${chapter.id}:${block.id}`,
          contentId: block.id,
          kind: 'story',
          title: chapter.title,
          excerpt: { zhHans: zh, en },
          searchText: {
            zhHans: [chapter.title.zhHans, game.title.zhHans, zh].join(' '),
            en: [chapter.title.en, game.title.en, en].join(' '),
          },
          route: `/read/${game.slug}/${chapter.slug}`,
          networkFocus: undefined,
          readerLinks: [{ title: chapter.title, route: `/read/${game.slug}/${chapter.slug}` }],
          spoiler: block.spoiler,
          sourceIds: block.provenance?.sourceIds ?? chapter.sourceIds,
        };
      })
      .filter((item): item is SearchDocument => item !== null);
  });

  const entryDocs: SearchDocument[] = archiveEntities.flatMap((entity) => {
    const ref: EntityRef = { type: entity.kind, id: entity.id };
    const route = routeForRef(ref) ?? '/';
    return entity.entries.map((entry) => {
      const zh = richTextToText(entry.content.zhHans, 'zhHans');
      const en = richTextToText(entry.content.en, 'en');
      return {
        id: `entry:${entity.kind}:${entity.id}:${entry.id}`,
        contentId: entry.id,
        kind: 'entry',
        title: entity.title,
        excerpt: { zhHans: zh, en },
        searchText: {
          zhHans: [entity.title.zhHans, entity.id, zh].join(' '),
          en: [entity.title.en, entity.id, en].join(' '),
        },
        route,
        networkFocus: networkFocusForRef(ref),
        readerLinks: getReaderLinksForRef(ref),
        spoiler: entry.spoiler,
        sourceIds: entry.provenance?.sourceIds ?? entity.sourceIds,
      };
    });
  });

  const relationDocs: SearchDocument[] = getRelations().map((relation) => {
    const fromRecord = entityMap[entityKey(relation.from)];
    const toRecord = entityMap[entityKey(relation.to)];
    const fromZh = fromRecord && 'title' in fromRecord ? fromRecord.title.zhHans : relation.from.id;
    const fromEn = fromRecord && 'title' in fromRecord ? fromRecord.title.en : relation.from.id;
    const toZh = toRecord && 'title' in toRecord ? toRecord.title.zhHans : relation.to.id;
    const toEn = toRecord && 'title' in toRecord ? toRecord.title.en : relation.to.id;
    const fromRoute = routeForRef(relation.from);
    const toRoute = routeForRef(relation.to);
    const readerLinks = [
      ...getReaderLinksForRef(relation.from),
      ...getReaderLinksForRef(relation.to),
    ].filter((link, index, all) => all.findIndex((item) => item.route === link.route) === index).slice(0, 3);
    return {
      id: `relation:${relation.id}`,
      contentId: relation.id,
      kind: 'relation',
      title: {
        zhHans: `${fromZh} ↔ ${toZh}`,
        en: `${fromEn} ↔ ${toEn}`,
      },
      excerpt: {
        zhHans: `${fromZh} 与 ${toZh} 的结构化关系：${relation.type}`,
        en: `Structured relation between ${fromEn} and ${toEn}: ${relation.type}`,
      },
      searchText: {
        zhHans: [fromZh, toZh, relation.type, relation.claimKind].join(' '),
        en: [fromEn, toEn, relation.type, relation.claimKind].join(' '),
      },
      route: fromRoute ?? toRoute ?? '/network',
      networkFocus: networkFocusForRef(relation.from) ?? networkFocusForRef(relation.to),
      readerLinks,
      spoiler: relation.spoiler,
      sourceIds: relation.sourceIds,
    };
  });

  return [...entityDocs, ...storyDocs, ...entryDocs, ...relationDocs];
}
