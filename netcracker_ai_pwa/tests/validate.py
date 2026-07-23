import json,re,subprocess,sys,threading,time,urllib.request
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
ROOT=Path(__file__).resolve().parents[1]
errors=[]

def check(cond,msg):
    if not cond: errors.append(msg)

# Parse datasets
sy=json.loads((ROOT/'data/syllabus.json').read_text(encoding='utf-8'))
qs=json.loads((ROOT/'data/questions.json').read_text(encoding='utf-8'))
co=json.loads((ROOT/'data/cutoffs.json').read_text(encoding='utf-8'))
paper_files=sorted((ROOT/'data/papers').glob('*.pdf'))
question_images=sorted((ROOT/'data/question-images').glob('2024-question-page-*.png'))
check(len(sy['papers'])==2,'Expected two papers')
check([len(p['units']) for p in sy['papers']]==[10,10],'Expected 10 units per paper')
check(sum(len(u['topics']) for p in sy['papers'] for u in p['units'])>=136,'Expected at least 136 topic nodes')
check(len(qs)>=200,'Expected at least 200 questions including PYQs')
check(sum(q['paper']==1 for q in qs)>=55,'Expected Paper 1 questions')
check(sum(q['paper']==2 for q in qs)>=120,'Expected Paper 2 questions')
check(sum(q.get('isPyq',False) for q in qs)>=50,'Expected at least 50 official PYQs')
check(len({q['id'] for q in qs})==len(qs),'Question IDs must be unique')
for q in qs:
    check(len(q['options'])==4,f"{q['id']} must have four options")
    check(0<=q['answer']<len(q['options']),f"{q['id']} has invalid answer index")
    check(bool(q['explanation'].strip()),f"{q['id']} needs an explanation")
check(co['categories']['UNRESERVED']['jrf']==192,'Cutoff snapshot mismatch')
check(len(paper_files)==17,'Expected 17 bundled previous-year paper PDFs')
for paper in paper_files:
    check(paper.stat().st_size>10_000,f'Paper PDF is unexpectedly small: {paper.name}')
    check(paper.read_bytes()[:5]==b'%PDF-',f'Paper is not a PDF: {paper.name}')
check(len(question_images)==16,'Expected 16 exact-source visual fallbacks for 2024')
for image in question_images:
    check(image.stat().st_size>1_000,f'Question image is unexpectedly small: {image.name}')

# Strict dataset remediation checks
import glob
# The generic interactive-pyqs.js is a retired compatibility dataset.  The
# per-year files are the auditable imports used by the application.
pyq_files = sorted((ROOT/'data').glob('interactive-pyqs-20*.js'))
total_pyqs = 0
for pf in pyq_files:
    data = json.loads(re.search(r'=\s*(\{.*\});?\s*$', pf.read_text(encoding='utf-8'), re.DOTALL).group(1))
    pqs = data.get('questions', [])
    total_pyqs += len(pqs)
    non_dropped = [q for q in pqs if not q.get('dropped', False)]
    ans_counts = {a: sum(q['answer'] == a for q in non_dropped) for a in range(4)}
    max_single_opt = max(ans_counts.values()) if non_dropped else 0
    check(max_single_opt < len(non_dropped) * 0.85, f"Suspicious single-option dominance in {pf.name}: {ans_counts}")

p3_count = sum(q.get('paper') == 3 for pf in pyq_files for q in json.loads(re.search(r'=\s*(\{.*\});?\s*$', pf.read_text(encoding='utf-8'), re.DOTALL).group(1)).get('questions', []))
check(p3_count == 225, f"Expected 225 Paper 3 questions across 2015-2017, found {p3_count}")

manifest_data = json.loads((ROOT/'data/pyq-import-status.json').read_text(encoding='utf-8'))
check(len(manifest_data) == 17, 'Expected one audit record per bundled source PDF')
check(sum(entry['sourceQuestions'] for entry in manifest_data) == 1595, 'Source-question total must remain 1,595')
check({entry['year'] for entry in manifest_data if entry['interactiveStatus'] == 'certified'} == {2019, 2021, 2022, 2023, 2024}, 'Certified-year audit mismatch')

# References and service worker assets
html=(ROOT/'index.html').read_text(encoding='utf-8')
for ref in re.findall(r'(?:src|href)="([^"]+)"',html):
    if ref.startswith(('http:','https:','#')): continue
    check((ROOT/ref).exists(),f'Missing HTML asset: {ref}')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
for ref in re.findall(r"'\./([^']+)'",sw):
    if ref=='': continue
    check((ROOT/ref).exists(),f'Missing service-worker asset: {ref}')
manifest=json.loads((ROOT/'manifest.webmanifest').read_text(encoding='utf-8'))
for icon in manifest['icons']:
    check((ROOT/icon['src']).exists(),f"Missing icon {icon['src']}")

# JavaScript syntax and lightweight runtime
pyq_js_files=sorted([str(p.relative_to(ROOT)).replace('\\','/') for p in (ROOT/'data').glob('interactive-pyqs-20*.js')])
all_question_images=sorted((ROOT/'data/question-images').glob('*.png'))
for f in ['app.js','sw.js','data/bundle.js','data/pyq-papers.js','data/lessons.js','tests/runtime_smoke.js'] + pyq_js_files:
    r=subprocess.run(['node','--check',str(ROOT/f)],capture_output=True,text=True)
    check(r.returncode==0,f'JS syntax failed for {f}: {r.stderr}')
r=subprocess.run(['node',str(ROOT/'tests/runtime_smoke.js')],capture_output=True,text=True)
check(r.returncode==0,f'Runtime smoke failed: {r.stdout} {r.stderr}')
print(r.stdout.strip())

# Serve and retrieve every app asset
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),Quiet)
port=server.server_address[1]
old=Path.cwd()
import os
os.chdir(ROOT)
t=threading.Thread(target=server.serve_forever,daemon=True);t.start()
try:
    for path in ['index.html','styles.css','app.js','manifest.webmanifest','sw.js','data/bundle.js','data/pyq-papers.js','data/lessons.js','icons/icon-192.png','icons/icon-512.png']+pyq_js_files+[str(p.relative_to(ROOT)).replace('\\','/') for p in paper_files+all_question_images]:
        with urllib.request.urlopen(f'http://127.0.0.1:{port}/{path}',timeout=5) as resp:
            check(resp.status==200 and len(resp.read())>0,f'HTTP asset failed: {path}')
finally:
    server.shutdown();server.server_close();os.chdir(old)

if errors:
    print('\n'.join('FAIL: '+e for e in errors))
    sys.exit(1)
print('All validation checks passed.')
