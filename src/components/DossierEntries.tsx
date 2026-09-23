import { useEffect, useState } from 'react';
import type { EntityRef, RichToken, UserProgress } from '../content/schema';
import { canView } from '../content/spoiler';
import type { ArchiveEntry, EntityRecord } from '../lib/models';

type Props = {
  entries: ArchiveEntry[];
  entityMap: Record<string, EntityRecord>;
};

const PROGRESS_KEY = 'rla-progress-v1';
const REVEAL_KEY = 'rla-manual-reveals-v1';

function keyOf(ref: EntityRef) { return ref.type + ':' + ref.id; }

function loadProgress(): UserProgress {
  if (typeof window === 'undefined') return { completedGameIds: [], manualRevealIds: [] };
  try {
    const completed = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '[]');
    const reveals = JSON.parse(localStorage.getItem(REVEAL_KEY) ?? '[]');
    return {
      completedGameIds: Array.isArray(completed) ? completed : [],
      manualRevealIds: Array.isArray(reveals) ? reveals : [],
    };
  } catch {
    return { completedGameIds: [], manualRevealIds: [] };
  }
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

function RichEntry({ tokens, entityMap }: { tokens: RichToken[]; entityMap: Record<string, EntityRecord> }) {
  return <>{tokens.map((token, index) => {
    if (token.kind === 'text') return <span key={index}>{token.text}</span>;
    const href = hrefFor(token.entity, entityMap);
    return href
      ? <a className="entity-inline-link" key={index} href={href}>{token.label}</a>
      : <span className="entity-inline-link" key={index}>{token.label}</span>;
  })}</>;
}

export default function DossierEntries({ entries, entityMap }: Props) {
  const [progress, setProgress] = useState<UserProgress>({ completedGameIds: [], manualRevealIds: [] });

  useEffect(() => setProgress(loadProgress()), []);

  const reveal = (id: string) => {
    const ids = Array.from(new Set([...(progress.manualRevealIds ?? []), id]));
    const next = { ...progress, manualRevealIds: ids };
    setProgress(next);
    localStorage.setItem(REVEAL_KEY, JSON.stringify(ids));
  };

  if (entries.length === 0) return <div className="empty-state">当前档案已经建立结构化实体，但详细考据条目尚未录入。</div>;

  return <div className="dossier-entry-list">
    {entries.map((entry) => {
      const visible = canView(entry.spoiler, progress, entry.id);
      if (!visible) return <article className="dossier-entry locked-entry" key={entry.id}>
        <div className="kicker">Locked Entry</div>
        <div className="redact" />
        <p className="muted">需要先完成：{entry.spoiler.requiredCompletedGameIds.join(' · ') || '后续档案'}</p>
        {entry.spoiler.allowManualReveal && <button type="button" onClick={() => reveal(entry.id)}>仍然查看</button>}
      </article>;
      return <article className="dossier-entry detail-card" key={entry.id}>
        <div className="kicker">{entry.claimKind}</div>
        <p><RichEntry tokens={entry.content.zhHans} entityMap={entityMap} /></p>
        <small className="source-line">SOURCE · {entry.provenance?.sourceIds.join(' · ') ?? 'archive'}</small>
      </article>;
    })}
  </div>;
}
