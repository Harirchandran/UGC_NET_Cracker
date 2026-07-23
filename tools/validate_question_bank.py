#!/usr/bin/env python3
from collections import Counter
import json,sys
from question_bank_lib import ROOT,archives,parse_assignment,validate_question,is_scoreable,svg_values

errors=[]; ids=set(); summary={}; total=scoreable=vectors=0
for year,path in archives():
    _,data=parse_assignment(path); qs=data.get('questions',[]); counts=Counter(q.get('paper') for q in qs)
    for q in qs:
        errors.extend(validate_question(q,year))
        if q.get('id') in ids: errors.append(f'duplicate id: {q.get("id")}')
        ids.add(q.get('id')); total+=1; scoreable+=is_scoreable(q); vectors+=bool(svg_values(q))
    summary[year]={'total':len(qs),'paper1':counts[1],'paper2':counts[2],'scoreable':sum(is_scoreable(q) for q in qs),'visual':sum(bool(svg_values(q)) for q in qs)}
_,idx=parse_assignment(ROOT/'data'/'pyq-index.js')
if idx.get('mappedTotal')!=total: errors.append(f'index mappedTotal {idx.get("mappedTotal")} != {total}')
if idx.get('scoreableTotal')!=scoreable: errors.append(f'index scoreableTotal {idx.get("scoreableTotal")} != {scoreable}')
for year,meta in summary.items():
    indexed=idx.get('years',{}).get(str(year),{})
    for key in ('total','paper1','paper2','scoreable'):
        if indexed.get(key)!=meta[key]: errors.append(f'{year} index {key} {indexed.get(key)} != {meta[key]}')
if errors:
    print('QUESTION BANK VALIDATION FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('QUESTION BANK VALIDATION PASSED')
print(json.dumps({'mapped':total,'scoreable':scoreable,'visualRecords':vectors,'years':summary},indent=2))
