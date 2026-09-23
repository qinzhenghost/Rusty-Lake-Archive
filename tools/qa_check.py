from pathlib import Path
import json, sys
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'content/manifest.json').read_text(encoding='utf-8'))
items=[json.loads((ROOT/p).read_text(encoding='utf-8')) for p in manifest['contentFiles']]
reg={(o['kind'],o['id']):o for o in items if o['kind']!='relationSet'}
checks=[]
def check(name, ok, detail=''):
    checks.append((name,bool(ok),detail))

seasons=reg[('game','seasons')]
check('Seasons indexes exactly five MVP chapters', len(seasons['chapterIds'])==5)
chapters=[reg[('chapter',cid)] for cid in seasons['chapterIds']]
check('Narrative order is 1..5', [c['narrativeOrder'] for c in chapters]==[1,2,3,4,5])
schema=json.loads((ROOT/'schema/content-item.schema.json').read_text(encoding='utf-8'))
block_defs=schema['$defs']['storyBlock']['oneOf']
supported={b['properties']['type']['const'] for b in block_defs}
expected={'paragraph','dialogue','scene','image','quote','event','interaction','note'}
check('Schema supports all eight StoryBlock types', supported==expected, str(sorted(supported)))
raw_html=[]
for c in chapters:
  for b in c['storyBlocks']:
    rich=b.get('content') or b.get('summary')
    if isinstance(rich,dict) and 'zhHans' in rich and isinstance(rich['zhHans'],list):
      for loc in ['zhHans','en']:
        for t in rich[loc]:
          val=t.get('text','')+t.get('label','')
          if '<' in val or '>' in val: raw_html.append((c['id'],b['id'],loc))
check('Rich text contains no raw HTML tokens', not raw_html, str(raw_html))
view=json.loads((ROOT/'generated/seasons-spring-1964.reader.json').read_text(encoding='utf-8'))
refs={(x['type'],x['id']) for x in view['caseNotes']}
needed={('character','laura-vanderboom'),('character','harvey'),('concept','memory'),('location','lauras-room')}
check('Spring Case Notes can be generated from structured refs', needed.issubset(refs), str(sorted(refs)))
black=reg[('concept','black-cube')]
locked=next(e for e in black['entries'] if e['id']=='black-cube-the-lake-ending')
check('Cross-game spoiler gate requires The Lake', locked['spoiler']['requiredCompletedGameIds']==['the-lake'])
check('Manual reveal is supported', locked['spoiler']['allowManualReveal'] is True)
ordered=sorted([o for o in items if o['kind']=='event'], key=lambda e:e['timeline']['sortKey'])
check('Timeline sorts 1964 -> 1971 Summer -> 1971 Fall -> 1981', [x['id'] for x in ordered]==['seasons-event-spring-1964','seasons-event-summer-1971','seasons-event-fall-1971','seasons-event-winter-1981'])
check('Final does not invent a calendar date', reg[('chapter','seasons-final')]['timeline'] is None)
claim_kinds=[]
for o in items:
  if o['kind'] in {'character','concept','location'}: claim_kinds += [e['claimKind'] for e in o['entries']]
  if o['kind']=='relationSet': claim_kinds += [r['claimKind'] for r in o['relations']]
check('Fact/interpretation/theory field is actively used', 'fact' in claim_kinds and 'interpretation' in claim_kinds)
images=[b for c in chapters for b in c['storyBlocks'] if b['type']=='image']
check('MVP images are placeholder/original, not unlicensed official assets', all(b['asset']['rights'] in {'placeholder','owned','licensed'} and b['asset']['assetType']!='official-licensed' for b in images))
quotes=[b for c in chapters for b in c['storyBlocks'] if b['type']=='quote']
check('No long game transcript is included in sample', len(quotes)==0)
mill=reg[('game','the-mill')]
check('The Mill exact release date has press-kit provenance', 'official-the-mill-presskit' in mill['sourceIds'])
check('Seasons exact release date has press-kit provenance', 'official-seasons-presskit' in seasons['sourceIds'])
check('The Mill exists as a stub without fake chapters', mill['contentStatus']=='stub' and mill['chapterIds']==[])

failed=[c for c in checks if not c[1]]
for name,ok,detail in checks:
    print(('PASS' if ok else 'FAIL'), '-', name, (f'— {detail}' if detail else ''))
print(f'\n{len(checks)-len(failed)}/{len(checks)} checks passed')
if failed: sys.exit(1)
