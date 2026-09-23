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

manifest = json.loads((ROOT/'content/manifest.json').read_text('utf-8'))
items = [json.loads((ROOT/p).read_text('utf-8')) for p in manifest['contentFiles']]
reg = {(o['kind'], o['id']): o for o in items if o['kind'] != 'relationSet'}
seasons = reg[('game','seasons')]
chapters = [reg[('chapter', cid)] for cid in seasons['chapterIds']]

check('content:seasons-ready', seasons['contentStatus'] == 'complete', seasons['contentStatus'])
check('content:five-chapters', len(chapters) == 5, str(len(chapters)))
check('content:chapter-depth', all(len(c['storyBlocks']) >= 5 for c in chapters), str([(c['id'],len(c['storyBlocks'])) for c in chapters]))
serialized = '\n'.join(json.dumps(c, ensure_ascii=False) for c in chapters)
check('content:no-placeholder-copy', '内容占位' not in serialized and 'Content Placeholder' not in serialized, 'placeholder copy remains')
check('content:blue-cube', ('concept','blue-cube') in reg, 'blue-cube concept missing')
winter = reg[('chapter','seasons-winter-1981')]
check('content:winter-blue-cube-ref', {'type':'concept','id':'blue-cube'} in winter['featuredRefs'], 'winter does not reference blue-cube')
check('content:final-no-fake-date', reg[('chapter','seasons-final')]['timeline'] is None, 'Final must remain timeline=null')
check('content:no-quote-transcript', not any(b['type']=='quote' for c in chapters for b in c['storyBlocks']), 'quote blocks should not be used for transcript reproduction')

reader = (ROOT/'src/components/ReaderApp.tsx').read_text('utf-8')
continue_reader = (ROOT/'src/components/ContinueReading.tsx').read_text('utf-8')
layout = (ROOT/'src/layouts/BaseLayout.astro').read_text('utf-8')
css = (ROOT/'src/styles/global.css').read_text('utf-8')
check('reader:language-persistence', 'rla-language-v1' in reader and 'localStorage.setItem(LANGUAGE_KEY' in reader, 'language mode is not persisted')
check('reader:last-read', 'rla-last-read-v1' in reader and 'updatedAt' in reader, 'last read position missing')
check('reader:continue-card', 'rla-last-read-v1' in continue_reader and 'Continue Reading' in continue_reader, 'home continue-reading component missing')
check('reader:scroll-progress', 'reading-progress-track' in reader and 'readProgress' in reader, 'reading progress missing')
check('reader:pager', 'previousChapter' in reader and 'nextChapter' in reader and 'reader-pager' in reader, 'previous/next chapter navigation missing')
check('reader:escape-close', "event.key === 'Escape'" in reader, 'Escape close behavior missing')
check('reader:source-label', 'SOURCE ·' in reader, 'drawer provenance missing')
check('reader:season-theme', all(x in css for x in ['season-spring','season-summer','season-fall','season-winter','season-final']), 'season visual variants missing')
check('reader:reduced-motion', 'prefers-reduced-motion' in css, 'reduced-motion fallback missing')
check('mobile:global-menu', 'mobile-menu' in layout and '<details' in layout, 'mobile global navigation missing')

for rel in ['public/icon.svg','public/site.webmanifest','public/robots.txt','public/_headers','.nvmrc','docs/step05/README.md','docs/step05/DEPLOY_CLOUDFLARE.md']:
    check('file:'+rel, (ROOT/rel).exists(), 'missing')
headers=(ROOT/'public/_headers').read_text('utf-8') if (ROOT/'public/_headers').exists() else ''
check('deploy:security-headers', 'X-Content-Type-Options' in headers and 'Permissions-Policy' in headers, 'basic static security headers missing')
deploy=(ROOT/'docs/step05/DEPLOY_CLOUDFLARE.md').read_text('utf-8') if (ROOT/'docs/step05/DEPLOY_CLOUDFLARE.md').exists() else ''
check('deploy:cloudflare-build', 'npm run build' in deploy and 'dist' in deploy and 'main' in deploy, 'Cloudflare Pages settings incomplete')
pkg=json.loads((ROOT/'package.json').read_text('utf-8'))
check('package:step05', pkg.get('version') == '0.5.0' and 'qa:step05' in pkg.get('scripts',{}), 'Step05 package scripts/version missing')

print(f'Step05 QA: {sum(ok for _,ok,_ in checks)}/{len(checks)} checks passed')
for name,ok,detail in checks:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" — {detail}" if detail and not ok else ''))
if errors:
    print('\nProblems:')
    for error in errors: print('-', error)
    sys.exit(1)
