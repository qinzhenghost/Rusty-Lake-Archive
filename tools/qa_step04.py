from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []
checks = []

def check(name, condition, message):
    checks.append((name, bool(condition)))
    if not condition:
        errors.append(f'{name}: {message}')

required = [
    'package.json', 'astro.config.mjs', 'src/layouts/BaseLayout.astro', 'src/styles/global.css',
    'src/lib/content.ts', 'src/components/ReaderApp.tsx', 'src/components/ProgressApp.tsx',
    'src/pages/index.astro', 'src/pages/games/index.astro', 'src/pages/games/[slug].astro',
    'src/pages/read/[game]/[chapter].astro', 'src/pages/timeline.astro', 'src/pages/characters/index.astro',
    'src/pages/progress.astro', 'src/pages/about.astro'
]
for rel in required:
    check(f'file:{rel}', (ROOT / rel).exists(), 'required Step 04 file missing')

reader = (ROOT / 'src/components/ReaderApp.tsx').read_text('utf-8')
loader = (ROOT / 'src/lib/content.ts').read_text('utf-8')
progress = (ROOT / 'src/components/ProgressApp.tsx').read_text('utf-8')
read_page = (ROOT / 'src/pages/read/[game]/[chapter].astro').read_text('utf-8')
timeline = (ROOT / 'src/pages/timeline.astro').read_text('utf-8')

check('reader:no-dangerous-html', 'dangerouslySetInnerHTML' not in reader and 'innerHTML' not in reader, 'reader must render rich tokens structurally')
check('reader:entity-links', 'entity-button' in reader and 'onEntity' in reader, 'entity tokens must stay interactive')
check('reader:languages', all(token in reader for token in ["'zhHans'", "'en'", "'bi'"]), 'three language modes missing')
check('reader:spoiler-gate', 'canView' in reader and 'manualRevealIds' in reader, 'spoiler logic is not wired')
check('reader:mobile-sheet', 'chapter-sheet' in reader and 'mobile-tabs' in reader, 'mobile chapter/navigation interaction missing')
check('progress:local-storage', 'localStorage' in progress and 'rla-progress-v1' in progress, 'progress persistence missing')
check('loader:root-content', "join(process.cwd(), 'content')" in loader, 'content loader must consume Step 03 root data')
check('route:data-driven', 'getStaticPaths' in read_page and 'getEntityMap' in read_page, 'reader routes must come from content data')
check('timeline:data-driven', 'getEvents()' in timeline, 'timeline must use event data')
check('copyright:no-official-assets', not any((ROOT / 'public').rglob('*')) if (ROOT / 'public').exists() else True, 'Step 04 should not bundle official media assets')

pkg = json.loads((ROOT / 'package.json').read_text('utf-8'))
check('package:astro', 'astro' in pkg.get('dependencies', {}), 'Astro dependency missing')
check('package:react', 'react' in pkg.get('dependencies', {}) and '@astrojs/react' in pkg.get('dependencies', {}), 'React integration missing')
check('package:test', 'test' in pkg.get('scripts', {}) and 'build' in pkg.get('scripts', {}), 'build/test scripts missing')

print(f'Step04 QA: {sum(v for _,v in checks)}/{len(checks)} checks passed')
for name, ok in checks:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}")
if errors:
    print('\nProblems:')
    for error in errors: print('-', error)
    sys.exit(1)
