import { useEffect, useState } from 'react';
import type { GameData } from '../lib/models';
const KEY = 'rla-progress-v1';

export default function ProgressApp({ games }: { games: GameData[] }) {
  const [completed, setCompleted] = useState<string[]>([]);
  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]');
      if (Array.isArray(parsed)) setCompleted(parsed);
    } catch { setCompleted([]); }
  }, []);

  const toggle = (id: string) => {
    const next = completed.includes(id) ? completed.filter((item) => item !== id) : [...completed, id];
    setCompleted(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  return <div className="progress-wrap">{games.map((game) => {
    const on = completed.includes(game.id);
    return <div className="progress-row" key={game.id}>
      <button aria-label={`${on ? '取消完成' : '标记完成'} ${game.title.zhHans}`} type="button" className={`progress-check ${on ? 'on' : ''}`} onClick={() => toggle(game.id)}>{on ? '✓' : ''}</button>
      <div><b>{game.title.zhHans}</b><div className="muted">{on ? '已标记完成' : game.contentStatus === 'stub' ? '档案尚未完整录入，仍可作为剧透门槛使用' : '未标记完成'}</div></div>
      <span className={`badge ${on ? 'rust' : ''}`}>{on ? '已解锁' : '隐藏相关剧透'}</span>
    </div>;
  })}</div>;
}
