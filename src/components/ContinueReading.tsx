import { useEffect, useState } from 'react';
import type { LocalizedText } from '../content/schema';
import { useArchiveLanguage } from './useArchiveLanguage';

type StoredTitle = string | LocalizedText;
type LastRead = { href: string; game?: StoredTitle; chapter?: StoredTitle; gameTitle?: LocalizedText; chapterTitle?: LocalizedText; updatedAt?: string };
const KEY = 'rla-last-read-v1';

function pick(value: StoredTitle | undefined, language: 'zhHans' | 'en', fallback: string): string {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  return value[language];
}

export default function ContinueReading() {
  const [language] = useArchiveLanguage();
  const [last, setLast] = useState<LastRead | null>(null);
  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) ?? 'null');
      if (parsed && typeof parsed.href === 'string') setLast(parsed);
    } catch { setLast(null); }
  }, []);

  const game = last ? pick(last.gameTitle ?? last.game, language, language === 'en' ? 'Cube Escape: Seasons' : '逃离方块：四季') : language === 'en' ? 'Cube Escape: Seasons' : '逃离方块：四季';
  const chapter = last ? pick(last.chapterTitle ?? last.chapter, language, language === 'en' ? 'Spring · 1964' : '春 · 1964') : language === 'en' ? 'Spring · 1964' : '春 · 1964';

  return <a className="continue-card" href={last?.href ?? '/read/seasons/spring-1964'}>
    <span className="kicker">{last ? (language === 'en' ? 'Continue Reading' : '继续阅读') : (language === 'en' ? 'Start Reading' : '开始阅读')}</span>
    <b>{chapter}</b>
    <small>{last ? game + ' · ' + (language === 'en' ? 'Return to your last reading position' : '返回上次阅读位置') : game + ' · ' + (language === 'en' ? 'Start with the first memory' : '从第一段记忆开始')}</small>
    <span className="continue-arrow">→</span>
  </a>;
}
