import type {
  AssetRef,
  ClaimKind,
  EntityRef,
  LocalizedRichText,
  LocalizedText,
  SpoilerRule,
  StoryBlock,
} from '../content/schema';

export type Provenance = {
  mode: string;
  sourceIds: string[];
};

export type StoryBlockData = StoryBlock & { provenance?: Provenance };

export type TimelinePoint = {
  year: number;
  season?: string;
  precision: string;
  sortKey: string;
  certainty: string;
};

export type GameData = {
  kind: 'game';
  schemaVersion: string;
  id: string;
  slug: string;
  title: LocalizedText;
  series: string;
  releaseDate?: string;
  releaseOrder?: number;
  recommendedPlayOrder?: number;
  contentStatus: 'partial' | 'complete' | 'stub';
  summary: LocalizedText;
  heroAsset?: AssetRef;
  chapterIds: string[];
  spoiler: SpoilerRule;
  sourceIds: string[];
};

export type ChapterData = {
  kind: 'chapter';
  schemaVersion: string;
  id: string;
  gameId: string;
  slug: string;
  narrativeOrder: number;
  title: LocalizedText;
  timeline: TimelinePoint | null;
  storyBlocks: StoryBlockData[];
  featuredRefs: EntityRef[];
  eventIds: string[];
  spoiler: SpoilerRule;
  sourceIds: string[];
};

export type ArchiveEntry = {
  id: string;
  claimKind: ClaimKind;
  content: LocalizedRichText;
  spoiler: SpoilerRule;
  provenance?: Provenance;
};

export type ArchiveEntity = {
  kind: 'character' | 'concept' | 'location';
  schemaVersion: string;
  id: string;
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  heroAsset?: AssetRef;
  entries: ArchiveEntry[];
  spoiler: SpoilerRule;
  sourceIds: string[];
  aliases?: string[];
  timelineRefs?: string[];
};

export type EventData = {
  kind: 'event';
  schemaVersion: string;
  id: string;
  title: LocalizedText;
  timeline: TimelinePoint;
  summary: LocalizedText;
  gameIds: string[];
  chapterIds: string[];
  participants: EntityRef[];
  locations: EntityRef[];
  concepts: EntityRef[];
  spoiler: SpoilerRule;
  sourceIds: string[];
};

export type RelationType =
  | 'appears_in'
  | 'companion_of'
  | 'located_at'
  | 'involves'
  | 'associated_with'
  | 'precedes'
  | 'follows'
  | 'references'
  | 'part_of';

export type RelationData = {
  id: string;
  from: EntityRef;
  type: RelationType;
  to: EntityRef;
  spoiler: SpoilerRule;
  claimKind: ClaimKind;
  sourceIds: string[];
};

export type RelationSetData = {
  kind: 'relationSet';
  schemaVersion: string;
  id: string;
  title: LocalizedText;
  relations: RelationData[];
};

export type SearchKind =
  | 'game'
  | 'chapter'
  | 'story'
  | 'character'
  | 'concept'
  | 'location'
  | 'event'
  | 'entry'
  | 'relation';

export type SearchReaderLink = {
  title: LocalizedText;
  route: string;
};

export type SearchDocument = {
  id: string;
  contentId: string;
  kind: SearchKind;
  title: LocalizedText;
  excerpt: LocalizedText;
  searchText: LocalizedText;
  route: string;
  networkFocus?: string;
  readerLinks: SearchReaderLink[];
  spoiler: SpoilerRule;
  sourceIds: string[];
};

export type EntityRecord = ArchiveEntity | EventData | GameData | ChapterData;
