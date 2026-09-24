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
relations = [r for o in items if o['kind']=='relationSet' for r in o['relations']]
types = {r['from']['type'] for r in relations} | {r['to']['type'] for r in relations}

check('relations:nontrivial-network', len(relations) >= 19, str(len(relations)))
check('relations:expected-node-types', {'game','character','concept','location','event'}.issubset(types), str(sorted(types)))
check('relations:cross-game-still-present', any(r['from']=={'type':'game','id':'the-lake'} and r['type']=='references' and r['to']=={'type':'game','id':'seasons'} for r in relations), 'The Lake -> Seasons relation missing')
check('relations:gated-edge-present', any(r['spoiler']['requiredCompletedGameIds']==['the-lake'] for r in relations), 'no real The Lake gated relation')

loader = (ROOT/'src/lib/content.ts').read_text('utf-8')
models = (ROOT/'src/lib/models.ts').read_text('utf-8')
network = (ROOT/'src/components/LoreNetwork.tsx').read_text('utf-8')
related = (ROOT/'src/components/RelatedArchive.tsx').read_text('utf-8')
entries = (ROOT/'src/components/DossierEntries.tsx').read_text('utf-8')
layout = (ROOT/'src/layouts/BaseLayout.astro').read_text('utf-8')
css = (ROOT/'src/styles/global.css').read_text('utf-8')
network_page = (ROOT/'src/pages/network.astro').read_text('utf-8')
character_page = (ROOT/'src/pages/characters/[slug].astro').read_text('utf-8')
lore_page = (ROOT/'src/pages/lore/[slug].astro').read_text('utf-8')
game_page = (ROOT/'src/pages/games/[slug].astro').read_text('utf-8')
location_page = (ROOT/'src/pages/locations/[slug].astro').read_text('utf-8')

check('loader:relation-api', all(x in loader for x in ['getRelationSets','getRelations','getRelationsForRef']), 'relation loader helpers missing')
check('loader:locations', 'getLocations' in loader and '/locations/' in loader, 'location loader/route missing')
check('models:relation-types', 'RelationData' in models and 'RelationSetData' in models and 'RelationType' in models, 'relation TypeScript models missing')
check('network:route', 'LoreNetwork client:load' in network_page and 'getRelations()' in network_page, 'network route is not data-driven')
check('network:spoiler-aware', 'canView' in network and 'rla-progress-v1' in network and 'requiredCompletedGameIds' not in network, 'network must use shared canView instead of bespoke spoiler logic')
check('network:manual-reveal-aware', 'rla-manual-reveals-v1' in network, 'network does not consume manual reveal state')
check('network:focus-query', "get('focus')" in network and 'setSelected(focus)' in network, 'focus query support missing')
check('network:filters', 'relationType' in network and '搜索档案' in network and '全部关系' in network, 'network search/filter controls missing')
check('network:source-labels', "'SOURCE'" in network and "'来源'" in network and 'sourceIds.join' in network, 'relation provenance not surfaced bilingually')
check('network:responsive', 'network-scroll' in css and '@media (max-width: 760px)' in css, 'mobile network fallback missing')
check('nav:network', "['network', '/network', '关系网', 'Network']" in layout, 'network missing from bilingual navigation')

check('reverse:character', 'RelatedArchive client:load' in character_page and 'getRelationsForRef' in character_page, 'character reverse links missing')
check('reverse:lore', 'RelatedArchive client:load' in lore_page and 'getRelationsForRef' in lore_page, 'lore reverse links missing')
check('reverse:game', 'RelatedArchive client:load' in game_page and 'getRelationsForRef' in game_page, 'game reverse links missing')
check('reverse:location', 'RelatedArchive client:load' in location_page and 'getRelationsForRef' in location_page, 'location reverse links missing')
check('reverse:gated-relations', 'canView' in related and 'rla-progress-v1' in related, 'reverse relations bypass spoiler progress')

check('dossier:client-gating', 'canView' in entries and 'rla-progress-v1' in entries and 'rla-manual-reveals-v1' in entries, 'full dossier spoiler gate missing')
check('dossier:no-static-entry-leak-character', 'entity.entries.map' not in character_page and 'DossierEntries client:load' in character_page, 'character page still statically renders entries')
check('dossier:no-static-entry-leak-lore', 'entity.entries.map' not in lore_page and 'DossierEntries client:load' in lore_page, 'lore page still statically renders entries')
check('dossier:location-route', 'getStaticPaths' in location_page and 'getLocations()' in location_page, 'location detail route missing')

pkg = json.loads((ROOT/'package.json').read_text('utf-8'))
try:
    major, minor = [int(x) for x in pkg.get('version','0.0.0').split('.')[:2]]
except (TypeError, ValueError):
    major, minor = (0, 0)
check('package:step07', (major, minor) >= (0, 7) and 'qa:step07' in pkg.get('scripts',{}) and 'qa:step07' in pkg.get('scripts',{}).get('test',''), 'Step07 package script/version missing')
check('docs:step07', (ROOT/'docs/step07/README.md').exists(), 'Step07 notes missing')

print(f'Step07 QA: {sum(ok for _,ok,_ in checks)}/{len(checks)} checks passed')
for name,ok,detail in checks:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" — {detail}" if detail and not ok else ''))
if errors:
    print('\nProblems:')
    for error in errors:
        print('-', error)
    sys.exit(1)
