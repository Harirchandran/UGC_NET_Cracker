#!/usr/bin/env python3
"""Publish a reviewed canonical JSON year file into the offline PWA.
Usage: python tools/import_year.py staging/2025-reviewed.json
The source JSON is intentionally separate from PDFs/OCR; only reviewed structured records are published.
"""
from pathlib import Path
import json,subprocess,sys
from question_bank_lib import ROOT,validate_question,write_assignment
if len(sys.argv)!=2: raise SystemExit('Usage: python tools/import_year.py <reviewed-year.json>')
src=Path(sys.argv[1]); data=json.loads(src.read_text(encoding='utf-8')); year=int(data['year']); qs=data.get('questions',[])
errors=[]
for q in qs:
    q.setdefault('year',year);errors.extend(validate_question(q,year))
ids=[q.get('id') for q in qs]
if len(ids)!=len(set(ids)): errors.append('duplicate IDs inside import')
if errors:
    print('IMPORT REJECTED');[print('-',e) for e in errors];raise SystemExit(1)
out={'version':data.get('version',f'{year}.reviewed.1'),'schemaVersion':'1.0','questions':qs}
write_assignment(ROOT/'data'/f'interactive-pyqs-{year}.js',f'NETCRACKER_INTERACTIVE_PYQS_{year}',out)
subprocess.run([sys.executable,str(ROOT/'tools'/'build_archive_index.py')],check=True)
subprocess.run([sys.executable,str(ROOT/'tools'/'validate_question_bank.py')],check=True)
print(f'Published {len(qs)} reviewed questions for {year}. The generated JSON index lets the service worker discover the new year automatically.')
