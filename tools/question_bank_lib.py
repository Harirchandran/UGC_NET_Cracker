#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[1]
YEAR_RE=re.compile(r'interactive-pyqs-(\d{4})\.js$')
FORBIDDEN_SVG=re.compile(r'<\/?(?:script|image|foreignObject)\b|\son\w+\s*=|javascript:|data:image',re.I)

RASTER_TAG_WITH_SRC_RE=re.compile(r'<(?:img|picture|source|object|embed|iframe)\b[^>]*(?:src|srcset|href|data)\s*=\s*["\'][^"\']*\.(?:png|jpe?g|gif|webp|bmp|tiff?|pdf)\b',re.I)
DATA_IMAGE_RE=re.compile(r'data:image/',re.I)
CSS_URL_RASTER_RE=re.compile(r'url\s*\(\s*["\']?[^"\')]*\.(?:png|jpe?g|gif|webp|bmp|tiff?|pdf)\b',re.I)
RASTER_EXT_HREF_RE=re.compile(r'(?:src|srcset|href)\s*=\s*["\']?[^"\'>\s]*\.(?:png|jpe?g|gif|webp|bmp|tiff?|pdf)\b',re.I)
LOCAL_RASTER_PATH_RE=re.compile(r'["\']?[^"\'>\s]*[/\\][^"\'>\s]*\.(?:png|jpe?g|gif|webp|bmp|tiff?|pdf)\b',re.I)

TEXT_ONLY_FIELDS=('question','passage','explanation','sharedContext','topic','reviewNotes','source','answerVerification','importMethod','contentVerification')

def _strip_svg_tags(text:str)->str:
    text=re.sub(r'<svg[\s\S]*?</svg>','',text,flags=re.I)
    text=re.sub(r'<table[\s\S]*?</table>','',text,flags=re.I)
    return text

def _contains_raster_asset_reference(raw_text:str)->list[str]:
    stripped=_strip_svg_tags(raw_text)
    errors=[]
    if RASTER_TAG_WITH_SRC_RE.search(stripped):
        errors.append('contains HTML element tag with raster/PDF file reference')
    if DATA_IMAGE_RE.search(stripped):
        errors.append('contains embedded raster data URL (data:image/)')
    if CSS_URL_RASTER_RE.search(stripped):
        errors.append('contains CSS url() referencing raster/PDF asset')
    if RASTER_EXT_HREF_RE.search(stripped):
        errors.append('contains src/href attribute referencing raster or PDF file')
    return errors

def parse_assignment(path:Path):
    raw=path.read_text(encoding='utf-8').strip(); pos=raw.find('=')
    if pos<0: raise ValueError(f'No JavaScript assignment in {path}')
    return raw[:pos+1],json.loads(raw[pos+1:].strip().rstrip(';'))

def write_assignment(path:Path,global_name:str,data:dict):
    path.write_text(f'window.{global_name} = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')

def svg_values(q:dict):
    vals=[]
    for key in ('sourceVectorSvgs','optionVectorSvgs'):
        v=q.get(key)
        if isinstance(v,list): vals.extend(x for x in v if x)
        elif v: vals.append(v)
    if q.get('stemVectorSvg'): vals.append(q['stemVectorSvg'])
    return vals

def is_scoreable(q): return q.get('scored',True) is not False and not q.get('dropped',False)

def validate_question(q:dict,expected_year:int|None=None):
    errors=[]; qid=q.get('id','<missing-id>')
    req=('id','paper','question','options','year','questionNumber','examCycle','source','sourceUrl','transcriptionStatus','contentVerification')
    for k in req:
        if q.get(k) in (None,''): errors.append(f'{qid}: missing {k}')
    if expected_year and q.get('year')!=expected_year: errors.append(f'{qid}: year {q.get("year")} != {expected_year}')
    if q.get('paper') not in (1,2): errors.append(f'{qid}: paper must be 1 or 2')
    if not isinstance(q.get('questionNumber'),int) or q['questionNumber']<1: errors.append(f'{qid}: invalid questionNumber')
    opts=q.get('options')
    if not isinstance(opts,list) or len(opts)!=4: errors.append(f'{qid}: exactly four options required')
    elif any(not isinstance(x,str) for x in opts): errors.append(f'{qid}: options must be strings')
    if is_scoreable(q):
        answers=q.get('answers') if isinstance(q.get('answers'),list) and q.get('answers') else [q.get('answer')]
        if any(not isinstance(a,int) or a not in range(4) for a in answers): errors.append(f'{qid}: invalid accepted answer indexes {answers}')
        if not q.get('answerVerification'): errors.append(f'{qid}: answerVerification required for scored item')
    svgs=svg_values(q)
    for svg in svgs:
        if not str(svg).lstrip().startswith('<svg'): errors.append(f'{qid}: visual is not inline SVG')
        if FORBIDDEN_SVG.search(str(svg)): errors.append(f'{qid}: unsafe/raster-bearing SVG')
    if q.get('optionVectorSvgs'):
        if not isinstance(q['optionVectorSvgs'],list) or len(q['optionVectorSvgs'])!=4: errors.append(f'{qid}: optionVectorSvgs must contain four entries')
        if 'semantic-svg' in str(q.get('transcriptionStatus','')) and (not isinstance(q.get('optionAlt'),list) or len(q['optionAlt'])!=4 or any(not str(x).strip() for x in q['optionAlt'])): errors.append(f'{qid}: semantic diagram options require four non-empty optionAlt descriptions')
    st=str(q.get('transcriptionStatus',''))
    if st=='vector-primary' and not svg_values(q):
        errors.append(f'{qid}: transcriptionStatus is vector-primary but no SVG content is present')
    if st=='vector-primary' and q.get('contentVerification','')=='clean-native-text':
        errors.append(f'{qid}: transcriptionStatus is vector-primary but contentVerification indicates clean native text (incompatible)')
    raw=json.dumps(q,ensure_ascii=False).lower()
    for bad in ('question-images/','sourceimage','refer to source image','open source page'):
        if bad in raw: errors.append(f'{qid}: forbidden runtime dependency/text: {bad}')
    for field in TEXT_ONLY_FIELDS:
        val=q.get(field,'')
        if isinstance(val,str) and val:
            refs=_contains_raster_asset_reference(val)
            for r in refs:
                errors.append(f'{qid}: field "{field}" {r}')
    for i,opt in enumerate(q.get('options',[])):
        if isinstance(opt,str):
            refs=_contains_raster_asset_reference(opt)
            for r in refs:
                errors.append(f'{qid}: option[{i}] {r}')
            if '-o0o-' in opt:
                errors.append(f'{qid}: option[{i}] contains extraction delimiter "-o0o-"')
    return errors

def archives(root:Path=ROOT):
    for p in sorted((root/'data').glob('interactive-pyqs-20??.js')):
        m=YEAR_RE.search(p.name)
        if m: yield int(m.group(1)),p
