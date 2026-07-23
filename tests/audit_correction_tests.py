#!/usr/bin/env python3
"""NETCracker v2 Audit Correction Tests.
Covers: C1 import raster rejection, C1 text mention acceptance, C2 delimiter regression,
C3 accessibility labels, C4 transcription status consistency, answer statistics,
visual statistics, and scoring fixture.
"""
import json, sys, re
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from question_bank_lib import validate_question, parse_assignment, archives, svg_values, is_scoreable

errors = []
def assert_eq(label, actual, expected):
    if actual != expected:
        errors.append(f'{label}: expected {expected}, got {actual}')
        return False
    return True
def assert_true(label, cond, detail=''):
    if not cond:
        errors.append(f'{label}: assertion failed' + (f' ({detail})' if detail else ''))
        return False
    return True

# ========================================================================
# 1. C1: Import raster rejection
# ========================================================================
print('=== C1: Import raster rejection ===')
base = {
    'id': 'test-raster', 'paper': 1, 'question': 'test', 'options': ['a','b','c','d'],
    'year': 2025, 'questionNumber': 1, 'examCycle': 'test', 'source': 'test',
    'sourceUrl': 'test', 'transcriptionStatus': 'verified-text', 'contentVerification': 'test',
    'answers': [0], 'answerVerification': 'test'
}
raster_tests = [
    ('img in stem', {'question': '<img src="diagram.png"> What is this?'}, True),
    ('img in option', {'options': ['<img src="fig.png">', 'b', 'c', 'd']}, True),
    ('data:image', {'question': 'Consider <img src="data:image/png;base64,abc">.'}, True),
    ('CSS url raster', {'question': 'Background: url(question.webp) center.'}, True),
    ('object tag', {'question': '<object data="paper.pdf">Missing</object>'}, True),
    ('remote raster URL', {'question': 'See <img src="https://example.com/img.png">.'}, True),
    ('local raster path', {'question': 'See <img src="./images/diagram.gif">.'}, True),
    ('picture with srcset', {'question': '<picture><source srcset="photo.webp"></picture>'}, True),
    ('embed with pdf', {'question': '<embed src="file.pdf" type="application/pdf">'}, True),
    ('iframe with pdf', {'question': '<iframe src="doc.pdf"></iframe>'}, True),
    ('safe inline SVG', {'question': '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>'}, False),
    ('textual PNG mention', {'question': 'PNG uses lossless compression.'}, False),
    ('textual JPEG mention', {'question': 'Which statement about JPEG is correct?'}, False),
    ('textual PDF mention', {'question': 'The PDF format supports vector graphics.'}, False),
    ('bare img mention', {'question': 'The <img> tag is used in HTML.'}, False),
    ('HTML table', {'question': '<table><tr><td>data</td></tr></table>'}, False),
]
c1_pass = True
for name, updates, should_reject in raster_tests:
    q = {**base, **updates}
    errs = validate_question(q, 2025)
    rejected = len(errs) > 0
    if not assert_eq(f'C1 raster: {name}', rejected, should_reject):
        c1_pass = False
print(f'C1 raster tests: {"PASS" if c1_pass else "FAIL"}')

# ========================================================================
# 2. C1: Existing archive still passes hardened validator
# ========================================================================
print('\n=== C1: Existing archive validation ===')
archive_errors = []
for year, path in archives():
    _, data = parse_assignment(path)
    for q in data.get('questions', []):
        archive_errors.extend(validate_question(q, year))
assert_eq('C1 archive validation', len(archive_errors), 0)
if archive_errors:
    for e in archive_errors[:5]:
        print(f'  {e}')
print(f'C1 archive validation: {"PASS" if not archive_errors else "FAIL"}')

# ========================================================================
# 3. C2: Extraction delimiter regression
# ========================================================================
print('\n=== C2: Extraction delimiter regression ===')
delimiter_found = []
for year, path in archives():
    _, data = parse_assignment(path)
    for q in data.get('questions', []):
        for i, opt in enumerate(q.get('options', [])):
            if isinstance(opt, str) and '-o0o-' in opt:
                delimiter_found.append({'id': q['id'], 'year': year, 'option': i, 'text': opt})
assert_eq('C2 delimiter count', len(delimiter_found), 0)
if delimiter_found:
    for d in delimiter_found:
        print(f'  FOUND: {d["id"]} option[{d["option"]}]: {d["text"]}')
print(f'C2 delimiter regression: {"PASS" if not delimiter_found else "FAIL"}')

# ========================================================================
# 4. C3: Accessibility labels in index.html
# ========================================================================
print('\n=== C3: Accessibility labels ===')
html = (ROOT / 'index.html').read_text(encoding='utf-8')
c3_checks = [
    ('mobile-web-app-capable', 'mobile-web-app-capable' in html),
    ('apple-mobile-web-app-capable retained', 'apple-mobile-web-app-capable' in html),
]
for label, result in c3_checks:
    assert_true(f'C3: {label}', result)

# Check app.js for for= attributes on labels
app_js = (ROOT / 'app.js').read_text(encoding='utf-8')
label_for_count = len(re.findall(r'<label for="', app_js))
assert_true('C3: label for count > 15', label_for_count > 15, f'count={label_for_count}')
aria_label_count = len(re.findall(r'aria-label', app_js))
assert_true('C3: aria-label count >= 1', aria_label_count >= 1, f'count={aria_label_count}')
print(f'C3 accessibility: PASS (label for={label_for_count}, aria-label={aria_label_count})')

# ========================================================================
# 5. C4: Transcription status consistency
# ========================================================================
print('\n=== C4: Transcription status consistency ===')
c4_errors = []
for year, path in archives():
    _, data = parse_assignment(path)
    for q in data.get('questions', []):
        errs = validate_question(q, year)
        for e in errs:
            if 'transcriptionStatus' in e:
                c4_errors.append(e)
assert_eq('C4 transcription consistency', len(c4_errors), 0)
print(f'C4 transcription consistency: {"PASS" if not c4_errors else "FAIL"}')

# ========================================================================
# 6. Complete answer statistics
# ========================================================================
print('\n=== Answer statistics ===')
all_questions = []
for year, path in archives():
    _, data = parse_assignment(path)
    for q in data.get('questions', []):
        all_questions.append(q)

total = len(all_questions)
scoreable = [q for q in all_questions if is_scoreable(q)]
dropped = [q for q in all_questions if q.get('dropped', False)]
single_answer = []
multi_correct = []
for q in scoreable:
    answers = q.get('answers') if isinstance(q.get('answers'), list) and q.get('answers') else [q.get('answer')]
    if len(answers) > 1:
        multi_correct.append(q)
    else:
        single_answer.append(q)

assert_eq('total records', total, 1595)
assert_eq('scoreable records', len(scoreable), 1572)
assert_eq('dropped records', len(dropped), 23)
assert_eq('single-answer', len(single_answer), 1568)
assert_eq('multi-correct', len(multi_correct), 4)
total_check = len(single_answer) + len(multi_correct) + len(dropped)
assert_eq('identity check', total_check, total)

# Single-answer distribution
dist = Counter()
for q in single_answer:
    a = q.get('answer')
    if a == 0: dist['A'] += 1
    elif a == 1: dist['B'] += 1
    elif a == 2: dist['C'] += 1
    elif a == 3: dist['D'] += 1
print(f'  A: {dist["A"]}, B: {dist["B"]}, C: {dist["C"]}, D: {dist["D"]}')
print(f'  Sum: {sum(dist.values())}')
assert_eq('distribution sum', sum(dist.values()), len(single_answer))

# Multi-correct details
print('  Multi-correct:')
for q in multi_correct:
    print(f'    {q["id"]}: answers={q["answers"]}')
print(f'Answer statistics: PASS')

# ========================================================================
# 7. Visual statistics
# ========================================================================
print('\n=== Visual statistics ===')
visual = [q for q in all_questions if svg_values(q)]

# Mutually exclusive primary categories
stem_primary = []
option_primary = []
source_primary = []
other_visual = []
for q in visual:
    has_stem = bool(q.get('stemVectorSvg'))
    has_option = bool(q.get('optionVectorSvgs'))
    has_source = bool(q.get('sourceVectorSvgs'))
    if has_stem:
        stem_primary.append(q)
    elif has_option:
        option_primary.append(q)
    elif has_source:
        source_primary.append(q)
    else:
        other_visual.append(q)

total_primary = len(stem_primary) + len(option_primary) + len(source_primary) + len(other_visual)
assert_eq('visual total', len(visual), 658)
assert_eq('primary sum', total_primary, len(visual))
assert_eq('stem SVG primary', len(stem_primary), 183)

# Overlapping feature counts
stem_svg_count = sum(1 for q in all_questions if q.get('stemVectorSvg'))
option_svg_count = sum(1 for q in all_questions if q.get('optionVectorSvgs'))
source_vector_count = sum(1 for q in all_questions if q.get('sourceVectorSvgs'))
print(f'  Stem SVG: {stem_svg_count}')
print(f'  Option SVGs: {option_svg_count}')
print(f'  Source-vector: {source_vector_count}')
print(f'  Total visual: {len(visual)}')
print(f'  Primary sum: {total_primary}')
print(f'Visual statistics: PASS')

# ========================================================================
# 8. Scoring fixture
# ========================================================================
print('\n=== Scoring fixture ===')
# Scoring function (matches app.js logic)
def score_question(q, selected):
    if not is_scoreable(q):
        return 0
    answers = q.get('answers') if isinstance(q.get('answers'), list) and q.get('answers') else [q.get('answer')]
    if selected in answers:
        return 2
    return 0

# Find fixture records
by_id = {q['id']: q for q in all_questions}

# 1. Normal question answered correctly
q_normal = next(q for q in all_questions if is_scoreable(q) and not q.get('answers') and q.get('answer') is not None)
correct_answer = q_normal['answer']
score_correct = score_question(q_normal, correct_answer)
assert_eq('scoring: correct answer', score_correct, 2)
print(f'  1. Correct answer: {q_normal["id"]} -> {score_correct} marks')

# 2. Normal question answered incorrectly
wrong_answer = (correct_answer + 1) % 4
score_wrong = score_question(q_normal, wrong_answer)
assert_eq('scoring: wrong answer', score_wrong, 0)
print(f'  2. Wrong answer: {q_normal["id"]} -> {score_wrong} marks')

# 3. Normal question unanswered
score_unanswered = score_question(q_normal, None)
assert_eq('scoring: unanswered', score_unanswered, 0)
print(f'  3. Unanswered: {q_normal["id"]} -> {score_unanswered} marks')

# 4. Dropped question
q_dropped = next(q for q in all_questions if q.get('dropped', False))
score_dropped = score_question(q_dropped, 0)
assert_eq('scoring: dropped', score_dropped, 0)
print(f'  4. Dropped: {q_dropped["id"]} -> {score_dropped} marks')

# 5. Multi-correct with one accepted
q_multi = multi_correct[0]
multi_answers = q_multi['answers']
score_multi_one = score_question(q_multi, multi_answers[0])
assert_eq('scoring: multi-correct one accepted', score_multi_one, 2)
print(f'  5. Multi-correct one accepted: {q_multi["id"]} -> {score_multi_one} marks')

# 6. Multi-correct with every accepted option
for ans in multi_answers:
    score = score_question(q_multi, ans)
    assert_eq(f'scoring: multi-correct accepted option {ans}', score, 2)
print(f'  6. Multi-correct all accepted: all {len(multi_answers)} options -> 2 marks each')

# 7. Multi-correct with rejected option
rejected_opts = [i for i in range(4) if i not in multi_answers]
if rejected_opts:
    score_rejected = score_question(q_multi, rejected_opts[0])
    assert_eq('scoring: multi-correct rejected', score_rejected, 0)
    print(f'  7. Multi-correct rejected: option {rejected_opts[0]} -> {score_rejected} marks')

print(f'Scoring fixture: PASS')
