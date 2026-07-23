#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,collections,sys
ROOT=Path(__file__).resolve().parents[1]
EXPECTED={2015:(60,125,185),2016:(60,125,185),2017:(50,125,175),2018:(50,100,150),2019:(50,100,150),2020:(50,100,150),2021:(50,100,150),2022:(50,100,150),2023:(50,100,150),2024:(50,100,150)}
errors=[]

def fail(msg): errors.append(msg)
def parse_assignment(path):
    s=path.read_text(encoding='utf-8').strip(); pos=s.find('=')
    if pos<0: raise ValueError(f'No assignment in {path}')
    return json.loads(s[pos+1:].strip().rstrip(';'))

# No shipped paper/archive files or raster question pages.
for p in ROOT.rglob('*'):
    if p.is_file() and p.suffix.lower()=='.pdf': fail(f'PDF remains: {p.relative_to(ROOT)}')
    if p.is_file() and p.suffix.lower() in {'.jpg','.jpeg','.webp','.gif','.bmp','.tif','.tiff'}: fail(f'Raster content remains: {p.relative_to(ROOT)}')
    if p.is_file() and p.suffix.lower()=='.png' and p.parent.name!='icons': fail(f'Non-icon PNG remains: {p.relative_to(ROOT)}')
for forbidden in ['data/papers','data/answer-keys','data/question-images','data/pyq-papers.js','data/interactive-pyqs.js']:
    if (ROOT/forbidden).exists(): fail(f'Forbidden legacy dependency remains: {forbidden}')

allq=[]; ids=set(); scoreable=0; vectors=0; advisory=0
for year,(ep1,ep2,etotal) in EXPECTED.items():
    path=ROOT/'data'/f'interactive-pyqs-{year}.js'
    if not path.exists(): fail(f'Missing {path.name}'); continue
    data=parse_assignment(path); qs=data.get('questions',[])
    c=collections.Counter(q.get('paper') for q in qs)
    if (c[1],c[2],len(qs))!=(ep1,ep2,etotal): fail(f'{year} counts are {(c[1],c[2],len(qs))}, expected {(ep1,ep2,etotal)}')
    qnums={1:[],2:[]}
    for q in qs:
        qid=q.get('id')
        if not qid: fail(f'{year}: missing id')
        elif qid in ids: fail(f'Duplicate id: {qid}')
        ids.add(qid); allq.append(q)
        if not str(q.get('question','')).strip(): fail(f'{qid}: blank question')
        opts=q.get('options')
        if not isinstance(opts,list) or len(opts)!=4: fail(f'{qid}: must have exactly four options')
        active=q.get('scored',True) is not False and not q.get('dropped',False)
        ans=q.get('answers') if isinstance(q.get('answers'),list) and q.get('answers') else [q.get('answer')]
        if active:
            scoreable+=1
            if not ans or any(not isinstance(a,int) or a<0 or a>3 for a in ans): fail(f'{qid}: invalid answer mapping {ans}')
        if q.get('paper') not in (1,2): fail(f'{qid}: invalid normalized paper {q.get("paper")}')
        if year<=2017 and q.get('paper')==2 and q.get('legacyPaper') not in (2,3): fail(f'{qid}: missing legacy Paper II/III identity')
        svgs=[]
        for key in ('sourceVectorSvgs','optionVectorSvgs'):
            v=q.get(key); svgs.extend(v if isinstance(v,list) else ([v] if v else []))
        if q.get('stemVectorSvg'): svgs.append(q['stemVectorSvg'])
        if svgs: vectors+=1
        st=str(q.get('transcriptionStatus',''))
        if 'vector' in st or q.get('hasExactVectorReconstruction'): advisory+=1
        if 'vector' in st and not svgs: fail(f'{qid}: vector-primary record has no SVG')
        for svg in svgs:
            low=str(svg).lower()
            if not low.startswith('<svg'): fail(f'{qid}: invalid SVG root')
            if any(x in low for x in ('<image','data:image','<script','foreignobject','onload=','onclick=','javascript:')): fail(f'{qid}: unsafe or raster-bearing SVG')
        raw=json.dumps(q,ensure_ascii=False).lower()
        if 'question-images/' in raw or 'sourceimage' in raw: fail(f'{qid}: page-image reference remains')
        if '.pdf' in raw: fail(f'{qid}: direct PDF reference remains')
        if active and any(x in raw for x in ('open source page','refer to source image','see source page')): fail(f'{qid}: old image placeholder remains')

if len(allq)!=1595: fail(f'Question archive has {len(allq)}, expected 1595')
if scoreable!=1572: fail(f'Scoreable archive has {scoreable}, expected 1572')
if vectors<600: fail(f'Expected extensive SVG recovery, found only {vectors}')
# Explicit regression checks.
q2020={q['id']:q for q in allq if q.get('year')==2020}
if 'official-2020-35' not in q2020 or q2020['official-2020-35'].get('answer')!=3: fail('Restored 2020 Paper 1 Q35 missing or wrong')
if any(q.get('questionNumber',0)>100 for q in q2020.values()): fail('Corrupt 2020 oversized question number remains')
q2021=[q for q in allq if q.get('year')==2021]
if collections.Counter(q['paper'] for q in q2021)!={1:50,2:100}: fail('2021 current-paper normalization failed')
active2021=[q for q in q2021 if q.get('scored',True) is not False and not q.get('dropped')]
if len(active2021)!=143 or sum(bool(q.get('dropped')) for q in q2021)!=7: fail('2021 official dropped-question mapping failed')
if len(set(q.get('answer') for q in active2021))<4: fail('2021 answer distribution is implausibly collapsed')
if sum(len(q.get('answers',[]))>1 for q in active2021)!=2: fail('2021 multi-correct exceptions were not retained')
if next(q for q in q2021 if q.get('questionNumber')==1).get('answer')!=3: fail('2021 Q1 answer-key regression: expected Option D')
if next(q for q in q2021 if q.get('questionId')=='2393').get('answer')!=3: fail('2021 Question ID 2393 final-key mapping must be Option D')
repairs={
 'official-2015-p3-21':2,
 'official-2016-p3-74':2,
 'official-2017-p3-39':2,
 'official-2018-p2-59':1,
}
byid={q['id']:q for q in allq}
for qid,answer in repairs.items():
    q=byid.get(qid)
    if not q or q.get('answer')!=answer or len(q.get('optionVectorSvgs') or [])!=4 or len(q.get('optionAlt') or [])!=4:
        fail(f'{qid}: semantic SVG repair regression')

# Bundle must not claim its curated seed questions are official PYQs.
pyq_index=parse_assignment(ROOT/'data/pyq-index.js')
if pyq_index.get('mappedTotal')!=1595 or pyq_index.get('scoreableTotal')!=1572: fail('PYQ lazy-load index totals are stale')
json_index=json.loads((ROOT/'data'/'pyq-index.json').read_text(encoding='utf-8'))
if json_index!=pyq_index: fail('JS and JSON question indexes differ')
bundle=parse_assignment(ROOT/'data/bundle.js')
if any(q.get('isPyq') for q in bundle['questions']): fail('Curated bundle questions are still mislabeled as official PYQs')
if '.pdf' in json.dumps(bundle).lower(): fail('Bundle retains a PDF URL/dependency')

# Runtime/index/service-worker references.
index=(ROOT/'index.html').read_text(encoding='utf-8')
for bad in ('pyq-papers.js','interactive-pyqs.js','question-images/','data/papers/'):
    if bad in index: fail(f'index.html references removed asset: {bad}')
if re.search(r'<script[^>]+interactive-pyqs-20\d{2}',index): fail('Year archives are eagerly loaded in index.html')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
if any(x in sw for x in ('.pdf','question-images','pyq-papers.js','interactive-pyqs.js')): fail('Service worker caches a removed PDF/image/legacy asset')
assets=re.findall(r"'\./([^']+)'",sw)
for rel in assets:
    if rel and not (ROOT/rel).exists(): fail(f'Service worker asset missing: {rel}')

# JavaScript syntax.
cp=subprocess.run(['node','--check',str(ROOT/'app.js')],capture_output=True,text=True)
if cp.returncode: fail('app.js syntax error: '+cp.stderr.strip())
cp=subprocess.run(['node','--check',str(ROOT/'sw.js')],capture_output=True,text=True)
if cp.returncode: fail('sw.js syntax error: '+cp.stderr.strip())

if errors:
    print('VALIDATION FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('VALIDATION PASSED')
print(json.dumps({'mapped_questions':len(allq),'scoreable_questions':scoreable,'vector_backed_records':vectors,'vector_or_advisory_records':advisory,'years':len(EXPECTED)},indent=2))
