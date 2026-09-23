import json, subprocess, sys, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

class ContentTests(unittest.TestCase):
    def test_validator(self):
        p=subprocess.run([sys.executable,str(ROOT/'tools/validate_content.py')],cwd=ROOT,text=True,capture_output=True)
        self.assertEqual(p.returncode,0,p.stdout+p.stderr)

    def test_reader_view_build(self):
        p=subprocess.run([sys.executable,str(ROOT/'tools/build_reader_view.py')],cwd=ROOT,text=True,capture_output=True)
        self.assertEqual(p.returncode,0,p.stdout+p.stderr)
        view=json.loads((ROOT/'generated/seasons-spring-1964.reader.json').read_text(encoding='utf-8'))
        self.assertEqual(view['route'],'/read/seasons/spring-1964')
        self.assertEqual(len(view['chapterNav']),5)
        ids={(x['type'],x['id']) for x in view['caseNotes']}
        self.assertIn(('character','laura-vanderboom'),ids)
        self.assertIn(('character','harvey'),ids)
        self.assertIn(('concept','memory'),ids)
        self.assertIn(('location','lauras-room'),ids)

    def test_cross_game_spoiler_demo(self):
        laura=json.loads((ROOT/'content/characters/laura-vanderboom.json').read_text(encoding='utf-8'))
        locked=[e for e in laura['entries'] if e['id']=='laura-cross-game-demo-lock'][0]
        self.assertEqual(locked['spoiler']['requiredCompletedGameIds'],['the-mill'])
        self.assertTrue(locked['spoiler']['allowManualReveal'])

    def test_final_has_no_fake_date(self):
        final=json.loads((ROOT/'content/chapters/seasons/final.json').read_text(encoding='utf-8'))
        self.assertIsNone(final['timeline'])

if __name__=='__main__': unittest.main()
