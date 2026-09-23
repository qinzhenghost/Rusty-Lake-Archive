import type { LocalizedRichText, Locale, EntityRef } from './schema';

export function toPlainText(value: LocalizedRichText, locale: Locale): string {
  return value[locale].map((token) => token.kind === 'text' ? token.text : token.label).join('');
}

export function entityRefs(value: LocalizedRichText, locale: Locale): EntityRef[] {
  return value[locale].filter((t) => t.kind === 'entity').map((t) => (t as Extract<typeof t,{kind:'entity'}>).entity);
}
