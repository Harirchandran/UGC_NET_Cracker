"""Rebuild the March 2023 (December 2022 cycle) PYQ data from NTA evidence.

The question paper supplies QBIDs and the displayed option IDs.  The official
NTA final key supplies QBID -> correct option ID(s).  This script joins those
two sources and fails closed on any missing mapping.
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
PAPER = APP / "data/papers/2023-combined-cs.pdf"
KEY_SOURCE = WORKSPACE / "tmp/pdfs/official-keys/ugc-net-dec-2022-final-key.pdf"
KEY_COPY = APP / "data/answer-keys/ugc-net-dec-2022-final-key.pdf"
OUT = APP / "data/interactive-pyqs-2023.js"
EVIDENCE = APP / "data/answer-keys/2023-dec2022-march11-shift2.json"


def parse_official_key() -> dict[str, list[str] | None]:
    text = "\n".join(page.extract_text() or "" for page in PdfReader(str(KEY_SOURCE)).pages)
    marker = "Subject : (087 )Computer Science and Applications"
    start = text.index(marker)
    end = text.index("Exam Date : 15-03-2023", start)
    section = text[start:end]
    rows = re.findall(r"(?m)^\s*(\d{6,8})\s+(DROP|\d+(?:\s*&\s*\d+)?)\s*$", section)
    result: dict[str, list[str] | None] = {}
    for question_id, answer in rows:
        result[question_id] = None if answer == "DROP" else re.findall(r"\d+", answer)
    if len(result) != 150:
        raise ValueError(f"Expected 150 official key rows, found {len(result)}")
    return result


def source_questions() -> dict[str, dict]:
    doc = fitz.open(PAPER)
    locations: dict[str, int] = {}
    full_text: list[str] = []
    for page_number, page in enumerate(doc, start=1):
        page_text = page.get_text()
        full_text.append(page_text)
        for qbid in re.findall(r"QBID\s*:\s*(\d+)", page_text):
            locations.setdefault(qbid, page_number)
    text = "\n".join(full_text)
    matches = list(re.finditer(r"QBID\s*:\s*(\d+)", text))
    result: dict[str, dict] = {}
    for index, match in enumerate(matches):
        qbid = match.group(1)
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        block = text[match.start():end]
        option_ids = re.findall(r"Option ID\s*=\s*(\d+)", block)[:4]
        if len(option_ids) != 4:
            raise ValueError(f"{qbid}: expected 4 option IDs, found {option_ids}")
        result[qbid] = {"optionIds": option_ids, "sourcePage": locations.get(qbid)}
    if len(result) != 150:
        raise ValueError(f"Expected 150 source QBIDs, found {len(result)}")
    return result


def main() -> None:
    if not KEY_SOURCE.exists():
        raise FileNotFoundError(f"Missing downloaded NTA key: {KEY_SOURCE}")
    official = parse_official_key()
    source = source_questions()
    if set(official) != set(source):
        raise ValueError("Official-key QBIDs do not exactly match question-paper QBIDs")

    questions: list[dict] = []
    evidence: dict[str, dict] = {}
    for ordinal, question_id in enumerate(source, start=1):
        info = source[question_id]
        correct_ids = official[question_id]
        dropped = correct_ids is None
        indexes = [] if dropped else [info["optionIds"].index(option_id) for option_id in correct_ids]
        evidence[question_id] = {
            "questionOptionIds": info["optionIds"],
            "correctOptionIds": correct_ids,
            "correctOptionIndexes": indexes,
            "dropped": dropped,
        }
        paper = 1 if ordinal <= 50 else 2
        questions.append({
            "id": f"official-2023-{question_id}",
            "paper": paper,
            "unit": 0,
            "question": f"UGC-NET December 2022 cycle, Question {ordinal}. Open the exact local source page to read the full question and its numbered options.",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "answer": indexes[0] if indexes else 0,
            "answers": indexes,
            "dropped": dropped,
            "explanation": "Dropped by NTA in the final key." if dropped else "Answer mapped from the official NTA final key using the printed option IDs.",
            "difficulty": "official",
            "topic": "Official UGC-NET 2023 PYQ",
            "source": "NTA UGC-NET December 2022 cycle question paper (11 March 2023, Shift 2)",
            "sourceUrl": "https://ugcnet.nta.nic.in/document/ugc-net-december-2022-final-answer-keys/",
            "examCycle": "December 2022 cycle (11 March 2023, Shift 2)",
            "year": 2023,
            "questionId": question_id,
            "questionNumber": ordinal,
            "sourcePage": info["sourcePage"],
            "sourceImage": f"data/question-images/2023-question-page-{info['sourcePage']:03d}.png",
            "isPyq": True,
            "verified": True,
            "answerVerification": "Official NTA final answer key; option-ID mapping",
            "importMethod": "Exact source-page image with official answer-key option-ID mapping",
        })

    KEY_COPY.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(KEY_SOURCE, KEY_COPY)
    EVIDENCE.write_text(json.dumps({
        "metadata": {
            "authority": "National Testing Agency",
            "examCycle": "UGC-NET December 2022 cycle, 11 March 2023 Shift 2",
            "subject": "087 - Computer Science and Applications",
            "officialSource": "https://ugcnet.nta.nic.in/document/ugc-net-december-2022-final-answer-keys/",
            "keyFile": KEY_COPY.name,
        },
        "mapping": evidence,
    }, indent=2), encoding="utf-8")
    OUT.write_text("window.NETCRACKER_INTERACTIVE_PYQS_2023=" + json.dumps({"version": "2023.2", "questions": questions}, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"Rebuilt 2023: {len(questions)} questions, {sum(q['dropped'] for q in questions)} dropped, {sum(len(q['answers']) > 1 for q in questions)} multi-correct")


if __name__ == "__main__":
    main()
