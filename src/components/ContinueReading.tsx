import { useEffect, useState } from 'react';

type LastRead = { href: string; game: string; chapter: string; updatedAt?: string };
const KEY = 'rla-last-read-v1';

export default function ContinueReading() {
  const [last, setLast] = useState<LastRead | null>(null);
  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) ?? 'null');
      if (parsed && typeof parsed.href === 'string') setLast(parsed);
    } catch { setLast(null); }
  }, []);
  return <a className="continue-card" href={last?.href ?? '/read/seasons/spring-1964'}>
    <span className="kicker">{last ? 'Continue Reading' : 'Start Reading'}</span>
    <b>{last ? last.chapter : '春 · 1964'}</b>
    <small>{last ? last.game + ' · 返回上次阅读位置' : 'Cube Escape: Seasons · 从第一段记忆开始'}</small>
    <span className="continue-arrow">→</span>
  </a>;
}
