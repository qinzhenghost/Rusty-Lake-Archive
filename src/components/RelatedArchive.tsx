import { useEffect, useMemo, useState } from 'react';
import type { EntityRef, UserProgress } from '../content/schema';
import { canView } from '../content/spoiler';
import type { EntityRecord, RelationData, RelationType } from '../lib/models';
import { useArchiveLanguage } from './useArchiveLanguage';

type Props = { subject: EntityRef; relations: RelationData[]; entityMap: Record<string, EntityRecord> };
const PROGRESS_KEY = 'rla-progress-v1';
const REVEAL_KEY = 'rla-manual-reveals-v1';
const LABELS: Record<RelationType, { zhHans: string; en: string }> = {
  appears_in:{zhHans:'出现于',en:'appears in'}, companion_of:{zhHans:'同伴',en:'companion of'}, located_at:{zhHans:'位于',en:'located at'},
  involves:{zhHans:'涉及',en:'involves'}, associated_with:{zhHans:'关联',en:'associated with'}, precedes:{zhHans:'早于',en:'precedes'},
  follows:{zhHans:'晚于',en:'follows'}, references:{zhHans:'引用',en:'references'}, part_of:{zhHans:'属于',en:'part of'},
};
function keyOf(ref: EntityRef) { return ref.type + ':' + ref.id; }
function claimLabel(kind: string, language: 'zhHans' | 'en') {
  if (language === 'en') return kind;
  return kind === 'fact' ? '事实' : kind === 'interpretation' ? '解释' : kind === 'theory' ? '理论' : kind;
}
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
export default function RelatedArchive({ subject, relations, entityMap }: Props) {
  const [language] = useArchiveLanguage();
  const [progress, setProgress] = useState<UserProgress>({ completedGameIds: [], manualRevealIds: [] });
  useEffect(() => setProgress(loadProgress()), []);
  const visible = useMemo(() => relations.filter((relation) => canView(relation.spoiler, progress, relation.id)), [relations, progress]);
  const hidden = relations.length - visible.length;
  const titleFor = (ref: EntityRef) => {
    const record = entityMap[keyOf(ref)];
    return record && 'title' in record ? record.title[language] : ref.id;
  };

  return <section className="related-archive">
    <div className="related-head">
      <div><div className="kicker">{language === 'en' ? 'Lore Network' : '世界观关系网'}</div><h2>{language === 'en' ? 'Related Files' : '相关档案'}</h2></div>
      <a href={'/network?focus=' + encodeURIComponent(keyOf(subject))}>{language === 'en' ? 'View in network' : '在关系网中查看'} →</a>
    </div>
    {visible.length > 0 ? <div className="related-grid">
      {visible.map((relation) => {
        const forward = keyOf(relation.from) === keyOf(subject);
        const other = forward ? relation.to : relation.from;
        const href = hrefFor(other, entityMap);
        const content = <><span className="related-type">{forward ? '→' : '←'} {LABELS[relation.type][language]}</span><b>{titleFor(other)}</b><small>{claimLabel(relation.claimKind, language)} · {relation.sourceIds.join(' · ')}</small></>;
        return href ? <a className="related-card" href={href} key={relation.id}>{content}</a> : <article className="related-card" key={relation.id}>{content}</article>;
      })}
    </div> : <div className="empty-state">{language === 'en' ? 'No visible relations at the current progress level.' : '当前进度下暂无可见关系。'}</div>}
    {hidden > 0 && <p className="related-locked">{language === 'en' ? hidden + ' relation(s) are hidden by play progress. ' : '有 ' + hidden + ' 条关系因游玩进度隐藏。'}<a href="/progress">{language === 'en' ? 'Adjust spoiler progress' : '调整防剧透进度'}</a></p>}
  </section>;
}
