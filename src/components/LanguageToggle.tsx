import { useArchiveLanguage } from './useArchiveLanguage';

export default function LanguageToggle() {
  const [language, setLanguage] = useArchiveLanguage();
  return <div className="global-language-toggle" aria-label={language === 'en' ? 'Website language' : '网页语言'}>
    <button type="button" className={language === 'zhHans' ? 'active' : ''} onClick={() => setLanguage('zhHans')}>中文</button>
    <button type="button" className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
  </div>;
}
