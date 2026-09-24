import { useEffect, useState } from 'react';
import { LANGUAGE_EVENT, LANGUAGE_KEY, normalizeLanguage, type ArchiveLanguage } from '../lib/language';

export function useArchiveLanguage(): [ArchiveLanguage, (next: ArchiveLanguage) => void] {
  const [language, setLanguageState] = useState<ArchiveLanguage>('zhHans');

  useEffect(() => {
    const read = () => setLanguageState(normalizeLanguage(localStorage.getItem(LANGUAGE_KEY)));
    read();
    const onLanguage = (event: Event) => {
      const detail = (event as CustomEvent<{ language?: string }>).detail;
      setLanguageState(normalizeLanguage(detail?.language ?? localStorage.getItem(LANGUAGE_KEY)));
    };
    window.addEventListener(LANGUAGE_EVENT, onLanguage);
    window.addEventListener('storage', read);
    return () => {
      window.removeEventListener(LANGUAGE_EVENT, onLanguage);
      window.removeEventListener('storage', read);
    };
  }, []);

  const setLanguage = (next: ArchiveLanguage) => {
    setLanguageState(next);
    localStorage.setItem(LANGUAGE_KEY, next);
    document.documentElement.dataset.lang = next;
    document.documentElement.lang = next === 'en' ? 'en' : 'zh-CN';
    window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: { language: next } }));
  };

  return [language, setLanguage];
}
