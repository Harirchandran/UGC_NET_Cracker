"""Extract the verified UGC-NET 2021 Computer Science paper into app data.

The source PDF includes question IDs, all four options and the correct answer
text. This extractor fails closed if any item cannot be matched exactly.
"""
import json
import re
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "data" / "papers" / "2021-combined-cs.pdf"
OUT = ROOT / "data" / "interactive-pyqs.js"


def compact(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def trim_first_question(text: str) -> str:
    marker = "Topic:‐ CSA1_SHAAN_NOV21A"
    if marker in text:
        return text.split(marker, 1)[1]
    return text


def main() -> None:
    text = "\n".join(page.extract_text() or "" for page in PdfReader(str(PDF)).pages)
    markers = list(re.finditer(r"\[Question ID\s*=\s*(\d+)\]\[Question Description\s*=\s*([^\]]+)\]", text))
    if len(markers) != 150:
        raise ValueError(f"Expected 150 question markers, found {len(markers)}")

    questions = []
    cursor = 0
    for ordinal, marker in enumerate(markers, start=1):
        raw_question = text[cursor:marker.start()]
        if ordinal == 1:
            raw_question = trim_first_question(raw_question)
        raw_question = compact(raw_question)

        next_start = markers[ordinal].start() if ordinal < len(markers) else len(text)
        body = text[marker.end():next_start]
        correct = re.search(r"Correct Answer\s*:\s*[‐-]\s*(.*?)\s*\[Option ID = (\d+)\]", body, re.S)
        if not correct:
            raise ValueError(f"Question {ordinal}: correct-answer marker missing")
        option_part = body[:correct.start()]
        option_matches = list(re.finditer(r"(?:^|\n)\s*([1-4])\.\s*(.*?)\s*\[Option ID = (\d+)\]", option_part, re.S))
        if len(option_matches) != 4:
            raise ValueError(f"Question {ordinal}: expected four options, found {len(option_matches)}")
        options = [compact(m.group(2)) for m in option_matches]
        answer_text = compact(correct.group(1))
        answer_text = re.sub(r"^.*Correct Answer\s*:\s*[‐-]\s*", "", answer_text)
        normalized = [compact(o).replace("‐", "-") for o in options]
        try:
            answer = normalized.index(answer_text.replace("‐", "-"))
        except ValueError as exc:
            raise ValueError(f"Question {ordinal}: answer={answer_text!r}; options={options!r}") from exc

        question = {
            "id": f"official-2021-{marker.group(1)}",
            "paper": 1 if ordinal <= 50 else 2,
            "unit": 0,
            "question": raw_question,
            "options": options,
            "answer": answer,
            "explanation": "Verified against the correct answer printed in the bundled NTA 2021 question paper.",
            "difficulty": "official",
            "topic": "Official UGC-NET 2021 PYQ",
            "source": "NTA UGC-NET 2021 official question paper",
            "sourceUrl": "https://nta.ac.in/Download/ExamPaper/Paper_20220303105042.pdf",
            "examCycle": "December 2021",
            "year": 2021,
            "questionId": marker.group(1),
            "questionDescription": marker.group(2),
            "isPyq": True,
            "verified": True,
            "answerVerification": "Printed in source PDF"
        }
        questions.append(question)
        cursor = marker.end() + correct.end()

    by_paper = {paper: sum(q["paper"] == paper for q in questions) for paper in (1, 2)}
    if by_paper != {1: 50, 2: 100}:
        raise ValueError(f"Unexpected Paper 1/Paper 2 distribution: {by_paper}")
    payload = {"version": "2021.1", "source": "Bundled NTA 2021 official paper", "questions": questions}
    OUT.write_text("window.NETCRACKER_INTERACTIVE_PYQS=" + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"Wrote {len(questions)} verified questions: Paper 1 {by_paper[1]}, Paper 2 {by_paper[2]}")


if __name__ == "__main__":
    main()
