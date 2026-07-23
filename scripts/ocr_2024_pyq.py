"""Create an offline, auditable OCR import for the August 2024 UGC-NET CS paper.

The source question PDF is image-heavy.  This script renders every page, OCRs it,
and pairs Question Id values with the NTA final-answer-key option numbers.  It
retains the OCR text so each imported record can be audited against the bundled
source PDF when a human review is needed.
"""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

import fitz

WORKSPACE = Path(__file__).resolve().parents[1]
ROOT = WORKSPACE / "netcracker_ai_pwa"
PAPER = ROOT / "data/papers/2024-combined-cs.pdf"
KEY_TEXT = WORKSPACE / "tmp/pdfs/keys/ugc-net-june-2024-final-key.txt"
OUT = ROOT / "data/interactive-pyqs-2024.js"
OCR = Path(r"C:/Program Files/Tesseract-OCR/tesseract.exe")
OCR_CACHE = WORKSPACE / "tmp/pdfs/ocr-2024.txt"


def answer_map() -> dict[str, str]:
    """Extract the subject-87 final-key rows (Question ID -> option number/D)."""
    text = KEY_TEXT.read_text(encoding="utf-8")
    start = text.index("Subject: 87 - Computer Science")
    # The next subject heading ends this subject's answer-key section.
    tail = text[start:]
    next_subject = re.search(r"\nSubject: (?!87\b)", tail)
    section = tail[: next_subject.start()] if next_subject else tail
    rows = re.findall(r"\b(533072\d{4,6})\s*\n\s*([1-4D])\b", section)
    return dict(rows)


def ocr_pages() -> str:
    if OCR_CACHE.exists():
        return OCR_CACHE.read_text(encoding="utf-8")
    doc = fitz.open(PAPER)
    pages: list[str] = []
    for n, page in enumerate(doc, start=1):
        pix = page.get_pixmap(matrix=fitz.Matrix(2.8, 2.8), alpha=False)
        image = WORKSPACE / "tmp/pdfs/ocr-2024" / f"page-{n:03}.png"
        image.parent.mkdir(parents=True, exist_ok=True)
        pix.save(image)
        result = subprocess.run(
            [str(OCR), str(image), "stdout", "-l", "eng", "--psm", "6"],
            check=True,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        pages.append(f"\n\n--- OCR PAGE {n} ---\n{result.stdout}")
        print(f"OCR page {n}/{len(doc)}", flush=True)
    output = "".join(pages)
    OCR_CACHE.write_text(output, encoding="utf-8")
    return output


def clean_block(block: str) -> tuple[str, list[str]] | None:
    """Return readable English question text and four OCR option strings."""
    # Keep content after marks and before the first numbered option.
    body = re.sub(r"^.*?Wrong Marks\s*:\s*0\s*", "", block, flags=re.S)
    # Remove Hindi glyph runs; the canonical bilingual content remains in the PDF.
    body = re.sub(r"[\u0900-\u097F]+", " ", body)
    body = re.sub(r"https?://\S+\s+\d+/\d+", "", body)
    lines = [re.sub(r"\s+", " ", line).strip() for line in body.splitlines()]
    lines = [line for line in lines if line]
    # OCR frequently turns numbered option labels into (t), Q), (G), or @).
    # Accept those known digit confusions but deliberately not (A)-(E), which
    # occur inside many assertion/matching questions before their real options.
    option_marker = re.compile(r"^\s*(?:\(\s*[1-4IlTtQqGg@][^)]{0,2}\)|[1-4IlTtQqGg@][.)])\s*")
    # In match-list questions labels such as (I) appear in the stem.  Once the
    # conventional "Choose the correct answer" line is present, only scan the
    # content following it for the four answer options.
    choice_line = next((i for i, line in enumerate(lines) if "choose the correct answer" in line.lower()), None)
    search_from = choice_line + 1 if choice_line is not None else 0
    starts = [i for i, line in enumerate(lines) if i >= search_from and option_marker.match(line)]
    if len(starts) < 4:
        # The first label is the one Tesseract most often damages.  If labels
        # 2-4 survived, the intervening first line is still the first option.
        later = [i for i, line in enumerate(lines) if i >= search_from and re.match(r"^\s*\(?\s*[2-4]\s*\)?[.)]", line)]
        if len(later) >= 3:
            first = search_from
            if first >= later[0]:
                first = max(0, later[0] - 1)
            starts = [first, *later[:3]]
    if len(starts) < 4:
        return None
    first = starts[0]
    question = " ".join(lines[:first]).strip(" -:")
    options: list[str] = []
    for pos, index in enumerate(starts[:4]):
        end = starts[pos + 1] if pos < 3 else len(lines)
        value = " ".join(lines[index:end])
        value = option_marker.sub("", value).strip()
        # A group-comprehension header or footer belongs to the next visual
        # block, never to the final option of this question.
        value = re.split(r"\bQuestion Id\s*:\s*\d+\b", value, maxsplit=1, flags=re.I)[0].strip()
        options.append(value)
    if not question or len(options) != 4 or any(not option for option in options):
        return None
    return question, options


def records(ocr: str, answers: dict[str, str]) -> tuple[list[dict], list[dict]]:
    marker = re.compile(
        r"Question Number\s*:\s*(\d+)\s+Question Id\s*:\s*(\d+)\s+Question Type\s*:\s*MCQ",
        re.I,
    )
    matches = list(marker.finditer(ocr))
    good: list[dict] = []
    rejected: list[dict] = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(ocr)
        number, question_id = match.group(1), match.group(2)
        block = ocr[match.start():end]
        page_markers = re.findall(r"--- OCR PAGE (\d+) ---", ocr[: match.start()])
        source_page = int(page_markers[-1]) if page_markers else None
        parsed = clean_block(block)
        correct = answers.get(question_id)
        if not parsed or not correct or correct == "D":
            rejected.append({"number": number, "questionId": question_id, "hasAnswer": bool(correct), "sourcePage": source_page, "ocr": block})
            continue
        question, options = parsed
        good.append(
            {
                "id": f"official-2024-{question_id}",
                "paper": 1 if int(number) <= 50 else 2,
                "unit": 0,
                "question": question,
                "options": options,
                "answer": int(correct) - 1,
                "explanation": "Answer mapped from the NTA UGC-NET June 2024 final answer key.",
                "difficulty": "official",
                "topic": "Official UGC-NET 2024 PYQ",
                "source": "NTA UGC-NET June 2024 question paper (OCR-backed)",
                "sourceUrl": "https://ugcnet.nta.ac.in/",
                "examCycle": "June 2024 (rescheduled: 23 August 2024, Shift 1)",
                "year": 2024,
                "questionId": question_id,
                "questionNumber": int(number),
                "sourcePage": source_page,
                "isPyq": True,
                "verified": True,
                "answerVerification": "NTA final answer key",
                "importMethod": "OCR from bundled question PDF",
            }
        )
    # The question-PDF repeats a number of bilingual blocks.  Keep the most
    # legible English OCR candidate per Question Id rather than duplicate quiz
    # items.  (The source PDF remains the canonical bilingual rendering.)
    by_id: dict[str, dict] = {}
    for item in good:
        score = sum(char.isascii() and char.isalpha() for char in item["question"] + " ".join(item["options"]))
        current = by_id.get(item["questionId"])
        if current is None or score > current[0]:
            by_id[item["questionId"]] = (score, item)
    review_by_id: dict[str, dict] = {}
    for item in rejected:
        review_by_id.setdefault(item["questionId"], item)
    return [entry[1] for entry in by_id.values()], list(review_by_id.values())


def visual_fallbacks(good: list[dict], rejected: list[dict], answers: dict[str, str]) -> list[dict]:
    """Keep the small OCR remainder interactive using exact source-page images."""
    imported = {item["questionId"] for item in good}
    unresolved = [item for item in rejected if item["questionId"] not in imported and answers.get(item["questionId"]) is not None]
    images = ROOT / "data/question-images"
    images.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(PAPER)
    output: list[dict] = []
    for item in unresolved:
        page = item["sourcePage"]
        image = images / f"2024-question-page-{page:03}.png"
        if not image.exists():
            doc[page - 1].get_pixmap(matrix=fitz.Matrix(2.2, 2.2), alpha=False).save(image)
        correct = answers[item["questionId"]]
        dropped = correct == "D"
        output.append(
            {
                "id": f"official-2024-{item['questionId']}",
                "paper": 1 if int(item["number"]) <= 50 else 2,
                "unit": 0,
                "question": "Read the exact original question in the source image below. Select the matching numbered option.",
                "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                "answer": 0 if dropped else int(correct) - 1,
                "explanation": "Dropped by NTA in the final answer key; shown for completeness and excluded from scored tests." if dropped else "Answer mapped from the NTA UGC-NET June 2024 final answer key.",
                "difficulty": "official",
                "topic": "Official UGC-NET 2024 PYQ",
                "source": "NTA UGC-NET June 2024 question paper (exact source-page visual)",
                "sourceUrl": "https://ugcnet.nta.ac.in/",
                "examCycle": "June 2024 (rescheduled: 23 August 2024, Shift 1)",
                "year": 2024,
                "questionId": item["questionId"],
                "questionNumber": int(item["number"]),
                "sourcePage": page,
                "sourceImage": f"data/question-images/{image.name}",
                "isPyq": True,
                "verified": True,
                "dropped": dropped,
                "answerVerification": "NTA final answer key",
                "importMethod": "Exact source-page image with answer-key mapping",
            }
        )
    return output


def main() -> None:
    answers = answer_map()
    ocr = ocr_pages()
    good, rejected = records(ocr, answers)
    visuals = visual_fallbacks(good, rejected, answers)
    payload = {"questions": [*good, *visuals], "rejected": rejected, "meta": {"source": "OCR 2024", "keyRows": len(answers), "visualFallbacks": len(visuals)}}
    OUT.write_text("window.NETCRACKER_INTERACTIVE_PYQS_2024 = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"Imported {len(good)} OCR questions + {len(visuals)} exact visual fallbacks; review queue {len(rejected)}; answer-key rows {len(answers)}")


if __name__ == "__main__":
    main()
