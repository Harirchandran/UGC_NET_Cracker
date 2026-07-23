"""Rebuild the October 2022 subject-87 PYQ import from the NTA final key."""

from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

import fitz
from pypdf import PdfReader

WORKSPACE = Path(__file__).resolve().parents[1]
APP = WORKSPACE / "netcracker_ai_pwa"
PAPER = APP / "data/papers/2022-combined-cs.pdf"
KEY_SOURCE = WORKSPACE / "tmp/pdfs/official-keys/ugc-net-merged-2022-final-key.pdf"
KEY_COPY = APP / "data/answer-keys/ugc-net-merged-2022-final-key.pdf"
OUT = APP / "data/interactive-pyqs-2022.js"
EVIDENCE = APP / "data/answer-keys/2022-merged-oct08-shift1.json"


def key_rows() -> dict[str, str | None]:
    text = "\n".join(page.extract_text() or "" for page in PdfReader(str(KEY_SOURCE)).pages)
    marker = "Subject : 087 - COMPUTER SCIENCE N APPLICATIONS"
    start = text.index(marker)
    end = text.index("Exam Date : 08.10.2022 Shift : Second", start)
    section = text[start:end]
    rows = re.findall(r"(?m)^\s*(\d+)\s+(\d+|DROP)\s*$", section)
    result = {question_id: None if answer == "DROP" else answer for question_id, answer in rows}
    if len(result) != 150:
        raise ValueError(f"Expected 150 subject-87 rows, found {len(result)}")
    return result


def source_rows() -> dict[str, dict]:
    doc = fitz.open(PAPER)
    locations: dict[str, int] = {}
    pages: list[str] = []
    for page_number, page in enumerate(doc, start=1):
        page_text = page.get_text()
        pages.append(page_text)
        for question_id in re.findall(r"\[Question ID\s*=\s*(\d+)\]", page_text):
            locations.setdefault(question_id, page_number)
    text = "\n".join(pages)
    matches = list(re.finditer(r"\[Question ID\s*=\s*(\d+)\]", text))
    result: dict[str, dict] = {}
    for index, match in enumerate(matches):
        question_id = match.group(1)
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        option_ids = re.findall(r"\[Option ID\s*=\s*(\d+)\]", text[match.end():end])[:4]
        if len(option_ids) != 4:
            raise ValueError(f"{question_id}: expected 4 option IDs, found {option_ids}")
        result[question_id] = {"optionIds": option_ids, "sourcePage": locations.get(question_id)}
    if len(result) != 150:
        raise ValueError(f"Expected 150 source questions, found {len(result)}")
    return result


def main() -> None:
    if not KEY_SOURCE.exists():
        raise FileNotFoundError(KEY_SOURCE)
    key = key_rows()
    source = source_rows()
    if set(key) != set(source):
        raise ValueError("Key and source question IDs do not match exactly")
    questions: list[dict] = []
    evidence: dict[str, dict] = {}
    for ordinal, (question_id, info) in enumerate(source.items(), start=1):
        correct_option_id = key[question_id]
        dropped = correct_option_id is None
        index = None if dropped else info["optionIds"].index(correct_option_id)
        # NTA's final key identifies these IDs as Paper 2 (316-415) and
        # Paper 1 (516-565), despite the source PDF placing Paper 2 first.
        paper = 1 if question_id.startswith("5") else 2
        evidence[question_id] = {
            "questionOptionIds": info["optionIds"],
            "correctOptionId": correct_option_id,
            "correctOptionIndex": index,
            "dropped": dropped,
        }
        questions.append({
            "id": f"official-2022-{question_id}",
            "paper": paper,
            "unit": 0,
            "question": f"UGC-NET December 2021 / June 2022 merged cycle, Question ID {question_id}. Open the exact local source page to read the full question and numbered options.",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "answer": index if index is not None else 0,
            "answers": [] if index is None else [index],
            "dropped": dropped,
            "explanation": "Dropped by NTA in the final key." if dropped else "Answer mapped from the official NTA final key.",
            "difficulty": "official",
            "topic": "Official UGC-NET 2022 PYQ",
            "source": "NTA UGC-NET December 2021 / June 2022 merged-cycle question paper",
            "sourceUrl": "https://ugcnet.nta.nic.in/document-category/archive/page/3/",
            "examCycle": "December 2021 / June 2022 merged cycle (8 October 2022, Shift 1)",
            "year": 2022,
            "questionId": question_id,
            "questionNumber": ordinal,
            "sourcePage": info["sourcePage"],
            "sourceImage": f"data/question-images/2022-question-page-{info['sourcePage']:03d}.png",
            "isPyq": True,
            "verified": True,
            "answerVerification": "Official NTA final answer key; option-ID mapping",
            "importMethod": "Exact source-page image with official answer-key mapping",
        })
    shutil.copy2(KEY_SOURCE, KEY_COPY)
    EVIDENCE.write_text(json.dumps({
        "metadata": {
            "authority": "National Testing Agency",
            "examCycle": "UGC-NET December 2021 / June 2022 merged cycle, 8 October 2022 Shift 1",
            "subject": "087 - Computer Science and Applications",
            "officialSource": "https://ugcnet.nta.nic.in/document-category/archive/page/3/",
            "keyFile": KEY_COPY.name,
        },
        "mapping": evidence,
    }, indent=2), encoding="utf-8")
    OUT.write_text("window.NETCRACKER_INTERACTIVE_PYQS_2022=" + json.dumps({"version": "2022.2", "questions": questions}, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"Rebuilt 2022: {len(questions)} questions, {sum(q['dropped'] for q in questions)} dropped")


if __name__ == "__main__":
    main()
