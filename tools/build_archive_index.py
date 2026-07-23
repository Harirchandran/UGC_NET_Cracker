#!/usr/bin/env python3
from collections import Counter
from question_bank_lib import ROOT,archives,parse_assignment,is_scoreable,svg_values,write_assignment

years={}; mapped=scoreable=0
for year,path in archives():
    _,data=parse_assignment(path); qs=data.get('questions',[]); c=Counter(q.get('paper') for q in qs)
    vectors=sum(bool(svg_values(q)) for q in qs)
    advisory=sum(bool('vector' in str(q.get('transcriptionStatus','')) or q.get('hasExactVectorReconstruction')) for q in qs)
    active=sum(is_scoreable(q) for q in qs)
    years[str(year)]={'file':f'data/{path.name}','total':len(qs),'scoreable':active,'paper1':c[1],'paper2':c[2],'vectors':vectors,'advisory':advisory,'legacy':year<=2017}
    mapped+=len(qs);scoreable+=active
index={'version':'4.0','schemaVersion':'1.0','years':years,'mappedTotal':mapped,'scoreableTotal':scoreable}
write_assignment(ROOT/'data'/'pyq-index.js','NETCRACKER_PYQ_INDEX',index)
json_mod=__import__('json')
(ROOT/'data'/'pyq-index.json').write_text(json_mod.dumps(index,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
status={'version':'4.0','policy':'Offline structured text and safe inline SVG only; answer verification and content verification are tracked separately.','mappedTotal':mapped,'scoreableTotal':scoreable,'nonScoreableTotal':mapped-scoreable,'years':years}
(ROOT/'data'/'pyq-import-status.json').write_text(json_mod.dumps(status,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print({'mappedTotal':mapped,'scoreableTotal':scoreable,'years':len(years)})
