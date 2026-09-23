from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'content/manifest.json').read_text(encoding='utf-8'))
items=[]
for rel in manifest['contentFiles']:
    obj=json.loads((ROOT/rel).read_text(encoding='utf-8')); items.append(obj)
reg={(o['kind'],o['id']):o for o in items if o['kind']!='relationSet'}

def label(ref,locale='zhHans'):
    return reg[(ref['type'],ref['id'])]['title'][locale]

def collect_refs(ch):
    refs={(r['type'],r['id']) for r in ch['featuredRefs']}
    for b in ch['storyBlocks']:
        rich=None
        if b['type'] in ['paragraph','dialogue','note']: rich=b['content']
        elif b['type']=='event': rich=b['summary']
        if rich:
            for loc in ['zhHans','en']:
                for t in rich[loc]:
                    if t['kind']=='entity': refs.add((t['entity']['type'],t['entity']['id']))
    return [{'type':t,'id':i,'title':reg[(t,i)]['title']} for t,i in sorted(refs)]

game=reg[('game','seasons')]
chapters=[reg[('chapter',cid)] for cid in game['chapterIds']]
ch=reg[('chapter','seasons-spring-1964')]
view={
 'route':'/read/seasons/spring-1964',
 'game':{'id':game['id'],'title':game['title']},
 'chapter':{'id':ch['id'],'title':ch['title'],'timeline':ch['timeline']},
 'chapterNav':[{'id':x['id'],'slug':x['slug'],'title':x['title'],'active':x['id']==ch['id']} for x in sorted(chapters,key=lambda x:x['narrativeOrder'])],
 'storyBlocks':ch['storyBlocks'],
 'caseNotes':collect_refs(ch),
 'timelineEventIds':ch['eventIds']
}
out=ROOT/'generated/seasons-spring-1964.reader.json'; out.write_text(json.dumps(view,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'BUILT {out.relative_to(ROOT)} — {len(view["storyBlocks"])} blocks, {len(view["caseNotes"])} case-note refs')
