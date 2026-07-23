"""Rebuild the 2021 subject-87 PYQ data from the published NTA final key.

The bundled question paper exposes NTA question and option IDs.  It also
contains a publisher's ``Correct Answer`` labels, which this importer never
uses: only the NTA key is authoritative for scored data.
"""

from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

import fitz
from pypdf import PdfReader


WORKSPACE = Path(__file__).resolve().parents[1]
APP = WORKSPACE / "netcracker_ai_pwa"
PAPER = APP / "data/papers/2021-combined-cs.pdf"
KEY_SOURCE = WORKSPACE / "tmp/pdfs/official-keys/ugc-net-dec2020-june2021-final-key.pdf"
KEY_COPY = APP / "data/answer-keys/ugc-net-dec2020-june2021-final-key.pdf"
OUT = APP / "data/interactive-pyqs-2021.js"
EVIDENCE = APP / "data/answer-keys/2021-dec2020-june2021.json"


def official_rows() -> dict[str, list[str] | None]:
    text = "\n".join(page.extract_text() or "" for page in PdfReader(str(KEY_SOURCE)).pages)
    starts = list(re.finditer(r"Subject\s*:\s*\(\d+\)", text))
    target = next(i for i, match in enumerate(starts) if "(087)" in match.group())
    section = text[starts[target].start():starts[target + 1].start()]
    rows = re.findall(r"(?m)^\s*(\d+)\s+(\d+(?:\s*,\s*\d+)?|[%&])\s*$", section)
    result: dict[str, list[str] | None] = {}
    for question_id, answer in rows:
        # '%' awards marks to all candidates and '&' removes a question from
        # evaluation.  Both are excluded from scoring rather than guessed.
        result[question_id] = None if answer in {"%", "&"} else re.findall(r"\d+", answer)
    if len(result) != 150:
        raise ValueError(f"Expected 150 NTA subject-87 rows, found {len(result)}")
    return result


def source_rows() -> dict[str, dict]:
    doc = fitz.open(PAPER)
    pages: list[str] = []
    locations: dict[str, int] = {}
    for page_number, page in enumerate(doc, start=1):
        page_text = page.get_text()
        pages.append(page_text)
        for question_id in re.findall(r"\[Question ID\s*=\s*(\d+)\]", page_text):
            locations.setdefault(question_id, page_number)
    text = "\n".join(pages)
    matches = list(re.finditer(r"\[Question ID\s*=\s*(\d+)\]", text))
    result: dict[str, dict] = {}
    for position, match in enumerate(matches):
        question_id = match.group(1)
        end = matches[position + 1].start() if position + 1 < len(matches) else len(text)
        option_ids = re.findall(r"\[Option ID\s*=\s*(\d+)\]", text[match.end():end])[:4]
        if len(option_ids) != 4:
            raise ValueError(f"{question_id}: expected four source option IDs, found {option_ids}")
        result[question_id] = {"optionIds": option_ids, "sourcePage": locations[question_id]}
    if len(result) != 150:
        raise ValueError(f"Expected 150 source questions, found {len(result)}")
    return result


def main() -> None:
    key = official_rows()
    source = source_rows()
    if set(key) != set(source):
        raise ValueError("Official key and source question IDs do not match exactly")
    questions: list[dict] = []
    evidence: dict[str, dict] = {}
    for ordinal, (question_id, info) in enumerate(source.items(), start=1):
        answer_ids = key[question_id]
        dropped = answer_ids is None
        indexes = [] if dropped else [info["optionIds"].index(option_id) for option_id in answer_ids]
        paper = 1 if ordinal <= 50 else 2
        evidence[question_id] = {
            "questionOptionIds": info["optionIds"],
            "correctOptionIds": answer_ids,
            "correctOptionIndexes": indexes,
            "dropped": dropped,
        }
        questions.append({
            "id": f"official-2021-{question_id}", "paper": paper, "unit": 0,
            "question": f"UGC-NET December 2020 / June 2021, Question ID {question_id}. Open the exact local source page to read the full question and numbered options.",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "answer": indexes[0] if indexes else 0, "answers": indexes, "dropped": dropped,
            "explanation": "Marks awarded to all / question excluded in the NTA final key." if dropped else "Answer mapped from the official NTA final key.",
            "difficulty": "official", "topic": "Official UGC-NET 2021 PYQ",
            "source": "NTA UGC-NET December 2020 & June 2021 question paper",
            "sourceUrl": "https://ugcnet.nta.nic.in/document/national-testing-agency-ugc-net-december-2020-june-2021-final-answer-keys/",
            "examCycle": "December 2020 / June 2021 cycle", "year": 2021,
            "questionId": question_id, "questionNumber": ordinal, "sourcePage": info["sourcePage"],
            "sourceImage": f"data/question-images/2021-question-page-{info['sourcePage']:03d}.png",
            "isPyq": True, "verified": True,
            "answerVerification": "Official NTA final answer key; option-ID mapping",
            "importMethod": "Exact source-page image with official answer-key option-ID mapping",
        })
    KEY_COPY.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(KEY_SOURCE, KEY_COPY)
    EVIDENCE.write_text(json.dumps({
        "metadata": {"authority": "National Testing Agency", "examCycle": "UGC-NET December 2020 & June 2021", "subject": "087 - Computer Science & Applications", "officialSource": "https://ugcnet.nta.nic.in/document/national-testing-agency-ugc-net-december-2020-june-2021-final-answer-keys/", "keyFile": KEY_COPY.name},
        "mapping": evidence,
    }, indent=2), encoding="utf-8")
    OUT.write_text("window.NETCRACKER_INTERACTIVE_PYQS_2021=" + json.dumps({"version": "2021.2", "questions": questions}, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"Rebuilt 2021: {len(questions)} questions, {sum(q['dropped'] for q in questions)} excluded, {sum(len(q['answers']) > 1 for q in questions)} multi-correct")


if __name__ == "__main__":
    main()
