import { useEffect, useMemo, useState } from 'react';
import type { EntityRef, UserProgress } from '../content/schema';
import { canView } from '../content/spoiler';
import type { EntityRecord, RelationData, RelationType } from '../lib/models';

type Props = {
  relations: RelationData[];
  entityMap: Record<string, EntityRecord>;
};

type NodeView = {
  key: string;
  ref: EntityRef;
  title: string;
  x: number;
  y: number;
  href: string | null;
};

const PROGRESS_KEY = 'rla-progress-v1';
const REVEAL_KEY = 'rla-manual-reveals-v1';

const RELATION_LABELS: Record<RelationType, string> = {
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

const TYPE_LABELS: Record<EntityRef['type'], string> = {
  game: '作品',
  chapter: '章节',
  character: '人物',
  concept: '概念',
  location: '地点',
  event: '事件',
};

function keyOf(ref: EntityRef): string {
  return ref.type + ':' + ref.id;
}

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

function titleFor(ref: EntityRef, entityMap: Record<string, EntityRecord>): string {
  const record = entityMap[keyOf(ref)];
  if (!record || !('title' in record)) return ref.id;
  return record.title.zhHans;
}

function hrefFor(ref: EntityRef, entityMap: Record<string, EntityRecord>): string | null {
  const record = entityMap[keyOf(ref)];
  if (!record) return null;
  if (record.kind === 'game') return '/games/' + record.slug;
  if (record.kind === 'character') return '/characters/' + record.slug;
  if (record.kind === 'concept') return '/lore/' + record.slug;
  if (record.kind === 'location') return '/locations/' + record.slug;
  if (record.kind === 'event') return '/timeline';
  return null;
}

function makePositions(refs: EntityRef[], entityMap: Record<string, EntityRecord>): NodeView[] {
  const rows: EntityRef['type'][] = ['event', 'character', 'game', 'concept', 'location', 'chapter'];
  const yByType: Record<EntityRef['type'], number> = {
    event: 13,
    character: 33,
    game: 51,
    concept: 70,
    location: 88,
    chapter: 96,
  };
  const output: NodeView[] = [];
  for (const type of rows) {
    const group = refs
      .filter((ref) => ref.type === type)
      .sort((a, b) => titleFor(a, entityMap).localeCompare(titleFor(b, entityMap), 'zh-CN'));
    group.forEach((ref, index) => {
      const span = group.length === 1 ? 0 : 76;
      const x = group.length === 1 ? 50 : 12 + (span * index) / (group.length - 1);
      output.push({
        key: keyOf(ref),
        ref,
        title: titleFor(ref, entityMap),
        x,
        y: yByType[type],
        href: hrefFor(ref, entityMap),
      });
    });
  }
  return output;
}

export default function LoreNetwork({ relations, entityMap }: Props) {
  const [progress, setProgress] = useState<UserProgress>({ completedGameIds: [], manualRevealIds: [] });
  const [selected, setSelected] = useState<string | null>(null);
  const [relationType, setRelationType] = useState<'all' | RelationType>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setProgress(loadProgress());
    const focus = new URLSearchParams(window.location.search).get('focus');
    if (focus) setSelected(focus);
  }, []);

  const unlocked = useMemo(
    () => relations.filter((relation) => canView(relation.spoiler, progress, relation.id)),
    [relations, progress],
  );
  const filteredRelations = useMemo(
    () => relationType === 'all' ? unlocked : unlocked.filter((relation) => relation.type === relationType),
    [unlocked, relationType],
  );
  const refs = useMemo(() => {
    const map = new Map<string, EntityRef>();
    for (const relation of filteredRelations) {
      map.set(keyOf(relation.from), relation.from);
      map.set(keyOf(relation.to), relation.to);
    }
    return [...map.values()];
  }, [filteredRelations]);
  const nodes = useMemo(() => makePositions(refs, entityMap), [refs, entityMap]);
  const nodeMap = useMemo(() => Object.fromEntries(nodes.map((node) => [node.key, node])), [nodes]);
  const gatedCount = relations.length - unlocked.length;
  const relationTypes = useMemo(
    () => [...new Set(unlocked.map((relation) => relation.type))].sort(),
    [unlocked],
  );

  const selectedRelations = selected
    ? filteredRelations.filter((relation) => keyOf(relation.from) === selected || keyOf(relation.to) === selected)
    : [];
  const selectedNode = selected ? nodeMap[selected] : undefined;
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const matchesSearch = (node: NodeView) =>
    !normalizedSearch || node.title.toLocaleLowerCase().includes(normalizedSearch) || node.ref.id.includes(normalizedSearch);

  const edgeActive = (relation: RelationData) => {
    if (!selected) return true;
    return keyOf(relation.from) === selected || keyOf(relation.to) === selected;
  };
  const nodeActive = (node: NodeView) => {
    if (selected) {
      if (node.key === selected) return true;
      return selectedRelations.some((relation) => keyOf(relation.from) === node.key || keyOf(relation.to) === node.key);
    }
    return matchesSearch(node);
  };

  return <div className="network-shell">
    <div className="network-controls">
      <label>
        <span>搜索档案</span>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="人物、概念、地点…" />
      </label>
      <label>
        <span>关系类型</span>
        <select value={relationType} onChange={(event) => setRelationType(event.target.value as 'all' | RelationType)}>
          <option value="all">全部关系</option>
          {relationTypes.map((type) => <option value={type} key={type}>{RELATION_LABELS[type]}</option>)}
        </select>
      </label>
      <button type="button" className="button-ghost" onClick={() => { setSelected(null); setSearch(''); setRelationType('all'); }}>重置视图</button>
    </div>

    <div className="network-meta">
      <span>{nodes.length} 个节点 · {filteredRelations.length} 条可见关系</span>
      {gatedCount > 0 && <span className="network-lock-note">另有 {gatedCount} 条跨作品关系因当前游玩进度隐藏 · <a href="/progress">调整进度</a></span>}
    </div>

    <div className="network-scroll" aria-label="Lore Network 关系图">
      <div className="network-canvas">
        <svg className="network-edges" viewBox="0 0 1000 680" preserveAspectRatio="none" aria-hidden="true">
          {filteredRelations.map((relation) => {
            const from = nodeMap[keyOf(relation.from)];
            const to = nodeMap[keyOf(relation.to)];
            if (!from || !to) return null;
            return <line
              key={relation.id}
              x1={from.x * 10}
              y1={from.y * 6.8}
              x2={to.x * 10}
              y2={to.y * 6.8}
              className={edgeActive(relation) ? 'active' : 'dimmed'}
            />;
          })}
        </svg>
        {nodes.map((node) => (
          <button
            key={node.key}
            type="button"
            className={'network-node type-' + node.ref.type + (selected === node.key ? ' selected' : '') + (!nodeActive(node) ? ' dimmed' : '')}
            style={{ left: node.x + '%', top: node.y + '%' }}
            onClick={() => setSelected(selected === node.key ? null : node.key)}
            aria-pressed={selected === node.key}
          >
            <span>{TYPE_LABELS[node.ref.type]}</span>
            <b>{node.title}</b>
          </button>
        ))}
      </div>
    </div>

    <section className="network-inspector" aria-live="polite">
      {selectedNode ? <>
        <div className="network-inspector-head">
          <div><div className="kicker">{TYPE_LABELS[selectedNode.ref.type]} / CONNECTIONS</div><h2>{selectedNode.title}</h2></div>
          <div className="network-inspector-actions">
            {selectedNode.href && <a className="button" href={selectedNode.href}>打开档案</a>}
            <button className="button-ghost" type="button" onClick={() => setSelected(null)}>取消聚焦</button>
          </div>
        </div>
        <div className="connection-list">
          {selectedRelations.length > 0 ? selectedRelations.map((relation) => {
            const isFrom = keyOf(relation.from) === selectedNode.key;
            const other = isFrom ? relation.to : relation.from;
            const otherNode = nodeMap[keyOf(other)];
            return <article className="connection-card" key={relation.id}>
              <div className="connection-arrow">{isFrom ? '→' : '←'}</div>
              <div>
                <div className="kicker">{relation.claimKind} · {RELATION_LABELS[relation.type]}</div>
                <b>{otherNode?.title ?? titleFor(other, entityMap)}</b>
                <small>SOURCE · {relation.sourceIds.join(' · ')}</small>
              </div>
              <button type="button" onClick={() => setSelected(keyOf(other))}>聚焦</button>
            </article>;
          }) : <div className="empty-state">当前筛选条件下没有可见关系。</div>}
        </div>
      </> : <div className="network-empty-inspector"><div className="kicker">How to explore</div><p>点击任意节点查看它与作品、人物、概念、地点和事件之间的连接。关系只来自结构化 Relation 数据，不会根据视觉邻近自动推断。</p></div>}
    </section>
  </div>;
}
