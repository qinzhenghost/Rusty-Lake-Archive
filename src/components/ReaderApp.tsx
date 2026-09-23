import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { EntityRef, Locale, LocalizedRichText, RichToken, SpoilerRule, UserProgress } from '../content/schema';
import { canView } from '../content/spoiler';
import type { ArchiveEntity, ChapterData, EntityRecord, EventData, GameData, StoryBlockData } from '../lib/models';

type LanguageMode = 'zhHans' | 'en' | 'bi';

type Props = {
  game: GameData;
  chapter: ChapterData;
  chapters: ChapterData[];
  entityMap: Record<string, EntityRecord>;
};

const PROGRESS_KEY = 'rla-progress-v1';
const REVEAL_KEY = 'rla-manual-reveals-v1';

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

function localize(value: { zhHans: string; en: string } | undefined, mode: LanguageMode): string {
  if (!value) return '';
  return mode === 'en' ? value.en : value.zhHans;
}

function refKey(ref: EntityRef): string { return `${ref.type}:${ref.id}`; }

function recordTitle(record: EntityRecord | undefined, mode: LanguageMode): string {
  if (!record || !('title' in record)) return 'Unknown File';
  return localize(record.title, mode);
}

function RichText({ value, locale, onEntity }: { value: LocalizedRichText; locale: Locale; onEntity: (ref: EntityRef) => void }) {
  return <>{value[locale].map((token: RichToken, index: number) => token.kind === 'text'
    ? <span key={index}>{token.text}</span>
    : <button key={index} type="button" className="entity-button" onClick={() => onEntity(token.entity)}>{token.label}</button>)}</>;
}

function BilingualRichText({ value, mode, onEntity }: { value: LocalizedRichText; mode: LanguageMode; onEntity: (ref: EntityRef) => void }) {
  if (mode === 'bi') return <><RichText value={value} locale="zhHans" onEntity={onEntity} /><br /><span className="muted"><RichText value={value} locale="en" onEntity={onEntity} /></span></>;
  return <RichText value={value} locale={mode} onEntity={onEntity} />;
}

function SpoilerGate({ id, rule, progress, onReveal, children }: { id: string; rule: SpoilerRule; progress: UserProgress; onReveal: (id: string) => void; children: ReactNode }) {
  if (canView(rule, progress, id)) return <>{children}</>;
  return <div className="spoiler-card"><div className="kicker">Locked File</div><div className="redact" /><p className="muted">该内容需要先完成：{rule.requiredCompletedGameIds.join(' · ') || '后续档案'}</p>{rule.allowManualReveal && <button type="button" onClick={() => onReveal(id)}>仍然查看</button>}</div>;
}

function StoryBlockView({ block, mode, progress, onEntity, onReveal }: { block: StoryBlockData; mode: LanguageMode; progress: UserProgress; onEntity: (ref: EntityRef) => void; onReveal: (id: string) => void }) {
  const content = (() => {
    switch (block.type) {
      case 'scene': return <div className="scene-label">Scene<strong>{localize(block.title, mode)}</strong>{block.subtitle && <span>{localize(block.subtitle, mode)}</span>}</div>;
      case 'paragraph': return <p><BilingualRichText value={block.content} mode={mode} onEntity={onEntity} /></p>;
      case 'dialogue': return <div className="story-dialogue"><BilingualRichText value={block.content} mode={mode} onEntity={onEntity} /></div>;
      case 'image': return <figure className="story-image"><div>{localize(block.asset.alt, mode)}</div>{block.asset.caption && <figcaption>{localize(block.asset.caption, mode)}</figcaption>}</figure>;
      case 'quote': return <blockquote className="inline-note">“{localize(block.content, mode)}”<br /><small>{localize(block.attribution, mode)}</small></blockquote>;
      case 'event': return <div className="story-event"><div className="kicker">Timeline Event</div><BilingualRichText value={block.summary} mode={mode} onEntity={onEntity} /></div>;
      case 'interaction': return <button type="button" className="button-ghost" onClick={() => onEntity(block.target)}>{localize(block.label, mode)}</button>;
      case 'note': return <div className="inline-note"><b>{localize(block.title, mode)}</b><br /><BilingualRichText value={block.content} mode={mode} onEntity={onEntity} /></div>;
    }
  })();
  return <SpoilerGate id={block.id} rule={block.spoiler} progress={progress} onReveal={onReveal}>{content}</SpoilerGate>;
}

function isArchiveEntity(record: EntityRecord): record is ArchiveEntity {
  return record.kind === 'character' || record.kind === 'concept' || record.kind === 'location';
}

export default function ReaderApp({ game, chapter, chapters, entityMap }: Props) {
  const [mode, setMode] = useState<LanguageMode>('zhHans');
  const [progress, setProgress] = useState<UserProgress>({ completedGameIds: [], manualRevealIds: [] });
  const [drawerRef, setDrawerRef] = useState<EntityRef | null>(null);
  const [chapterSheet, setChapterSheet] = useState(false);

  useEffect(() => { setProgress(loadProgress()); }, []);

  const onReveal = (id: string) => {
    const ids = Array.from(new Set([...(progress.manualRevealIds ?? []), id]));
    const next = { ...progress, manualRevealIds: ids };
    setProgress(next);
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

  return <div className="reader-shell">
    <aside className="reader-left">
      <div className="panel-title">CHAPTER</div>
      <nav className="chapter-nav">
        {chapters.map((item) => <a key={item.id} className={item.id === chapter.id ? 'active' : ''} href={`/read/${game.slug}/${item.slug}`}>{item.title.zhHans}<small>{item.storyBlocks.length > 1 ? '已录入' : '占位'}</small></a>)}
      </nav>
      <div className="panel-title">CONTENT POLICY</div>
      <div className="case-block"><small className="muted">正文为项目原创摘要与结构样例，不复制完整游戏对白或谜题攻略。</small></div>
    </aside>

    <article className="reader-main">
      <header className="reader-head">
        <div className="kicker">{game.title.zhHans}</div>
        <h1>{localize(chapter.title, mode)}</h1>
        <div className="reader-tools">
          <span className="muted">Chapter {String(chapter.narrativeOrder).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')}</span>
          <div className="lang-toggle" aria-label="语言模式">
            <button className={mode === 'zhHans' ? 'active' : ''} type="button" onClick={() => setMode('zhHans')}>中文</button>
            <button className={mode === 'en' ? 'active' : ''} type="button" onClick={() => setMode('en')}>EN</button>
            <button className={mode === 'bi' ? 'active' : ''} type="button" onClick={() => setMode('bi')}>中英</button>
          </div>
        </div>
      </header>
      <div className="story">
        {chapter.storyBlocks.map((block) => <StoryBlockView key={block.id} block={block} mode={mode} progress={progress} onEntity={openEntity} onReveal={onReveal} />)}
      </div>
    </article>

    <aside className="reader-right">
      <div className="panel-title">CASE NOTES</div>
      <div className="case-block">
        {(['character','location','concept'] as const).map((type) => caseGroups[type].length > 0 && <div className="case-item" key={type}><b>{type === 'character' ? '当前人物' : type === 'location' ? '当前地点' : '当前概念'}</b>{caseGroups[type].map(({ ref, record }) => <button key={refKey(ref)} type="button" onClick={() => openEntity(ref)}>{recordTitle(record, mode)}<br /></button>)}</div>)}
        <div className="case-item"><b>相关时间</b><span className="muted">{chapter.timeline ? `${chapter.timeline.year} · ${chapter.timeline.season ?? chapter.timeline.precision}` : '无固定时间节点'}</span></div>
      </div>
      <div className="spoiler-card"><div className="kicker">Spoiler Control</div><p className="muted">人物档案里的跨作品条目会根据“我的游玩进度”自动遮蔽，并允许你主动展开。</p><a className="button-ghost" href="/progress">修改游玩进度</a></div>
    </aside>

    <div className="mobile-tabs">
      <button type="button" onClick={() => setChapterSheet(true)}>章节</button>
      <button type="button" onClick={() => setDrawerRef(chapter.featuredRefs[0] ?? null)}>档案</button>
      <a href="/timeline">时间线</a>
    </div>

    {chapterSheet && <div className="chapter-sheet"><div className="chapter-sheet-head"><b>CHAPTER</b><button type="button" onClick={() => setChapterSheet(false)}>×</button></div><nav className="chapter-nav">{chapters.map((item) => <a key={item.id} className={item.id === chapter.id ? 'active' : ''} href={`/read/${game.slug}/${item.slug}`}>{item.title.zhHans}<small>{item.storyBlocks.length > 1 ? '已录入' : '占位'}</small></a>)}</nav></div>}

    {entityRecord && drawerRef && <>
      <button aria-label="关闭档案" className="drawer-backdrop" type="button" onClick={() => setDrawerRef(null)} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={recordTitle(entityRecord, mode)}>
        <button className="drawer-close" type="button" onClick={() => setDrawerRef(null)} aria-label="关闭">×</button>
        <div className="kicker">{drawerRef.type.toUpperCase()} FILE</div>
        <h2>{recordTitle(entityRecord, mode)}</h2>
        {'summary' in entityRecord && <p>{localize(entityRecord.summary, mode)}</p>}
        {isArchiveEntity(entityRecord) && entityRecord.entries.map((entry) => <SpoilerGate key={entry.id} id={entry.id} rule={entry.spoiler} progress={progress} onReveal={onReveal}><div className="drawer-entry"><div className="claim">{entry.claimKind}</div><p><BilingualRichText value={entry.content} mode={mode} onEntity={openEntity} /></p></div></SpoilerGate>)}
        {entityRecord.kind === 'event' && <div className="drawer-entry"><div className="claim">timeline</div><p>{(entityRecord as EventData).timeline.year} · {(entityRecord as EventData).timeline.season ?? ''}</p></div>}
      </aside>
    </>}
  </div>;
}
