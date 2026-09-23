from pathlib import Path
import json, sys
from jsonschema import Draft202012Validator, FormatChecker

ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'content/manifest.json').read_text(encoding='utf-8'))
schema=json.loads((ROOT/'schema/content-item.schema.json').read_text(encoding='utf-8'))
validator=Draft202012Validator(schema, format_checker=FormatChecker())
items=[]; errors=[]

for rel in manifest['contentFiles']:
    p=ROOT/rel
    if not p.exists():
        errors.append(f'MISSING FILE: {rel}'); continue
    obj=json.loads(p.read_text(encoding='utf-8'))
    for e in sorted(validator.iter_errors(obj), key=lambda e:list(e.path)):
        errors.append(f'{rel}: schema {list(e.path)}: {e.message}')
    items.append((rel,obj))

registry={}
for rel,obj in items:
    if obj['kind']=='relationSet': continue
    key=(obj['kind'],obj['id'])
    if key in registry: errors.append(f'DUPLICATE ENTITY: {key} in {rel} and {registry[key][0]}')
    registry[key]=(rel,obj)

source_ids={k[1] for k in registry if k[0]=='source'}
game_ids={k[1] for k in registry if k[0]=='game'}

def check_ref(ref, where):
    key=(ref['type'],ref['id'])
    if key not in registry: errors.append(f'BROKEN REF {where}: {key}')

def check_sources(ids,where):
    for sid in ids:
        if sid not in source_ids: errors.append(f'BROKEN SOURCE {where}: {sid}')

def check_spoiler(rule,where):
    for gid in rule['requiredCompletedGameIds']:
        if gid not in game_ids: errors.append(f'UNKNOWN SPOILER GAME {where}: {gid}')

def rich_entity_set(rich,locale):
    return {(t['entity']['type'],t['entity']['id']) for t in rich[locale] if t['kind']=='entity'}

def walk_rich(rich,where):
    zh,en=rich_entity_set(rich,'zhHans'),rich_entity_set(rich,'en')
    if zh!=en: errors.append(f'LOCALE ENTITY MISMATCH {where}: zh={sorted(zh)} en={sorted(en)}')
    for loc in ['zhHans','en']:
        for tok in rich[loc]:
            if tok['kind']=='entity': check_ref(tok['entity'],f'{where}.{loc}')

for rel,obj in items:
    kind=obj['kind']
    if kind not in ['source','relationSet']:
        check_sources(obj.get('sourceIds',[]),rel); check_spoiler(obj['spoiler'],rel)
    if kind=='game':
        for cid in obj['chapterIds']:
            if ('chapter',cid) not in registry: errors.append(f'BROKEN CHAPTER INDEX {rel}: {cid}')
    elif kind=='chapter':
        if ('game',obj['gameId']) not in registry: errors.append(f'BROKEN GAME {rel}: {obj["gameId"]}')
        seen=set()
        for b in obj['storyBlocks']:
            if b['id'] in seen: errors.append(f'DUPLICATE BLOCK ID {rel}: {b["id"]}')
            seen.add(b['id']); check_spoiler(b['spoiler'],f'{rel}#{b["id"]}'); check_sources(b['provenance']['sourceIds'],f'{rel}#{b["id"]}')
            if b['type'] in ['paragraph','dialogue','event','note']: walk_rich(b['content'] if b['type']!='event' else b['summary'],f'{rel}#{b["id"]}')
            if b['type']=='dialogue': check_ref(b['speaker'],f'{rel}#{b["id"]}.speaker')
            if b['type']=='event' and ('event',b['eventId']) not in registry: errors.append(f'BROKEN EVENT {rel}#{b["id"]}: {b["eventId"]}')
            if b['type']=='interaction': check_ref(b['target'],f'{rel}#{b["id"]}.target')
            if b['type']=='quote':
                if b['provenance']['mode']!='short-quote': errors.append(f'QUOTE MODE {rel}#{b["id"]}: quote block must use short-quote provenance')
                if max(len(b['content']['zhHans']),len(b['content']['en']))>120: errors.append(f'QUOTE TOO LONG {rel}#{b["id"]}')
        for ref in obj['featuredRefs']: check_ref(ref,f'{rel}.featuredRefs')
        for eid in obj['eventIds']:
            if ('event',eid) not in registry: errors.append(f'BROKEN EVENT INDEX {rel}: {eid}')
    elif kind in ['character','concept','location']:
        for entry in obj['entries']:
            check_spoiler(entry['spoiler'],f'{rel}#{entry["id"]}'); check_sources(entry['provenance']['sourceIds'],f'{rel}#{entry["id"]}'); walk_rich(entry['content'],f'{rel}#{entry["id"]}')
    elif kind=='event':
        for gid in obj['gameIds']:
            if ('game',gid) not in registry: errors.append(f'BROKEN EVENT GAME {rel}: {gid}')
        for cid in obj['chapterIds']:
            if ('chapter',cid) not in registry: errors.append(f'BROKEN EVENT CHAPTER {rel}: {cid}')
        for ref in obj['participants']+obj['locations']+obj['concepts']: check_ref(ref,rel)
    elif kind=='relationSet':
        rids=set()
        for r in obj['relations']:
            if r['id'] in rids: errors.append(f'DUPLICATE RELATION ID {rel}: {r["id"]}')
            rids.add(r['id']); check_ref(r['from'],f'{rel}#{r["id"]}.from'); check_ref(r['to'],f'{rel}#{r["id"]}.to'); check_spoiler(r['spoiler'],f'{rel}#{r["id"]}'); check_sources(r['sourceIds'],f'{rel}#{r["id"]}')

for key,(rel,g) in registry.items():
    if key[0]!='game': continue
    orders=[]
    for cid in g['chapterIds']:
        ch=registry.get(('chapter',cid),(None,None))[1]
        if ch:
            if ch['gameId']!=g['id']: errors.append(f'CHAPTER OWNER MISMATCH {cid}: {ch["gameId"]} vs {g["id"]}')
            orders.append(ch['narrativeOrder'])
    if orders and sorted(orders)!=list(range(1,len(orders)+1)): errors.append(f'CHAPTER ORDER GAP {g["id"]}: {orders}')

if errors:
    print('VALIDATION FAILED')
    for e in errors: print(' -',e)
    sys.exit(1)
print(f'VALIDATION OK — {len(items)} files, {len(registry)} entities, {sum(len(o["relations"]) for _,o in items if o["kind"]=="relationSet")} relations')
