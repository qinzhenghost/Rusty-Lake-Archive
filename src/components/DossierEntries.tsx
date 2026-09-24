import { useEffect, useState } from 'react';
import type { EntityRef, RichToken, UserProgress } from '../content/schema';
import { canView } from '../content/spoiler';
import type { ArchiveEntry, EntityRecord } from '../lib/models';
import { useArchiveLanguage } from './useArchiveLanguage';

type Props = { entries: ArchiveEntry[]; entityMap: Record<string, EntityRecord> };
const PROGRESS_KEY = 'rla-progress-v1';
const REVEAL_KEY = 'rla-manual-reveals-v1';

function keyOf(ref: EntityRef) { return ref.type + ':' + ref.id; }
function loadProgress(): UserProgress {
  if (typeof window === 'undefined') return { completedGameIds: [], manualRevealIds: [] };
  try {
    const completed = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '[]');
    const reveals = JSON.parse(localStorage.getItem(REVEAL_KEY) ?? '[]');
    return { completedGameIds: Array.isArray(completed) ? completed : [], manualRevealIds: Array.isArray(reveals) ? reveals : [] };
  } catch { return { completedGameIds: [], manualRevealIds: [] }; }
}
function hrefFor(ref: EntityRef, entityMap: Record<string, EntityRecord>) {
  const record = entityMap[keyOf(ref)];
  if (!record) return null;
  if (record.kind === 'game') return '/games/' + record.slug;
  if (record.kind === 'character') return '/characters/' + record.slug;
  if (record.kind === 'concept') return '/lore/' + record.slug;
  if (record.kind === 'location') return '/locations/' + record.slug;
  if (record.kind === 'event') return '/timeline';
  return null;
}
function RichEntry({ tokens, entityMap, language }: { tokens: RichToken[]; entityMap: Record<string, EntityRecord>; language: 'zhHans' | 'en' }) {
  return <>{tokens.map((token, index) => {
    if (token.kind === 'text') return <span key={index}>{token.text}</span>;
    const href = hrefFor(token.entity, entityMap);
    const record = entityMap[keyOf(token.entity)];
    const label = record && 'title' in record ? record.title[language] : token.label;
    return href ? <a className="entity-inline-link" key={index} href={href}>{label}</a> : <span className="entity-inline-link" key={index}>{label}</span>;
  })}</>;
}
function claimLabel(kind: string, language: 'zhHans' | 'en') {
  if (language === 'en') return kind;
  return kind === 'fact' ? '事实' : kind === 'interpretation' ? '解释' : kind === 'theory' ? '理论' : kind;
}

export default function DossierEntries({ entries, entityMap }: Props) {
  const [language] = useArchiveLanguage();
  const [progress, setProgress] = useState<UserProgress>({ completedGameIds: [], manualRevealIds: [] });
  useEffect(() => setProgress(loadProgress()), []);

  const reveal = (id: string) => {
    const ids = Array.from(new Set([...(progress.manualRevealIds ?? []), id]));
    setProgress({ ...progress, manualRevealIds: ids });
    localStorage.setItem(REVEAL_KEY, JSON.stringify(ids));
  };
  const requiredNames = (ids: string[]) => ids.map((id) => {
    const record = entityMap['game:' + id];
    return record && record.kind === 'game' ? record.title[language] : id;
  }).join(' · ');

  if (entries.length === 0) return <div className="empty-state">{language === 'en' ? 'This structured entity exists, but detailed research entries have not been added yet.' : '当前档案已经建立结构化实体，但详细考据条目尚未录入。'}</div>;

  return <div className="dossier-entry-list">
    {entries.map((entry) => {
      const visible = canView(entry.spoiler, progress, entry.id);
      if (!visible) return <article className="dossier-entry locked-entry" key={entry.id}>
        <div className="kicker">{language === 'en' ? 'Locked Entry' : '锁定条目'}</div>
        <div className="redact" />
        <p className="muted">{language === 'en' ? 'Complete first: ' : '需要先完成：'}{requiredNames(entry.spoiler.requiredCompletedGameIds) || (language === 'en' ? 'later archive content' : '后续档案')}</p>
        {entry.spoiler.allowManualReveal && <button type="button" onClick={() => reveal(entry.id)}>{language === 'en' ? 'Reveal anyway' : '仍然查看'}</button>}
      </article>;
      return <article className="dossier-entry detail-card" key={entry.id}>
        <div className="kicker">{claimLabel(entry.claimKind, language)}</div>
        <p><RichEntry tokens={entry.content[language]} entityMap={entityMap} language={language} /></p>
        <small className="source-line">{language === 'en' ? 'SOURCE' : '来源'} · {entry.provenance?.sourceIds.join(' · ') ?? 'archive'}</small>
      </article>;
    })}
  </div>;
}
