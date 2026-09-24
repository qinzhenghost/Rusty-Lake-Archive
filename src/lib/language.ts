export type ArchiveLanguage = 'zhHans' | 'en';

export const LANGUAGE_KEY = 'rla-language-v1';
export const LANGUAGE_EVENT = 'rla-language-change';

export function normalizeLanguage(value: string | null | undefined): ArchiveLanguage {
  return value === 'en' ? 'en' : 'zhHans';
}

export function localize<T extends { zhHans: string; en: string }>(value: T, language: ArchiveLanguage): string {
  return language === 'en' ? value.en : value.zhHans;
}
