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
relations = [r for o in items if o['kind']=='relationSet' for r in o['relations']]

arles = reg.get(('game','arles'))
check('content:arles-exists', arles is not None, 'Arles game missing')
check('content:arles-complete', arles and arles['contentStatus']=='complete', str(arles and arles['contentStatus']))
check('content:arles-title', arles and arles['title']=={'zhHans':'逃离方块：阿尔勒','en':'Cube Escape: Arles'}, str(arles and arles['title']))
check('content:official-order', arles and arles['releaseOrder']==3 and arles['recommendedPlayOrder']==3, str(arles and (arles['releaseOrder'], arles['recommendedPlayOrder'])))
check('content:release-date', arles and arles['releaseDate']=='2015-06-05', str(arles and arles['releaseDate']))

chapters = [reg[('chapter', cid)] for cid in arles['chapterIds']] if arles else []
check('content:four-chapters', len(chapters)==4, str(len(chapters)))
check('content:narrative-order', [c['narrativeOrder'] for c in chapters]==[1,2,3,4], str([c['narrativeOrder'] for c in chapters]))
check('content:chapter-depth', all(len(c['storyBlocks'])>=5 for c in chapters), str([(c['id'],len(c['storyBlocks'])) for c in chapters]))
check('content:no-fake-chronology', all(c.get('timeline') is None and c.get('eventIds')==[] for c in chapters), 'Arles must remain undated until a reliable in-universe date is sourced')
arles_events=[o['id'] for o in items if o['kind']=='event' and 'arles' in o.get('gameIds',[])]
check('content:no-fake-events', not arles_events, str(arles_events))

serialized='\n'.join(json.dumps(c,ensure_ascii=False) for c in chapters)
check('content:no-walkthrough-codes', '1458' not in serialized and '1853' not in serialized, 'walkthrough code leaked into reader')
check('content:no-quote-transcript', not any(b['type']=='quote' for c in chapters for b in c['storyBlocks']), 'quote blocks should not reproduce game text')
check('content:no-step-by-step-copy', 'step-by-step' not in serialized.lower() and '逐步操作顺序' in serialized, 'reader should explain the boundary without reproducing a walkthrough')

check('entity:vincent', ('character','vincent-van-gogh') in reg, 'Vincent file missing')
check('entity:bedroom', ('location','arles-bedroom') in reg, 'Arles bedroom file missing')
check('entity:white-cube', ('concept','white-cube') in reg, 'White Cube file missing')

white=reg.get(('concept','white-cube'))
white_gate=next((e for e in white['entries'] if e['id']=='white-cube-arles'),None) if white else None
check('spoiler:white-cube-gate', white_gate is not None and white_gate['spoiler']['requiredCompletedGameIds']==['arles'], str(white_gate and white_gate['spoiler']))
black=reg.get(('concept','black-cube'))
black_gate=next((e for e in black['entries'] if e['id']=='black-cube-arles'),None) if black else None
check('spoiler:black-cube-gate', black_gate is not None and black_gate['spoiler']['requiredCompletedGameIds']==['arles'], str(black_gate and black_gate['spoiler']))
soul=reg.get(('character','corrupted-soul'))
soul_gate=next((e for e in soul['entries'] if e['id']=='corrupted-soul-arles'),None) if soul else None
check('spoiler:corrupted-soul-gate', soul_gate is not None and soul_gate['spoiler']['requiredCompletedGameIds']==['arles'], str(soul_gate and soul_gate['spoiler']))

check('relations:vincent-arles', any(r['from']=={'type':'character','id':'vincent-van-gogh'} and r['type']=='appears_in' and r['to']=={'type':'game','id':'arles'} for r in relations), 'Vincent -> Arles relation missing')
check('relations:bedroom-arles', any(r['from']=={'type':'game','id':'arles'} and r['type']=='located_at' and r['to']=={'type':'location','id':'arles-bedroom'} for r in relations), 'Arles -> bedroom relation missing')
check('relations:white-cube-arles', any(r['from']=={'type':'concept','id':'white-cube'} and r['to']=={'type':'game','id':'arles'} and r['spoiler']['requiredCompletedGameIds']==['arles'] for r in relations), 'gated White Cube -> Arles relation missing')
check('relations:black-cube-arles', any(r['from']=={'type':'concept','id':'black-cube'} and r['to']=={'type':'game','id':'arles'} and r['spoiler']['requiredCompletedGameIds']==['arles'] for r in relations), 'gated Black Cube -> Arles relation missing')
check('relations:soul-arles', any(r['from']=={'type':'character','id':'corrupted-soul'} and r['to']=={'type':'game','id':'arles'} and r['spoiler']['requiredCompletedGameIds']==['arles'] for r in relations), 'gated Corrupted Soul -> Arles relation missing')
check('relations:no-fake-cross-game-reference', not any(r['from']=={'type':'game','id':'arles'} and r['type']=='references' and r['to']['id'] in {'seasons','the-lake'} for r in relations), 'Arles should not invent a direct in-game reference to Seasons/The Lake')

reader=(ROOT/'src/components/ReaderApp.tsx').read_text('utf-8')
css=(ROOT/'src/styles/global.css').read_text('utf-8')
home=(ROOT/'src/pages/index.astro').read_text('utf-8')
games=(ROOT/'src/pages/games/index.astro').read_text('utf-8')
about=(ROOT/'src/pages/about.astro').read_text('utf-8')
progress=(ROOT/'src/components/ProgressApp.tsx').read_text('utf-8')
check('reader:arles-theme', "game.id === 'arles'" in reader and 'season-arles' in css, 'Arles reader theme missing')
check('reader:undated-label', 'UNDATED' in reader and '未标注明确年份' in reader, 'undated labels missing')
check('ui:home-three-archives', '三套完整阅读档案' in home and 'Cube Escape: Arles' in home, 'home does not advertise three complete archives')
check('ui:games-three-archives', '逃离方块：阿尔勒' in games and 'Cube Escape: Arles' in games, 'games index missing Arles')
check('ui:about-three-archives', '三套完整阅读档案' in about and 'three complete reading archives' in about, 'about page is stale')
check('ui:progress-data-driven', 'games.map' in progress, 'progress page must pick up Arles from game data automatically')

for rel in [
    'content/sources/official-arles-page.json','content/sources/official-arles-release.json','content/sources/primary-arles-game.json',
    'content/games/arles.json','content/characters/vincent-van-gogh.json','content/concepts/white-cube.json',
    'content/locations/arles-bedroom.json','content/relations/arles-relations.json','docs/step09/README.md'
]:
    check('file:'+rel, (ROOT/rel).exists(), 'missing Step09 file')

pkg=json.loads((ROOT/'package.json').read_text('utf-8'))
check('package:version', pkg.get('version')=='0.9.0', pkg.get('version'))
check('package:step09', 'qa:step09' in pkg.get('scripts',{}) and 'qa:step09' in pkg.get('scripts',{}).get('test',''), 'Step09 QA not wired into full test')

print(f'Step09 QA: {sum(ok for _,ok,_ in checks)}/{len(checks)} checks passed')
for name,ok,detail in checks:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" — {detail}" if detail and not ok else ''))
if errors:
    print('\nProblems:')
    for error in errors:
        print('-', error)
    sys.exit(1)
