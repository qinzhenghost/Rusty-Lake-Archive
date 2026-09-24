from pathlib import Path
import json
import re
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

schema = json.loads((ROOT/'schema/content-item.schema.json').read_text('utf-8'))
for kind in ['game','character','concept','location']:
    ref = schema['$defs'][kind]['properties'].get('heroAsset',{}).get('$ref')
    check('schema:heroAsset:'+kind, ref == '#/$defs/assetRef', str(ref))

visual_dir = ROOT/'public/visuals'
expected = {
    'game-seasons.svg','game-the-lake.svg','game-arles.svg',
    'character-laura.svg','character-harvey.svg','character-vincent.svg','character-corrupted-soul.svg',
    'concept-black-cube.svg','concept-white-cube.svg',
    'location-lauras-room.svg','location-lake-cabin.svg','location-arles-bedroom.svg'
}
actual = {p.name for p in visual_dir.glob('*.svg')} if visual_dir.exists() else set()
check('assets:twelve-first-batch', expected.issubset(actual), str(sorted(expected-actual)))
for name in expected:
    path=visual_dir/name
    if path.exists():
        raw=path.read_text('utf-8')
        check('asset:svg:'+name, '<svg' in raw and 'viewBox=' in raw, 'not a valid inline SVG asset')
        check('asset:local-only:'+name, 'http://' not in raw and 'https://' not in raw, 'external URL found inside original SVG')

hero_targets = [
    ('game','seasons'),('game','the-lake'),('game','arles'),
    ('character','laura-vanderboom'),('character','harvey'),('character','vincent-van-gogh'),('character','corrupted-soul'),
    ('concept','black-cube'),('concept','white-cube'),
    ('location','lauras-room'),('location','rusty-lake-cabin'),('location','arles-bedroom')
]
for kind,item_id in hero_targets:
    item=reg.get((kind,item_id))
    asset=item.get('heroAsset') if item else None
    check('hero:exists:'+item_id, asset is not None, 'heroAsset missing')
    if asset:
        check('hero:rights:'+item_id, asset.get('assetType')=='original' and asset.get('rights')=='owned', str(asset))
        check('hero:src:'+item_id, isinstance(asset.get('src'),str) and asset['src'].startswith('/visuals/'), str(asset.get('src')))
        check('hero:alt:'+item_id, bool(asset.get('alt',{}).get('zhHans')) and bool(asset.get('alt',{}).get('en')), str(asset.get('alt')))

chapter_specs = [
    ('chapter','seasons-spring-1964','/visuals/location-lauras-room.svg'),
    ('chapter','the-lake-arrival','/visuals/location-lake-cabin.svg'),
    ('chapter','arles-bedroom','/visuals/location-arles-bedroom.svg')
]
for _,chapter_id,src in chapter_specs:
    chapter=reg.get(('chapter',chapter_id))
    images=[b for b in chapter.get('storyBlocks',[]) if b.get('type')=='image'] if chapter else []
    real=[b for b in images if b.get('asset',{}).get('src')==src and b.get('asset',{}).get('assetType')=='original' and b.get('asset',{}).get('rights')=='owned']
    check('story-image:'+chapter_id, len(real)>=1, str(images))

visual_component=(ROOT/'src/components/VisualAsset.astro').read_text('utf-8')
reader=(ROOT/'src/components/ReaderApp.tsx').read_text('utf-8')
games_index=(ROOT/'src/pages/games/index.astro').read_text('utf-8')
game_detail=(ROOT/'src/pages/games/[slug].astro').read_text('utf-8')
characters_index=(ROOT/'src/pages/characters/index.astro').read_text('utf-8')
character_detail=(ROOT/'src/pages/characters/[slug].astro').read_text('utf-8')
lore_index=(ROOT/'src/pages/lore/index.astro').read_text('utf-8')
lore_detail=(ROOT/'src/pages/lore/[slug].astro').read_text('utf-8')
location_detail=(ROOT/'src/pages/locations/[slug].astro').read_text('utf-8')
css=(ROOT/'src/styles/global.css').read_text('utf-8')

check('ui:visual-component', '<img' in visual_component and 'loading={priority ?' in visual_component and 'decoding="async"' in visual_component, 'VisualAsset loading/decoding missing')
check('ui:bilingual-alt', 'data-alt-zh' in visual_component and 'data-alt-en' in visual_component and 'rla-language-change' in visual_component, 'VisualAsset alt text does not follow language')
check('reader:real-images', 'block.asset.src' in reader and '<img src={block.asset.src}' in reader and 'loading="lazy"' in reader and 'decoding="async"' in reader, 'reader real-image renderer missing')
check('reader:placeholder-fallback', 'MEMORY / VISUAL PLACEHOLDER' in reader, 'placeholder fallback removed')
check('ui:games-index', 'VisualAsset' in games_index and 'game.heroAsset' in games_index, 'game cards do not render hero art')
check('ui:game-detail', 'VisualAsset' in game_detail and 'game.heroAsset' in game_detail, 'game detail hero missing')
check('ui:character-index', 'VisualAsset' in characters_index and 'item.heroAsset' in characters_index, 'character cards do not render hero art')
check('ui:character-detail', 'VisualAsset' in character_detail and 'entity.heroAsset' in character_detail, 'character detail hero missing')
check('ui:lore-index', 'VisualAsset' in lore_index and 'item.heroAsset' in lore_index, 'concept cards do not render hero art')
check('ui:lore-detail', 'VisualAsset' in lore_detail and 'entity.heroAsset' in lore_detail, 'concept detail hero missing')
check('ui:location-detail', 'VisualAsset' in location_detail and 'entity.heroAsset' in location_detail, 'location detail hero missing')
check('ui:responsive-css', all(x in css for x in ['visual-asset','story-visual','detail-hero','@media (max-width: 720px)']), 'responsive visual CSS missing')

all_assets=[]
for item in items:
    if isinstance(item,dict) and item.get('heroAsset'):
        all_assets.append(item['heroAsset'])
    if item.get('kind')=='chapter':
        all_assets.extend(b['asset'] for b in item.get('storyBlocks',[]) if b.get('type')=='image')
new_external=[a.get('src') for a in all_assets if a.get('src') and re.match(r'^https?://',a['src'])]
check('rights:no-external-hotlinks', not new_external, str(new_external))
new_unlicensed=[a for a in all_assets if a.get('assetType')=='official-licensed' or a.get('rights')=='licensed']
check('rights:first-batch-original-only', not new_unlicensed, str(new_unlicensed))

pkg=json.loads((ROOT/'package.json').read_text('utf-8'))
check('package:version', pkg.get('version')=='0.10.0', pkg.get('version'))
check('package:step10', 'qa:step10' in pkg.get('scripts',{}) and 'qa:step10' in pkg.get('scripts',{}).get('test',''), 'Step10 QA not wired into full test')
check('docs:step10', (ROOT/'docs/step10/README.md').exists(), 'Step10 docs missing')

print(f'Step10 QA: {sum(ok for _,ok,_ in checks)}/{len(checks)} checks passed')
for name,ok,detail in checks:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" — {detail}" if detail and not ok else ''))
if errors:
    print('\nProblems:')
    for error in errors:
        print('-',error)
    sys.exit(1)
