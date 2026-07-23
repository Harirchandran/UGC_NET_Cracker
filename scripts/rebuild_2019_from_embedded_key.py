"""Audit/rebuild the 2019 import from its embedded NTA answer-key pages.

The bundled response-sheet PDF contains the NTA question/option IDs on the
first 82 pages and an answer-key table on pages 83–89.  This joins those IDs
directly and never relies on an ordinal answer list.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from pypdf import PdfReader


WORKSPACE = Path(__file__).resolve().parents[1]
APP = WORKSPACE / "netcracker_ai_pwa"
PAPER = APP / "data/papers/2019-combined-cs.pdf"
OUT = APP / "data/interactive-pyqs-2019.js"
EVIDENCE = APP / "data/answer-keys/2019-december-embedded-nta-key.json"


def source_rows(reader: PdfReader) -> dict[str, dict]:
    pages = [page.extract_text() or "" for page in reader.pages[:82]]
    locations: dict[str, int] = {}
    for page_number, page_text in enumerate(pages, start=1):
        for question_id in re.findall(r"Question ID\s*:\s*(\d+)", page_text):
            locations.setdefault(question_id, page_number)
    text = "\n".join(pages)
    matches = list(re.finditer(r"Question ID\s*:\s*(\d+)", text))
    result: dict[str, dict] = {}
    for index, match in enumerate(matches):
        question_id = match.group(1)
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        option_ids = re.findall(r"Option\s+[1-4]\s+ID\s*:\s*(\d+)", text[match.end():end])[:4]
        if len(option_ids) != 4:
            raise ValueError(f"{question_id}: expected four source option IDs, found {option_ids}")
        result[question_id] = {"optionIds": option_ids, "sourcePage": locations[question_id]}
    if len(result) != 150:
        raise ValueError(f"Expected 150 source questions, found {len(result)}")
    return result


def embedded_key(reader: PdfReader, source_ids: set[str]) -> dict[str, str | None]:
    text = "\n".join(page.extract_text() or "" for page in reader.pages[82:])
    tokens = re.findall(r"Dropped|\d{11}", text)
    result: dict[str, str | None] = {}
    for index, token in enumerate(tokens):
        if token not in source_ids:
            continue
        correct = tokens[index + 1] if index + 1 < len(tokens) else None
        result[token] = None if correct == "Dropped" else correct
    if set(result) != source_ids:
        raise ValueError("Embedded NTA key and source question IDs do not match exactly")
    return result


def main() -> None:
    reader = PdfReader(str(PAPER))
    source = source_rows(reader)
    key = embedded_key(reader, set(source))
    payload = json.loads(re.search(r"=([\s\S]*);\s*$", OUT.read_text(encoding="utf-8")).group(1))
    questions = payload["questions"]
    by_id = {question["questionId"]: question for question in questions}
    if set(by_id) != set(source):
        raise ValueError("Existing interactive IDs do not match source IDs")

    evidence: dict[str, dict] = {}
    for question_id, info in source.items():
        question = by_id[question_id]
        correct_option_id = key[question_id]
        dropped = correct_option_id is None
        answer = 0 if dropped else info["optionIds"].index(correct_option_id)
        question["answer"] = answer
        question["answers"] = [] if dropped else [answer]
        question["dropped"] = dropped
        question["sourcePage"] = info["sourcePage"]
        question["sourceImage"] = f"data/question-images/2019-question-page-{info['sourcePage']:03d}.png"
        question["explanation"] = "Dropped in the embedded NTA answer-key table." if dropped else "Answer mapped from the NTA answer-key table embedded in the local source PDF."
        question["answerVerification"] = "NTA answer-key page embedded in the bundled response-sheet PDF; option-ID mapping"
        evidence[question_id] = {"questionOptionIds": info["optionIds"], "correctOptionId": correct_option_id, "correctOptionIndex": None if dropped else answer, "dropped": dropped}

    EVIDENCE.write_text(json.dumps({
        "metadata": {"authority": "NTA", "examCycle": "UGC-NET June 2019", "source": "Answer-key table embedded on pages 83–89 of the bundled NTA response-sheet PDF", "keyFile": PAPER.name},
        "mapping": evidence,
    }, indent=2), encoding="utf-8")
    OUT.write_text("window.NETCRACKER_INTERACTIVE_PYQS_2019=" + json.dumps({"version": "2019.2", "questions": questions}, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"Rebuilt 2019: {len(questions)} questions, {sum(q['dropped'] for q in questions)} dropped")


if __name__ == "__main__":
    main()
