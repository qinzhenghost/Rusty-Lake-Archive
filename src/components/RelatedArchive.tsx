import { useEffect, useMemo, useState } from 'react';
import type { EntityRef, UserProgress } from '../content/schema';
import { canView } from '../content/spoiler';
import type { EntityRecord, RelationData, RelationType } from '../lib/models';

type Props = {
  subject: EntityRef;
  relations: RelationData[];
  entityMap: Record<string, EntityRecord>;
};

const PROGRESS_KEY = 'rla-progress-v1';
const REVEAL_KEY = 'rla-manual-reveals-v1';

const LABELS: Record<RelationType, string> = {
  appears_in: '出现于',
  companion_of: '同伴',
  located_at: '位于',
  involves: '涉及',
  associated_with: '关联',
  precedes: '早于',
  follows: '晚于',
  references: '引用',
  part_of: '属于',
};

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

function titleFor(ref: EntityRef, entityMap: Record<string, EntityRecord>) {
  const record = entityMap[keyOf(ref)];
  return record && 'title' in record ? record.title.zhHans : ref.id;
}

export default function RelatedArchive({ subject, relations, entityMap }: Props) {
  const [progress, setProgress] = useState<UserProgress>({ completedGameIds: [], manualRevealIds: [] });
  useEffect(() => setProgress(loadProgress()), []);

  const visible = useMemo(
    () => relations.filter((relation) => canView(relation.spoiler, progress, relation.id)),
    [relations, progress],
  );
  const hidden = relations.length - visible.length;

  return <section className="related-archive">
    <div className="related-head">
      <div><div className="kicker">Lore Network</div><h2>相关档案</h2></div>
      <a href={'/network?focus=' + encodeURIComponent(keyOf(subject))}>在关系网中查看 →</a>
    </div>
    {visible.length > 0 ? <div className="related-grid">
      {visible.map((relation) => {
        const forward = keyOf(relation.from) === keyOf(subject);
        const other = forward ? relation.to : relation.from;
        const href = hrefFor(other, entityMap);
        const content = <><span className="related-type">{forward ? '→' : '←'} {LABELS[relation.type]}</span><b>{titleFor(other, entityMap)}</b><small>{relation.claimKind} · {relation.sourceIds.join(' · ')}</small></>;
        return href
          ? <a className="related-card" href={href} key={relation.id}>{content}</a>
          : <article className="related-card" key={relation.id}>{content}</article>;
      })}
    </div> : <div className="empty-state">当前进度下暂无可见关系。</div>}
    {hidden > 0 && <p className="related-locked">有 {hidden} 条关系因游玩进度隐藏。<a href="/progress">调整防剧透进度</a></p>}
  </section>;
}
