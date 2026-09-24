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

models = (ROOT/'src/lib/models.ts').read_text('utf-8')
loader = (ROOT/'src/lib/content.ts').read_text('utf-8')
search = (ROOT/'src/components/SearchApp.tsx').read_text('utf-8')
search_page = (ROOT/'src/pages/search.astro').read_text('utf-8')
quick = (ROOT/'src/components/ArchiveReaderLinks.astro').read_text('utf-8')
layout = (ROOT/'src/layouts/BaseLayout.astro').read_text('utf-8')
css = (ROOT/'src/styles/global.css').read_text('utf-8')
character = (ROOT/'src/pages/characters/[slug].astro').read_text('utf-8')
lore = (ROOT/'src/pages/lore/[slug].astro').read_text('utf-8')
location = (ROOT/'src/pages/locations/[slug].astro').read_text('utf-8')
game = (ROOT/'src/pages/games/[slug].astro').read_text('utf-8')
home = (ROOT/'src/pages/index.astro').read_text('utf-8')
progress = (ROOT/'src/pages/progress.astro').read_text('utf-8')
progress_app = (ROOT/'src/components/ProgressApp.tsx').read_text('utf-8')

check('models:search-types', all(x in models for x in ['SearchKind','SearchDocument','SearchReaderLink']), 'search models missing')
check('index:builder', 'export function getSearchDocuments()' in loader, 'search index builder missing')
check('index:reader-links', 'export function getReaderLinksForRef' in loader, 'reader-link resolver missing')
check('index:story-blocks', 'storyDocs' in loader and 'storyBlockText' in loader and "kind: 'story'" in loader, 'block-level story index missing')
check('index:dossier-entries', 'entryDocs' in loader and "kind: 'entry'" in loader, 'dossier entry index missing')
check('index:relations', 'relationDocs' in loader and "kind: 'relation'" in loader, 'relation index missing')
check('index:bilingual', 'searchText' in loader and 'zhHans' in loader and 'en:' in loader, 'bilingual search text missing')
check('index:content-id', 'contentId: entry.id' in loader and 'contentId: block.id' in loader and 'contentId: relation.id' in loader, 'original content ids not preserved')

check('search:route', 'SearchApp client:load' in search_page and 'getSearchDocuments()' in search_page, 'search page not data-driven')
check('search:spoiler-first', 'visibleDocuments' in search and 'documents.filter((item) => canView' in search and '.map((item) => ({ item, score: scoreDocument' in search, 'visible filtering/scoring pipeline missing')
check('search:uses-visible-set', 'return visibleDocuments' in search, 'results may score locked documents')
check('search:progress-key', 'rla-progress-v1' in search, 'progress storage key missing')
check('search:manual-reveal-key', 'rla-manual-reveals-v1' in search and 'item.contentId' in search, 'manual reveal compatibility missing')
check('search:no-dangerous-html', 'dangerouslySetInnerHTML' not in search and 'innerHTML' not in search, 'search must render plain React nodes')
check('search:url-query', "params.get('q')" in search and "params.set('q'" in search and "params.get('kind')" in search, 'shareable search URL state missing')
check('search:kind-filter', 'KIND_LABELS' in search and '全部可见内容' in search, 'result-type filter missing')
check('search:keyboard-shortcut', "event.key === '/'" in search and 'inputRef.current?.focus()' in search, 'slash shortcut missing')
check('search:reader-jump', 'item.readerLinks.map' in search and '剧情中查看' in search, 'reader jump actions missing')
check('search:network-jump', 'item.networkFocus' in search and '/network?focus=' in search, 'network focus action missing')
check('search:empty-safe', '没有可见结果' in search and '被锁定' not in search, 'empty state should not identify specific locked matches')

check('nav:search', "'search' | 'progress'" in layout and "['search', '/search', '搜索']" in layout, 'search missing from navigation')
check('home:search-entry', 'href="/search"' in home and '全站搜索' in home, 'home search entry missing')
check('quick:component', 'Quick Paths' in quick and 'Lore Network' in quick and '剧情章节' in quick, 'quick-path component incomplete')
check('quick:character', 'ArchiveReaderLinks' in character and 'getReaderLinksForRef' in character, 'character quick paths missing')
check('quick:lore', 'ArchiveReaderLinks' in lore and 'getReaderLinksForRef' in lore, 'lore quick paths missing')
check('quick:location', 'ArchiveReaderLinks' in location and 'getReaderLinksForRef' in location, 'location quick paths missing')
check('quick:game-search', '/search?q=' in game, 'game search shortcut missing')
check('progress:mentions-search', '全站搜索' in progress, 'progress page does not describe search gating')
check('progress:bulk-mark-all', 'markAllCompleted' in progress_app and '一键全部标记' in progress_app and 'games.map((game) => game.id)' in progress_app, 'mark-all progress action missing')
check('progress:bulk-clear', 'clearAllCompleted' in progress_app and '全部取消' in progress_app, 'clear-all progress action missing')

check('style:search', all(x in css for x in ['search-shell','search-result','archive-jumps','@media (max-width: 720px)']), 'search/mobile styles missing')

pkg = json.loads((ROOT/'package.json').read_text('utf-8'))
deps = set(pkg.get('dependencies',{})) | set(pkg.get('devDependencies',{}))
check('deps:no-heavy-search', not any(x in deps for x in ['fuse.js','lunr','algoliasearch','minisearch']), str(sorted(deps)))
try:
    major, minor = [int(x) for x in pkg.get('version','0.0.0').split('.')[:2]]
except (TypeError, ValueError):
    major, minor = (0, 0)
check('package:step08', (major, minor) >= (0, 8) and 'qa:step08' in pkg.get('scripts',{}) and 'qa:step08' in pkg.get('scripts',{}).get('test',''), 'Step08 package script/version missing')
check('docs:step08', (ROOT/'docs/step08/README.md').exists(), 'Step08 notes missing')

print(f'Step08 QA: {sum(ok for _,ok,_ in checks)}/{len(checks)} checks passed')
for name,ok,detail in checks:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" — {detail}" if detail and not ok else ''))
if errors:
    print('\nProblems:')
    for error in errors:
        print('-', error)
    sys.exit(1)
