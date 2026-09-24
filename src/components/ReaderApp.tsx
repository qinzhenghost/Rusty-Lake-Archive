import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { EntityRef, LocalizedRichText, RichToken, SpoilerRule, UserProgress } from '../content/schema';
import { canView } from '../content/spoiler';
import type { ArchiveEntity, ChapterData, EntityRecord, EventData, GameData, StoryBlockData } from '../lib/models';
import type { ArchiveLanguage } from '../lib/language';
import { useArchiveLanguage } from './useArchiveLanguage';

type Props = { game: GameData; chapter: ChapterData; chapters: ChapterData[]; entityMap: Record<string, EntityRecord> };
const PROGRESS_KEY = 'rla-progress-v1';
const REVEAL_KEY = 'rla-manual-reveals-v1';
const LAST_READ_KEY = 'rla-last-read-v1';

function loadProgress(): UserProgress {
  if (typeof window === 'undefined') return { completedGameIds: [], manualRevealIds: [] };
  try {
    const completed = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '[]');
    const reveals = JSON.parse(localStorage.getItem(REVEAL_KEY) ?? '[]');
    return { completedGameIds: Array.isArray(completed) ? completed : [], manualRevealIds: Array.isArray(reveals) ? reveals : [] };
  } catch { return { completedGameIds: [], manualRevealIds: [] }; }
}
function localize(value: { zhHans: string; en: string } | undefined, language: ArchiveLanguage): string {
  if (!value) return '';
  return value[language];
}
function refKey(ref: EntityRef): string { return ref.type + ':' + ref.id; }
function recordTitle(record: EntityRecord | undefined, language: ArchiveLanguage): string {
  if (!record || !('title' in record)) return language === 'en' ? 'Unknown File' : '未知档案';
  return record.title[language];
}
function recordHref(ref: EntityRef, record: EntityRecord | undefined): string | null {
  if (!record || !('slug' in record)) return null;
  if (ref.type === 'character') return '/characters/' + record.slug;
  if (ref.type === 'concept') return '/lore/' + record.slug;
  if (ref.type === 'location') return '/locations/' + record.slug;
  if (ref.type === 'game') return '/games/' + record.slug;
  return null;
}
function readerTheme(game: GameData, chapter: ChapterData): string {
  if (game.id === 'the-lake') return 'lake';
  if (game.id === 'arles') return 'arles';
  return chapter.timeline?.season ?? 'final';
}
function chapterTimeLabel(game: GameData, chapter: ChapterData, language: ArchiveLanguage): string {
  if (chapter.timeline) return String(chapter.timeline.year);
  if (game.id === 'seasons' && chapter.slug === 'final') return language === 'en' ? 'RETURN' : '回访';
  return language === 'en' ? 'UNDATED' : '未定年';
}
function chapterTimeDetail(game: GameData, chapter: ChapterData, language: ArchiveLanguage): string {
  if (chapter.timeline) return chapter.timeline.year + ' · ' + (chapter.timeline.season ?? chapter.timeline.precision);
  if (game.id === 'seasons' && chapter.slug === 'final') return language === 'en' ? 'Cross-season revisit / no new year' : '跨季节回访 / 无新年份';
  return language === 'en' ? 'No explicit in-universe year' : '未标注明确年份';
}
function claimLabel(kind: string, language: ArchiveLanguage): string {
  if (language === 'en') return kind;
  return kind === 'fact' ? '事实' : kind === 'interpretation' ? '解释' : kind === 'theory' ? '理论' : kind;
}
function requiredGameNames(rule: SpoilerRule, entityMap: Record<string, EntityRecord>, language: ArchiveLanguage): string {
  return rule.requiredCompletedGameIds.map((id) => {
    const record = entityMap['game:' + id];
    return record && record.kind === 'game' ? record.title[language] : id;
  }).join(' · ');
}

function RichText({ value, language, entityMap, onEntity }: { value: LocalizedRichText; language: ArchiveLanguage; entityMap: Record<string, EntityRecord>; onEntity: (ref: EntityRef) => void }) {
  return <>{value[language].map((token: RichToken, index: number) => {
    if (token.kind === 'text') return <span key={index}>{token.text}</span>;
    const record = entityMap[refKey(token.entity)];
    const label = record && 'title' in record ? record.title[language] : token.label;
    return <button key={index} type="button" className="entity-button" onClick={() => onEntity(token.entity)}>{label}</button>;
  })}</>;
}
function SpoilerGate({ id, rule, progress, entityMap, language, onReveal, children }: { id: string; rule: SpoilerRule; progress: UserProgress; entityMap: Record<string, EntityRecord>; language: ArchiveLanguage; onReveal: (id: string) => void; children: ReactNode }) {
  if (canView(rule, progress, id)) return <>{children}</>;
  const required = requiredGameNames(rule, entityMap, language);
  return <div className="spoiler-card">
    <div className="kicker">{language === 'en' ? 'Locked File' : '锁定档案'}</div>
    <div className="redact" />
    <p className="muted">{language === 'en' ? 'Complete first: ' : '该内容需要先完成：'}{required || (language === 'en' ? 'later archive content' : '后续档案')}</p>
    {rule.allowManualReveal && <button type="button" onClick={() => onReveal(id)}>{language === 'en' ? 'Reveal anyway' : '仍然查看'}</button>}
  </div>;
}
function StoryBlockView({ block, language, progress, entityMap, onEntity, onReveal }: { block: StoryBlockData; language: ArchiveLanguage; progress: UserProgress; entityMap: Record<string, EntityRecord>; onEntity: (ref: EntityRef) => void; onReveal: (id: string) => void }) {
  const rich = (value: LocalizedRichText) => <RichText value={value} language={language} entityMap={entityMap} onEntity={onEntity} />;
  const content = (() => {
    switch (block.type) {
      case 'scene': return <div className="scene-label">{language === 'en' ? 'Memory Record' : '记忆记录'}<strong>{localize(block.title, language)}</strong>{block.subtitle && <span>{localize(block.subtitle, language)}</span>}</div>;
      case 'paragraph': return <p>{rich(block.content)}</p>;
      case 'dialogue': return <div className="story-dialogue">{rich(block.content)}</div>;
      case 'image': return <figure className="story-image memory-plate"><div className="memory-plate-mark">{language === 'en' ? 'MEMORY / VISUAL PLACEHOLDER' : '记忆 / 视觉占位'}</div><div>{localize(block.asset.alt, language)}</div>{block.asset.caption && <figcaption>{localize(block.asset.caption, language)}</figcaption>}</figure>;
      case 'quote': return <blockquote className="inline-note">“{localize(block.content, language)}”<br /><small>{localize(block.attribution, language)}</small></blockquote>;
      case 'event': return <div className="story-event"><div className="kicker">{language === 'en' ? 'Timeline Event' : '时间线事件'}</div>{rich(block.summary)}</div>;
      case 'interaction': return <button type="button" className="button-ghost story-action" onClick={() => onEntity(block.target)}>{localize(block.label, language)} →</button>;
      case 'note': return <div className={'inline-note tone-' + block.tone}><b>{localize(block.title, language)}</b><br />{rich(block.content)}</div>;
    }
  })();
  return <SpoilerGate id={block.id} rule={block.spoiler} progress={progress} entityMap={entityMap} language={language} onReveal={onReveal}>{content}</SpoilerGate>;
}
function isArchiveEntity(record: EntityRecord): record is ArchiveEntity {
  return record.kind === 'character' || record.kind === 'concept' || record.kind === 'location';
}

export default function ReaderApp({ game, chapter, chapters, entityMap }: Props) {
  const [language] = useArchiveLanguage();
  const [progress, setProgress] = useState<UserProgress>({ completedGameIds: [], manualRevealIds: [] });
  const [drawerRef, setDrawerRef] = useState<EntityRef | null>(null);
  const [chapterSheet, setChapterSheet] = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  useEffect(() => {
    setProgress(loadProgress());
    localStorage.setItem(LAST_READ_KEY, JSON.stringify({
      href: window.location.pathname,
      gameTitle: game.title,
      chapterTitle: chapter.title,
      updatedAt: new Date().toISOString()
    }));
  }, [game.title, chapter.title]);

  useEffect(() => {
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setReadProgress(Math.min(100, Math.max(0, Math.round((window.scrollY / max) * 100))));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [chapter.id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setDrawerRef(null); setChapterSheet(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onReveal = (id: string) => {
    const ids = Array.from(new Set([...(progress.manualRevealIds ?? []), id]));
    setProgress({ ...progress, manualRevealIds: ids });
    localStorage.setItem(REVEAL_KEY, JSON.stringify(ids));
  };
  const entityRecord = drawerRef ? entityMap[refKey(drawerRef)] : undefined;
  const featured = useMemo(() => chapter.featuredRefs.map((ref) => ({ ref, record: entityMap[refKey(ref)] })).filter((item) => item.record), [chapter.featuredRefs, entityMap]);
  const openEntity = (ref: EntityRef) => setDrawerRef(ref);
  const caseGroups = {
    character: featured.filter((item) => item.ref.type === 'character'),
    location: featured.filter((item) => item.ref.type === 'location'),
    concept: featured.filter((item) => item.ref.type === 'concept'),
  };
  const chapterIndex = chapters.findIndex((item) => item.id === chapter.id);
  const previousChapter = chapterIndex > 0 ? chapters[chapterIndex - 1] : undefined;
  const nextChapter = chapterIndex >= 0 && chapterIndex < chapters.length - 1 ? chapters[chapterIndex + 1] : undefined;
  const fullHref = drawerRef && entityRecord ? recordHref(drawerRef, entityRecord) : null;
  const gameHeading = game.title[language] + (language === 'zhHans' && game.title.zhHans !== game.title.en ? ' · ' + game.title.en : '');

  return <div className={'reader-shell season-' + readerTheme(game, chapter)}>
    <div className="reading-progress-track" aria-hidden="true"><span style={{ width: readProgress + '%' }} /></div>
    <aside className="reader-left">
      <div className="panel-title">{language === 'en' ? 'CHAPTERS' : '章节'}</div>
      <nav className="chapter-nav">
        {chapters.map((item) => <a key={item.id} className={item.id === chapter.id ? 'active' : ''} href={'/read/' + game.slug + '/' + item.slug}><span>{item.title[language]}</span><small>{item.storyBlocks.length >= 5 ? (language === 'en' ? 'Full summary' : '完整摘要') : (language === 'en' ? 'Brief record' : '简要记录')}</small></a>)}
      </nav>
      <div className="panel-title">{language === 'en' ? 'READING MODE' : '阅读模式'}</div>
      <div className="case-block"><small className="muted">{language === 'en' ? 'Story-first, walkthrough steps hidden. Select entity terms to open their files. Site language is controlled from the top navigation.' : '剧情优先，隐藏攻略步骤；实体词可点击展开档案。全站语言由顶部按钮统一切换。'}</small></div>
    </aside>

    <article className="reader-main">
      <header className="reader-head">
        <div className="kicker">{gameHeading} · {chapterTimeLabel(game, chapter, language)}</div>
        <h1>{chapter.title[language]}</h1>
        <div className="reader-tools">
          <span className="muted">{language === 'en' ? 'Chapter' : '章节'} {String(chapter.narrativeOrder).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')} · {language === 'en' ? 'Read' : '阅读'} {readProgress}%</span>
          <span className="muted reader-language-hint">{language === 'en' ? 'Language: English · switch at top' : '语言：中文 · 顶部可切换'}</span>
        </div>
      </header>
      <div className="story">
        {chapter.storyBlocks.map((block) => <StoryBlockView key={block.id} block={block} language={language} progress={progress} entityMap={entityMap} onEntity={openEntity} onReveal={onReveal} />)}
        <nav className="reader-pager" aria-label={language === 'en' ? 'Chapter navigation' : '章节翻页'}>
          {previousChapter ? <a href={'/read/' + game.slug + '/' + previousChapter.slug}><span>← {language === 'en' ? 'Previous chapter' : '上一章'}</span><b>{previousChapter.title[language]}</b></a> : <span />}
          {nextChapter ? <a className="next" href={'/read/' + game.slug + '/' + nextChapter.slug}><span>{language === 'en' ? 'Next chapter' : '下一章'} →</span><b>{nextChapter.title[language]}</b></a> : <a className="next" href={'/games/' + game.slug}><span>{language === 'en' ? 'Reading complete' : '阅读完成'}</span><b>{language === 'en' ? 'Return to game file' : '返回作品档案'}</b></a>}
        </nav>
      </div>
    </article>

    <aside className="reader-right">
      <div className="panel-title">{language === 'en' ? 'CASE NOTES' : '案件笔记'}</div>
      <div className="case-block">
        {(['character','location','concept'] as const).map((type) => caseGroups[type].length > 0 && <div className="case-item" key={type}><b>{type === 'character' ? (language === 'en' ? 'Characters' : '当前人物') : type === 'location' ? (language === 'en' ? 'Locations' : '当前地点') : (language === 'en' ? 'Key concepts' : '关键概念')}</b>{caseGroups[type].map(({ ref, record }) => <button key={refKey(ref)} type="button" onClick={() => openEntity(ref)}>{recordTitle(record, language)}<br /></button>)}</div>)}
        <div className="case-item"><b>{language === 'en' ? 'Time' : '相关时间'}</b><span className="muted">{chapterTimeDetail(game, chapter, language)}</span></div>
      </div>
      <div className="spoiler-card"><div className="kicker">{language === 'en' ? 'Spoiler Control' : '防剧透控制'}</div><p className="muted">{language === 'en' ? 'Cross-game files are hidden according to your play progress. Entries you reveal manually are recorded separately.' : '跨作品档案会根据“我的游玩进度”遮蔽。你主动展开过的条目会单独记录。'}</p><a className="button-ghost" href="/progress">{language === 'en' ? 'Change play progress' : '修改游玩进度'}</a></div>
    </aside>

    <div className="mobile-tabs">
      <button type="button" onClick={() => setChapterSheet(true)}>{language === 'en' ? 'Chapters' : '章节'}</button>
      <button type="button" onClick={() => setDrawerRef(chapter.featuredRefs[0] ?? null)}>{language === 'en' ? 'Files' : '档案'}</button>
      <a href="/timeline">{language === 'en' ? 'Timeline' : '时间线'}</a>
    </div>

    {chapterSheet && <><button className="sheet-backdrop" aria-label={language === 'en' ? 'Close chapter list' : '关闭章节列表'} type="button" onClick={() => setChapterSheet(false)} /><div className="chapter-sheet"><div className="chapter-sheet-head"><b>{language === 'en' ? 'CHAPTERS' : '章节'}</b><button type="button" onClick={() => setChapterSheet(false)}>×</button></div><nav className="chapter-nav">{chapters.map((item) => <a key={item.id} className={item.id === chapter.id ? 'active' : ''} href={'/read/' + game.slug + '/' + item.slug}>{item.title[language]}<small>{item.storyBlocks.length >= 5 ? (language === 'en' ? 'Full summary' : '完整摘要') : (language === 'en' ? 'Brief record' : '简要记录')}</small></a>)}</nav></div></>}

    {entityRecord && drawerRef && <>
      <button aria-label={language === 'en' ? 'Close file' : '关闭档案'} className="drawer-backdrop" type="button" onClick={() => setDrawerRef(null)} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={recordTitle(entityRecord, language)}>
        <button className="drawer-close" type="button" onClick={() => setDrawerRef(null)} aria-label={language === 'en' ? 'Close' : '关闭'}>×</button>
        <div className="kicker">{language === 'en' ? drawerRef.type.toUpperCase() + ' FILE' : drawerRef.type === 'character' ? '人物档案' : drawerRef.type === 'concept' ? '概念档案' : drawerRef.type === 'location' ? '地点档案' : '档案'}</div>
        <h2>{recordTitle(entityRecord, language)}</h2>
        {language === 'zhHans' && 'title' in entityRecord && entityRecord.title.zhHans !== entityRecord.title.en && <small className="localized-original react-original">{entityRecord.title.en}</small>}
        {'summary' in entityRecord && <p>{localize(entityRecord.summary, language)}</p>}
        {fullHref && <a className="drawer-full-link" href={fullHref}>{language === 'en' ? 'Open full file' : '打开完整档案'} →</a>}
        {isArchiveEntity(entityRecord) && entityRecord.entries.map((entry) => <SpoilerGate key={entry.id} id={entry.id} rule={entry.spoiler} progress={progress} entityMap={entityMap} language={language} onReveal={onReveal}><div className="drawer-entry"><div className="claim">{claimLabel(entry.claimKind, language)}</div><p><RichText value={entry.content} language={language} entityMap={entityMap} onEntity={openEntity} /></p><small className="source-line">{language === 'en' ? 'SOURCE' : '来源'} · {entry.provenance?.sourceIds.join(' · ') ?? entityRecord.sourceIds.join(' · ')}</small></div></SpoilerGate>)}
        {entityRecord.kind === 'event' && <div className="drawer-entry"><div className="claim">{language === 'en' ? 'timeline' : '时间线'}</div><p>{(entityRecord as EventData).timeline.year} · {(entityRecord as EventData).timeline.season ?? ''}</p></div>}
        <p className="drawer-hint">{language === 'en' ? 'Press Esc to close' : '按 Esc 可关闭档案'}</p>
      </aside>
    </>}
  </div>;
}
