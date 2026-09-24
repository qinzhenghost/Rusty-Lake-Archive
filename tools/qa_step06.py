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

lake = reg.get(('game','the-lake'))
check('content:the-lake-exists', lake is not None, 'game missing')
check('content:the-lake-complete', lake and lake['contentStatus'] == 'complete', str(lake and lake['contentStatus']))
chapters = [reg[('chapter', cid)] for cid in lake['chapterIds']] if lake else []
check('content:four-sections', len(chapters) == 4, str(len(chapters)))
check('content:narrative-order', [c['narrativeOrder'] for c in chapters] == [1,2,3,4], str([c['narrativeOrder'] for c in chapters]))
check('content:chapter-depth', all(len(c['storyBlocks']) >= 5 for c in chapters), str([(c['id'],len(c['storyBlocks'])) for c in chapters]))
check('content:no-fake-chronology', all(c.get('timeline') is None and c.get('eventIds') == [] for c in chapters), 'The Lake must stay undated and event-free until canonical dates are sourced')
lake_events = [o['id'] for o in items if o['kind']=='event' and 'the-lake' in o.get('gameIds',[])]
check('content:no-fake-events', not lake_events, str(lake_events))

serialized = '\n'.join(json.dumps(c, ensure_ascii=False) for c in chapters)
check('content:no-walkthrough-codes', '1487' not in serialized and '1422' not in serialized, 'walkthrough codes leaked into reader')
check('content:no-quote-transcript', not any(b['type']=='quote' for c in chapters for b in c['storyBlocks']), 'quote blocks should not reproduce game text')
check('content:cabin-location', ('location','rusty-lake-cabin') in reg, 'cabin location missing')

black = reg[('concept','black-cube')]
black_gate = next((e for e in black['entries'] if e['id']=='black-cube-the-lake-ending'), None)
check('spoiler:black-cube-real-gate', black_gate is not None and black_gate['spoiler']['requiredCompletedGameIds']==['the-lake'], str(black_gate and black_gate['spoiler']))
soul = reg[('character','corrupted-soul')]
soul_gate = next((e for e in soul['entries'] if e['id']=='corrupted-soul-the-lake'), None)
check('spoiler:soul-real-gate', soul_gate is not None and soul_gate['spoiler']['requiredCompletedGameIds']==['the-lake'], str(soul_gate and soul_gate['spoiler']))

relations = [r for o in items if o['kind']=='relationSet' for r in o['relations']]
lake_rels = [r for r in relations if r['id'].startswith('rel-the-lake') or r['id'].endswith('the-lake')]
check('relations:cross-game-set', any(r['from']=={'type':'game','id':'the-lake'} and r['type']=='references' and r['to']=={'type':'game','id':'seasons'} for r in relations), 'The Lake -> Seasons reference missing')
check('relations:black-cube-bridge', any(r['from']=={'type':'concept','id':'black-cube'} and r['to']=={'type':'game','id':'seasons'} for r in relations) and any(r['from']=={'type':'concept','id':'black-cube'} and r['to']=={'type':'game','id':'the-lake'} for r in relations), 'black-cube does not bridge both games')
check('relations:real-spoiler-gate', any(r['spoiler']['requiredCompletedGameIds']==['the-lake'] for r in lake_rels), 'no The Lake relation is gated by completion')

reader = (ROOT/'src/components/ReaderApp.tsx').read_text('utf-8')
css = (ROOT/'src/styles/global.css').read_text('utf-8')
games_page = (ROOT/'src/pages/games/index.astro').read_text('utf-8')
home = (ROOT/'src/pages/index.astro').read_text('utf-8')
progress = (ROOT/'src/components/ProgressApp.tsx').read_text('utf-8')
check('reader:lake-theme', "game.id === 'the-lake'" in reader and 'season-lake' in css, 'The Lake reader theme missing')
check('reader:undated-label', 'UNDATED' in reader and '未标注明确年份' in reader, 'undated reader labels missing')
check('ui:games-copy', '逃离方块：四季' in games_page and '逃离方块：锈湖湖畔' in games_page and 'Cube Escape: The Lake' in games_page, 'games page must describe both complete archives bilingually')
check('ui:home-copy', 'The Lake' in home and '逃离方块：锈湖湖畔' in home and '完整阅读档案' in home, 'home no longer describes The Lake as a complete archive')
check('ui:progress-data-driven', 'games.map' in progress and 'game.contentStatus' in progress, 'progress list is not game-data-driven')

pkg = json.loads((ROOT/'package.json').read_text('utf-8'))
try:
    major, minor = [int(x) for x in pkg.get('version','0.0.0').split('.')[:2]]
except (TypeError, ValueError):
    major, minor = (0, 0)
check('package:step06', (major, minor) >= (0, 6) and 'qa:step06' in pkg.get('scripts',{}) and 'qa:step06' in pkg.get('scripts',{}).get('test',''), 'Step06 package script missing or package version predates Step06')
check('docs:step06', (ROOT/'docs/step06/README.md').exists(), 'Step06 notes missing')

print(f'Step06 QA: {sum(ok for _,ok,_ in checks)}/{len(checks)} checks passed')
for name,ok,detail in checks:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" — {detail}" if detail and not ok else ''))
if errors:
    print('\nProblems:')
    for error in errors:
        print('-', error)
    sys.exit(1)
