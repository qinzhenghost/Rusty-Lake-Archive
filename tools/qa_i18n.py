from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
checks = []
errors = []

def check(name, ok, detail=''):
    checks.append((name, bool(ok), detail))
    if not ok:
        errors.append(f'{name}: {detail}')

layout=(ROOT/'src/layouts/BaseLayout.astro').read_text('utf-8')
css=(ROOT/'src/styles/global.css').read_text('utf-8')
hook=(ROOT/'src/components/useArchiveLanguage.ts').read_text('utf-8')
language_lib=(ROOT/'src/lib/language.ts').read_text('utf-8')
toggle=(ROOT/'src/components/LanguageToggle.tsx').read_text('utf-8')
reader=(ROOT/'src/components/ReaderApp.tsx').read_text('utf-8')
search=(ROOT/'src/components/SearchApp.tsx').read_text('utf-8')
network=(ROOT/'src/components/LoreNetwork.tsx').read_text('utf-8')
progress=(ROOT/'src/components/ProgressApp.tsx').read_text('utf-8')
entries=(ROOT/'src/components/DossierEntries.tsx').read_text('utf-8')
related=(ROOT/'src/components/RelatedArchive.tsx').read_text('utf-8')
continue_reader=(ROOT/'src/components/ContinueReading.tsx').read_text('utf-8')
read_page=(ROOT/'src/pages/read/[game]/[chapter].astro').read_text('utf-8')

for rel in [
    'src/lib/language.ts','src/components/useArchiveLanguage.ts','src/components/LanguageToggle.tsx',
    'src/components/I18nText.astro','src/components/LocalizedTitle.astro'
]:
    check('file:'+rel,(ROOT/rel).exists(),'missing bilingual infrastructure')

check('global:top-toggle','LanguageToggle client:load' in layout and 'global-language-toggle' in toggle,'top language toggle missing')
check('global:preload-language',"rla-language-v1" in layout and 'document.documentElement.dataset.lang' in layout,'language is not applied before hydration')
check('global:persistence',"rla-language-v1" in language_lib and 'localStorage.setItem(LANGUAGE_KEY' in hook,'language persistence missing')
check('global:event-sync',"rla-language-change" in hook and 'CustomEvent' in hook,'React islands do not share language changes')
check('global:metadata','data-page-title-zh' in layout and 'data-page-title-en' in layout and 'document.title' in layout,'document title does not switch')
check('global:css',all(x in css for x in ['[data-i18n-en]','html[data-lang="en"] [data-i18n-zh]','global-language-toggle','localized-original']),'bilingual CSS missing')
check('global:nav',all(x in layout for x in ["'游戏', 'Games'","'时间线', 'Timeline'","'搜索', 'Search'","'进度', 'Progress'"]),'navigation is not bilingual')

for name, text in [
    ('reader',reader),('search',search),('network',network),('progress',progress),
    ('entries',entries),('related',related),('continue',continue_reader)
]:
    check('react:'+name,'useArchiveLanguage' in text,f'{name} does not follow global language')

check('reader:no-independent-bi',"'bi'" not in reader and 'lang-toggle' not in reader,'reader still has an independent language mode')
check('reader:localized-entity-label',"record.title[language]" in reader and 'token.label' in reader,'reader entity labels do not resolve from localized entity titles')
check('reader:bilingual-last-read','gameTitle: game.title' in reader and 'chapterTitle: chapter.title' in reader,'last-read state is not bilingual')
check('reader:bilingual-page-title','titleEn=' in read_page,'reader page lacks English document title')
check('search:current-language','item.title[language]' in search and 'item.excerpt[language]' in search,'search results do not switch language')
check('network:current-language','record.title[language]' in network and 'RELATION_LABELS[type][language]' in network,'network does not switch names/labels')
check('dossier:current-language','entry.content[language]' in entries and 'record.title[language]' in entries,'dossier entries do not switch language')

content_paths=[
    'content/games/seasons.json','content/games/the-lake.json','content/games/the-mill.stub.json',
    'content/characters/laura-vanderboom.json','content/characters/harvey.json','content/characters/corrupted-soul.json',
    'content/locations/lauras-room.json','content/locations/rusty-lake-location.json','content/locations/rusty-lake-cabin.json'
]
items=[json.loads((ROOT/p).read_text('utf-8')) for p in content_paths]
for item in items:
    check('content:localized-title:'+item['id'], item['title']['zhHans'] != item['title']['en'], str(item['title']))

expected={
    'seasons':'逃离方块：四季',
    'the-lake':'逃离方块：锈湖湖畔',
    'the-mill':'逃离方块：磨坊',
    'laura-vanderboom':'劳拉·范德布姆',
    'harvey':'哈维',
    'corrupted-soul':'腐化灵魂',
}
by_id={item['id']:item for item in items}
for item_id,title in expected.items():
    check('content:primary-name:'+item_id,by_id[item_id]['title']['zhHans']==title,by_id[item_id]['title']['zhHans'])

static_pages=[
    'src/pages/index.astro','src/pages/games/index.astro','src/pages/games/[slug].astro',
    'src/pages/characters/index.astro','src/pages/characters/[slug].astro','src/pages/lore/index.astro',
    'src/pages/lore/[slug].astro','src/pages/locations/[slug].astro','src/pages/timeline.astro',
    'src/pages/progress.astro','src/pages/network.astro','src/pages/search.astro','src/pages/about.astro'
]
for rel in static_pages:
    text=(ROOT/rel).read_text('utf-8')
    check('page:bilingual:'+rel, 'I18nText' in text or ('data-i18n-zh' in text and 'data-i18n-en' in text), 'page lacks bilingual static copy')

pkg=json.loads((ROOT/'package.json').read_text('utf-8'))
check('package:i18n-script','qa:i18n' in pkg.get('scripts',{}) and 'qa:i18n' in pkg.get('scripts',{}).get('test',''),'i18n QA is not part of the full test')
check('package:version',pkg.get('version')=='0.8.2',pkg.get('version'))

print(f'I18N QA: {sum(ok for _,ok,_ in checks)}/{len(checks)} checks passed')
for name,ok,detail in checks:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" — {detail}" if detail and not ok else ''))
if errors:
    print('\nProblems:')
    for error in errors:
        print('-',error)
    sys.exit(1)
