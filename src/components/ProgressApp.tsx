import { useEffect, useState } from 'react';
import type { GameData } from '../lib/models';
import { useArchiveLanguage } from './useArchiveLanguage';

const KEY = 'rla-progress-v1';
const REVEAL_KEY = 'rla-manual-reveals-v1';

export default function ProgressApp({ games }: { games: GameData[] }) {
  const [language] = useArchiveLanguage();
  const [completed, setCompleted] = useState<string[]>([]);
  const [reveals, setReveals] = useState(0);
  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]');
      const revealed = JSON.parse(localStorage.getItem(REVEAL_KEY) ?? '[]');
      if (Array.isArray(parsed)) setCompleted(parsed);
      if (Array.isArray(revealed)) setReveals(revealed.length);
    } catch { setCompleted([]); setReveals(0); }
  }, []);

  const toggle = (id: string) => {
    const next = completed.includes(id) ? completed.filter((item) => item !== id) : [...completed, id];
    setCompleted(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };
  const clearReveals = () => {
    localStorage.removeItem(REVEAL_KEY);
    setReveals(0);
  };
  const markAllCompleted = () => {
    const allIds = games.map((game) => game.id);
    setCompleted(allIds);
    localStorage.setItem(KEY, JSON.stringify(allIds));
  };
  const clearAllCompleted = () => {
    setCompleted([]);
    localStorage.setItem(KEY, JSON.stringify([]));
  };
  const allCompleted = games.length > 0 && games.every((game) => completed.includes(game.id));

  return <div className="progress-wrap">
    <div className="progress-summary">
      <div><span className="kicker">{language === 'en' ? 'Completed' : '已完成'}</span><b>{completed.length} / {games.length}</b></div>
      <div><span className="kicker">{language === 'en' ? 'Manual Reveals' : '主动解锁'}</span><b>{reveals}</b></div>
      <div className="progress-bulk-actions">
        <button className="button" type="button" onClick={markAllCompleted} disabled={allCompleted}>{language === 'en' ? 'Mark all completed' : '一键全部标记'}</button>
        {completed.length > 0 && <button className="button-ghost" type="button" onClick={clearAllCompleted}>{language === 'en' ? 'Clear all' : '全部取消'}</button>}
        {reveals > 0 && <button className="button-ghost" type="button" onClick={clearReveals}>{language === 'en' ? 'Clear manual reveals' : '清除主动解锁记录'}</button>}
      </div>
    </div>
    {games.map((game) => {
      const on = completed.includes(game.id);
      const title = game.title[language];
      return <div className="progress-row" key={game.id}>
        <button aria-label={(on ? (language === 'en' ? 'Unmark completed ' : '取消完成 ') : (language === 'en' ? 'Mark completed ' : '标记完成 ')) + title} type="button" className={'progress-check ' + (on ? 'on' : '')} onClick={() => toggle(game.id)}>{on ? '✓' : ''}</button>
        <div>
          <b>{title}</b>
          {language === 'zhHans' && game.title.zhHans !== game.title.en && <small className="localized-original react-original">{game.title.en}</small>}
          <div className="muted">{on ? (language === 'en' ? 'Marked completed' : '已标记完成') : game.contentStatus === 'stub' ? (language === 'en' ? 'Archive content is incomplete; it can still be used as a spoiler gate' : '档案尚未完整录入，仍可作为剧透门槛使用') : (language === 'en' ? 'Not marked completed' : '未标记完成')}</div>
        </div>
        <span className={'badge ' + (on ? 'rust' : '')}>{on ? (language === 'en' ? 'Unlocked' : '已解锁') : (language === 'en' ? 'Spoilers hidden' : '隐藏相关剧透')}</span>
      </div>;
    })}
  </div>;
}
