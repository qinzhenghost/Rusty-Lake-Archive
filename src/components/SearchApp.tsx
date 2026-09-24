import { useEffect, useMemo, useRef, useState } from 'react';
import type { UserProgress } from '../content/schema';
import { canView } from '../content/spoiler';
import type { SearchDocument, SearchKind } from '../lib/models';
import { useArchiveLanguage } from './useArchiveLanguage';

type Props = { documents: SearchDocument[] };
const PROGRESS_KEY = 'rla-progress-v1';
const REVEAL_KEY = 'rla-manual-reveals-v1';
const KIND_LABELS: Record<SearchKind, { zhHans: string; en: string }> = {
  game:{zhHans:'作品',en:'Game'}, chapter:{zhHans:'章节',en:'Chapter'}, story:{zhHans:'剧情正文',en:'Story text'},
  character:{zhHans:'人物',en:'Character'}, concept:{zhHans:'概念',en:'Concept'}, location:{zhHans:'地点',en:'Location'},
  event:{zhHans:'事件',en:'Event'}, entry:{zhHans:'档案条目',en:'Dossier entry'}, relation:{zhHans:'关系',en:'Relation'},
};
function loadProgress(): UserProgress {
  if (typeof window === 'undefined') return { completedGameIds: [], manualRevealIds: [] };
  try {
    const completed = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '[]');
    const reveals = JSON.parse(localStorage.getItem(REVEAL_KEY) ?? '[]');
    return { completedGameIds: Array.isArray(completed) ? completed : [], manualRevealIds: Array.isArray(reveals) ? reveals : [] };
  } catch { return { completedGameIds: [], manualRevealIds: [] }; }
}
function normalize(value: string): string { return value.trim().toLocaleLowerCase().replace(/\s+/g, ' '); }
function scoreDocument(document: SearchDocument, query: string): number {
  const normalized = normalize(query);
  if (!normalized) return 0;
  const terms = normalized.split(' ').filter(Boolean);
  const title = normalize(document.title.zhHans + ' ' + document.title.en);
  const body = normalize(document.searchText.zhHans + ' ' + document.searchText.en);
  if (!terms.every((term) => body.includes(term))) return -1;
  let score = 0;
  for (const term of terms) {
    if (title === term) score += 120;
    else if (title.startsWith(term)) score += 90;
    else if (title.includes(term)) score += 65;
    else score += 20;
  }
  if (document.kind === 'game' || document.kind === 'character' || document.kind === 'concept' || document.kind === 'location') score += 8;
  if (document.kind === 'chapter') score += 5;
  return score;
}

export default function SearchApp({ documents }: Props) {
  const [language] = useArchiveLanguage();
  const [progress, setProgress] = useState<UserProgress>({ completedGameIds: [], manualRevealIds: [] });
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | SearchKind>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProgress(loadProgress());
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('q') ?? '';
    const initialKind = params.get('kind') as SearchKind | null;
    setQuery(initialQuery);
    if (initialKind && initialKind in KIND_LABELS) setKind(initialKind);
    const onStorage = () => setProgress(loadProgress());
    const onKey = (event: KeyboardEvent) => {
      if (event.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        event.preventDefault(); inputRef.current?.focus();
      }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('keydown', onKey); };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (query.trim()) params.set('q', query.trim()); else params.delete('q');
    if (kind !== 'all') params.set('kind', kind); else params.delete('kind');
    const next = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (next ? '?' + next : ''));
  }, [query, kind]);

  const visibleDocuments = useMemo(() => documents.filter((item) => canView(item.spoiler, progress, item.contentId)), [documents, progress]);
  const results = useMemo(() => {
    if (!query.trim()) return [];
    return visibleDocuments.filter((item) => kind === 'all' || item.kind === kind)
      .map((item) => ({ item, score: scoreDocument(item, query) }))
      .filter((result) => result.score >= 0)
      .sort((a, b) => b.score - a.score || a.item.title[language].localeCompare(b.item.title[language], language === 'en' ? 'en' : 'zh-CN'))
      .slice(0, 60);
  }, [visibleDocuments, query, kind, language]);

  const kindCounts = useMemo(() => {
    const counts = new Map<SearchKind, number>();
    for (const item of visibleDocuments) counts.set(item.kind, (counts.get(item.kind) ?? 0) + 1);
    return counts;
  }, [visibleDocuments]);

  const hiddenCount = documents.length - visibleDocuments.length;
  const examples = language === 'en' ? ['Laura', 'Black Cube', '1971', 'Rusty Lake'] : ['劳拉', '黑色方块', '1971', '锈湖'];

  return <div className="search-shell">
    <div className="search-box">
      <label htmlFor="archive-search">{language === 'en' ? 'Search the entire archive' : '搜索整个档案馆'}</label>
      <div className="search-input-row">
        <input ref={inputRef} id="archive-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)}
          placeholder={language === 'en' ? 'Characters, games, concepts, years, story keywords…' : '人物、作品、概念、年份、剧情关键词…'} autoComplete="off" />
        {query && <button type="button" onClick={() => setQuery('')}>{language === 'en' ? 'Clear' : '清空'}</button>}
      </div>
      <div className="search-hint">{language === 'en' ? 'Chinese / English · Separate multiple keywords with spaces · Press / on desktop to focus search' : '支持中文 / English · 多关键词使用空格 · 桌面端按 / 聚焦搜索框'}</div>
    </div>

    <div className="search-toolbar">
      <label>
        <span>{language === 'en' ? 'Result type' : '结果类型'}</span>
        <select value={kind} onChange={(event) => setKind(event.target.value as 'all' | SearchKind)}>
          <option value="all">{language === 'en' ? 'All visible content' : '全部可见内容'} ({visibleDocuments.length})</option>
          {(Object.keys(KIND_LABELS) as SearchKind[]).filter((item) => (kindCounts.get(item) ?? 0) > 0).map((item) => (
            <option value={item} key={item}>{KIND_LABELS[item][language]} ({kindCounts.get(item)})</option>
          ))}
        </select>
      </label>
      <div className="search-spoiler-state">
        <span className="badge">{language === 'en' ? 'SPOILER SAFE' : '防剧透'}</span>
        <span>{hiddenCount > 0 ? (language === 'en' ? hiddenCount + ' indexed item(s) hidden by current progress' : '当前进度隐藏 ' + hiddenCount + ' 条索引内容') : (language === 'en' ? 'No indexed content is locked by progress' : '当前索引无进度锁定内容')}</span>
        <a href="/progress">{language === 'en' ? 'Adjust progress' : '调整进度'}</a>
      </div>
    </div>

    {!query.trim() ? <div className="search-start">
      <div className="kicker">{language === 'en' ? 'Try searching' : '试试搜索'}</div>
      <h2>{language === 'en' ? 'Start from any clue' : '从任何线索开始'}</h2>
      <p>{language === 'en' ? 'Search games, story text, characters, concepts, locations, events, dossier entries, and structured relations. Locked spoiler content is removed before keyword matching.' : '搜索会同时查作品、剧情正文、人物、概念、地点、事件、档案条目和结构化关系。被防剧透规则锁定的内容先被排除，再进行关键词匹配。'}</p>
      <div className="search-examples">{examples.map((example) => <button type="button" key={example} onClick={() => setQuery(example)}>{example}</button>)}</div>
    </div> : <div className="search-results">
      <div className="search-result-count">{language === 'en' ? results.length + ' visible result(s)' : results.length + ' 条可见结果'}</div>
      {results.length > 0 ? results.map(({ item }) => (
        <article className="search-result" key={item.id}>
          <div className="search-result-main">
            <div className="search-result-meta">
              <span className="badge">{KIND_LABELS[item.kind][language]}</span>
              <span>{item.sourceIds.length > 0 ? (language === 'en' ? 'SOURCE' : '来源') + ' · ' + item.sourceIds.join(' · ') : (language === 'en' ? 'ARCHIVE' : '档案')}</span>
            </div>
            <h2><a href={item.route}>{item.title[language]}</a>{language === 'zhHans' && item.title.zhHans !== item.title.en && <small className="localized-original react-original">{item.title.en}</small>}</h2>
            <p>{item.excerpt[language]}</p>
          </div>
          <div className="search-result-actions">
            <a className="button" href={item.route}>{item.kind === 'story' || item.kind === 'chapter' ? (language === 'en' ? 'Read chapter' : '阅读章节') : (language === 'en' ? 'Open file' : '打开档案')}</a>
            {item.networkFocus && <a className="button-ghost" href={'/network?focus=' + encodeURIComponent(item.networkFocus)}>{language === 'en' ? 'Locate in network' : '关系网定位'}</a>}
          </div>
          {item.readerLinks.length > 0 && <div className="search-reader-links">
            <span>{language === 'en' ? 'View in story' : '剧情中查看'}</span>
            {item.readerLinks.map((link) => <a href={link.route} key={link.route}>{link.title[language]} →</a>)}
          </div>}
        </article>
      )) : <div className="empty-state">{language === 'en' ? 'No visible results match the current play progress and filters. Try another keyword, change the result type, or adjust spoiler progress.' : '当前游玩进度与筛选条件下没有可见结果。可以换一个关键词、切换结果类型，或到“我的游玩进度”调整防剧透范围。'}</div>}
    </div>}
  </div>;
}
