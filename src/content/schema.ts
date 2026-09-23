export type Locale = 'zhHans' | 'en';
export type LocalizedText = Record<Locale, string>;
export type EntityType = 'game' | 'chapter' | 'character' | 'concept' | 'location' | 'event';
export type EntityRef = { type: EntityType; id: string };
export type RichToken =
  | { kind: 'text'; text: string }
  | { kind: 'entity'; entity: EntityRef; label: string };
export type LocalizedRichText = Record<Locale, RichToken[]>;
export type SpoilerRule = {
  level: 'none' | 'minor' | 'major' | 'cross-game';
  requiredCompletedGameIds: string[];
  allowManualReveal: boolean;
  reason?: LocalizedText;
};
export type UserProgress = {
  completedGameIds: string[];
  manualRevealIds?: string[];
};
export type ClaimKind = 'fact' | 'interpretation' | 'theory';

export type StoryBlock =
  | { id:string; type:'scene'; title:LocalizedText; subtitle?:LocalizedText; spoiler:SpoilerRule }
  | { id:string; type:'paragraph'; content:LocalizedRichText; spoiler:SpoilerRule }
  | { id:string; type:'dialogue'; speaker:EntityRef; content:LocalizedRichText; spoiler:SpoilerRule }
  | { id:string; type:'image'; asset:{assetType:'placeholder'|'original'|'official-licensed';rights:'placeholder'|'owned'|'licensed';src?:string;alt:LocalizedText;caption?:LocalizedText}; spoiler:SpoilerRule }
  | { id:string; type:'quote'; content:LocalizedText; attribution:LocalizedText; spoiler:SpoilerRule }
  | { id:string; type:'event'; eventId:string; summary:LocalizedRichText; spoiler:SpoilerRule }
  | { id:string; type:'interaction'; action:'open-entity'|'reveal-spoiler'|'jump-to-event'; target:EntityRef; label:LocalizedText; spoiler:SpoilerRule }
  | { id:string; type:'note'; title:LocalizedText; content:LocalizedRichText; tone:'archive'|'context'|'warning'; spoiler:SpoilerRule };
