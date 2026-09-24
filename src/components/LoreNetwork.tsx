import { useEffect, useMemo, useState } from 'react';
import type { EntityRef, UserProgress } from '../content/schema';
import { canView } from '../content/spoiler';
import type { EntityRecord, RelationData, RelationType } from '../lib/models';
import { useArchiveLanguage } from './useArchiveLanguage';

type Props = { relations: RelationData[]; entityMap: Record<string, EntityRecord> };
type NodeView = { key: string; ref: EntityRef; title: string; x: number; y: number; href: string | null };
const PROGRESS_KEY = 'rla-progress-v1';
const REVEAL_KEY = 'rla-manual-reveals-v1';
const RELATION_LABELS: Record<RelationType, { zhHans: string; en: string }> = {
  appears_in:{zhHans:'出现于',en:'appears in'}, companion_of:{zhHans:'同伴',en:'companion of'}, located_at:{zhHans:'位于',en:'located at'},
  involves:{zhHans:'涉及',en:'involves'}, associated_with:{zhHans:'关联',en:'associated with'}, precedes:{zhHans:'早于',en:'precedes'},
  follows:{zhHans:'晚于',en:'follows'}, references:{zhHans:'引用',en:'references'}, part_of:{zhHans:'属于',en:'part of'},
};
const TYPE_LABELS: Record<EntityRef['type'], { zhHans: string; en: string }> = {
  game:{zhHans:'作品',en:'Game'}, chapter:{zhHans:'章节',en:'Chapter'}, character:{zhHans:'人物',en:'Character'},
  concept:{zhHans:'概念',en:'Concept'}, location:{zhHans:'地点',en:'Location'}, event:{zhHans:'事件',en:'Event'},
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
function makePositions(refs: EntityRef[], entityMap: Record<string, EntityRecord>, language: 'zhHans' | 'en'): NodeView[] {
  const rows: EntityRef['type'][] = ['event','character','game','concept','location','chapter'];
  const yByType: Record<EntityRef['type'], number> = { event:13, character:33, game:51, concept:70, location:88, chapter:96 };
  const titleFor = (ref: EntityRef) => {
    const record = entityMap[keyOf(ref)];
    return record && 'title' in record ? record.title[language] : ref.id;
  };
  const output: NodeView[] = [];
  for (const type of rows) {
    const group = refs.filter((ref) => ref.type === type).sort((a,b) => titleFor(a).localeCompare(titleFor(b), language === 'en' ? 'en' : 'zh-CN'));
    group.forEach((ref,index) => {
      const span=group.length===1?0:76;
      output.push({ key:keyOf(ref), ref, title:titleFor(ref), x:group.length===1?50:12+(span*index)/(group.length-1), y:yByType[type], href:hrefFor(ref,entityMap) });
    });
  }
  return output;
}

export default function LoreNetwork({ relations, entityMap }: Props) {
  const [language] = useArchiveLanguage();
  const [progress, setProgress] = useState<UserProgress>({ completedGameIds: [], manualRevealIds: [] });
  const [selected, setSelected] = useState<string | null>(null);
  const [relationType, setRelationType] = useState<'all' | RelationType>('all');
  const [search, setSearch] = useState('');
  useEffect(() => {
    setProgress(loadProgress());
    const focus = new URLSearchParams(window.location.search).get('focus');
    if (focus) setSelected(focus);
  }, []);
  const unlocked=useMemo(()=>relations.filter((relation)=>canView(relation.spoiler,progress,relation.id)),[relations,progress]);
  const filteredRelations=useMemo(()=>relationType==='all'?unlocked:unlocked.filter((relation)=>relation.type===relationType),[unlocked,relationType]);
  const refs=useMemo(()=>{const map=new Map<string,EntityRef>(); for(const relation of filteredRelations){map.set(keyOf(relation.from),relation.from);map.set(keyOf(relation.to),relation.to);} return [...map.values()];},[filteredRelations]);
  const nodes=useMemo(()=>makePositions(refs,entityMap,language),[refs,entityMap,language]);
  const nodeMap=useMemo(()=>Object.fromEntries(nodes.map((node)=>[node.key,node])),[nodes]);
  const gatedCount=relations.length-unlocked.length;
  const relationTypes=useMemo(()=>[...new Set(unlocked.map((relation)=>relation.type))].sort(),[unlocked]);
  const selectedRelations=selected?filteredRelations.filter((relation)=>keyOf(relation.from)===selected||keyOf(relation.to)===selected):[];
  const selectedNode=selected?nodeMap[selected]:undefined;
  const normalizedSearch=search.trim().toLocaleLowerCase();
  const matchesSearch=(node:NodeView)=>{
    if(!normalizedSearch) return true;
    const record=entityMap[node.key];
    const allTitles=record&&'title' in record?(record.title.zhHans+' '+record.title.en).toLocaleLowerCase():node.title.toLocaleLowerCase();
    return allTitles.includes(normalizedSearch)||node.ref.id.includes(normalizedSearch);
  };
  const edgeActive=(relation:RelationData)=>!selected||keyOf(relation.from)===selected||keyOf(relation.to)===selected;
  const nodeActive=(node:NodeView)=>selected?(node.key===selected||selectedRelations.some((relation)=>keyOf(relation.from)===node.key||keyOf(relation.to)===node.key)):matchesSearch(node);
  const titleFor=(ref:EntityRef)=>{const record=entityMap[keyOf(ref)]; return record&&'title' in record?record.title[language]:ref.id;};

  return <div className="network-shell">
    <div className="network-controls">
      <label><span>{language==='en'?'Search files':'搜索档案'}</span><input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder={language==='en'?'Characters, concepts, locations…':'人物、概念、地点…'} /></label>
      <label><span>{language==='en'?'Relation type':'关系类型'}</span><select value={relationType} onChange={(event)=>setRelationType(event.target.value as 'all'|RelationType)}><option value="all">{language==='en'?'All relations':'全部关系'}</option>{relationTypes.map((type)=><option value={type} key={type}>{RELATION_LABELS[type][language]}</option>)}</select></label>
      <button type="button" className="button-ghost" onClick={()=>{setSelected(null);setSearch('');setRelationType('all');}}>{language==='en'?'Reset view':'重置视图'}</button>
    </div>
    <div className="network-meta">
      <span>{language==='en'?nodes.length+' nodes · '+filteredRelations.length+' visible relations':nodes.length+' 个节点 · '+filteredRelations.length+' 条可见关系'}</span>
      {gatedCount>0&&<span className="network-lock-note">{language==='en'?gatedCount+' cross-game relation(s) hidden by play progress · ':'另有 '+gatedCount+' 条跨作品关系因当前游玩进度隐藏 · '}<a href="/progress">{language==='en'?'Adjust progress':'调整进度'}</a></span>}
    </div>
    <div className="network-scroll" aria-label={language==='en'?'Lore Network graph':'世界观关系图'}>
      <div className="network-canvas">
        <svg className="network-edges" viewBox="0 0 1000 680" preserveAspectRatio="none" aria-hidden="true">{filteredRelations.map((relation)=>{const from=nodeMap[keyOf(relation.from)],to=nodeMap[keyOf(relation.to)];if(!from||!to)return null;return <line key={relation.id} x1={from.x*10} y1={from.y*6.8} x2={to.x*10} y2={to.y*6.8} className={edgeActive(relation)?'active':'dimmed'} />;})}</svg>
        {nodes.map((node)=><button key={node.key} type="button" className={'network-node type-'+node.ref.type+(selected===node.key?' selected':'')+(!nodeActive(node)?' dimmed':'')} style={{left:node.x+'%',top:node.y+'%'}} onClick={()=>setSelected(selected===node.key?null:node.key)} aria-pressed={selected===node.key}><span>{TYPE_LABELS[node.ref.type][language]}</span><b>{node.title}</b></button>)}
      </div>
    </div>
    <section className="network-inspector" aria-live="polite">
      {selectedNode?<><div className="network-inspector-head"><div><div className="kicker">{TYPE_LABELS[selectedNode.ref.type][language]} / {language==='en'?'CONNECTIONS':'关联'}</div><h2>{selectedNode.title}</h2></div><div className="network-inspector-actions">{selectedNode.href&&<a className="button" href={selectedNode.href}>{language==='en'?'Open file':'打开档案'}</a>}<button className="button-ghost" type="button" onClick={()=>setSelected(null)}>{language==='en'?'Clear focus':'取消聚焦'}</button></div></div>
      <div className="connection-list">{selectedRelations.length>0?selectedRelations.map((relation)=>{const isFrom=keyOf(relation.from)===selectedNode.key;const other=isFrom?relation.to:relation.from;const otherNode=nodeMap[keyOf(other)];return <article className="connection-card" key={relation.id}><div className="connection-arrow">{isFrom?'→':'←'}</div><div><div className="kicker">{claimLabel(relation.claimKind, language)} · {RELATION_LABELS[relation.type][language]}</div><b>{otherNode?.title??titleFor(other)}</b><small>{language==='en'?'SOURCE':'来源'} · {relation.sourceIds.join(' · ')}</small></div><button type="button" onClick={()=>setSelected(keyOf(other))}>{language==='en'?'Focus':'聚焦'}</button></article>;})
      :<div className="empty-state">{language==='en'?'No visible relations under the current filters.':'当前筛选条件下没有可见关系。'}</div>}</div></>
      :<div className="network-empty-inspector"><div className="kicker">{language==='en'?'How to explore':'如何探索'}</div><p>{language==='en'?'Select any node to inspect its connections with games, characters, concepts, locations, and events. Every edge comes from structured Relation data; visual proximity never implies a relationship.':'点击任意节点查看它与作品、人物、概念、地点和事件之间的连接。关系只来自结构化 Relation 数据，不会根据视觉邻近自动推断。'}</p></div>}
    </section>
  </div>;
}
