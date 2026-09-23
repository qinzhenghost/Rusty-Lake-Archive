import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { EntityRef } from '../content/schema';
import type { ArchiveEntity, ChapterData, EntityRecord, EventData, GameData } from './models';

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

export function getEvents(): EventData[] {
  return jsonFiles('events')
    .map((path) => parseJson<EventData>(path))
    .filter((item) => item.kind === 'event')
    .sort((a, b) => a.timeline.sortKey.localeCompare(b.timeline.sortKey));
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
