# UGC-NET Computer Science PYQ coverage audit

This is an evidence audit, not a claim that every bundled paper is scored.
All 17 PDFs (1,595 source questions over 2015–2024) are bundled for offline
reading.  Only questions with traceable answer evidence are available in the
interactive scored flow.

| Cycle | Source questions | Offline PDF | Scored interactive questions | Answer evidence |
|---|---:|---|---:|---|
| 2015 | 185 | Yes | 0 | Not yet verified; prior generated mapping quarantined |
| 2016 | 185 | Yes | 0 | Not yet verified; prior generated mapping quarantined |
| 2017 | 175 | Yes | 0 | Not yet verified; prior generated mapping quarantined |
| 2018 | 150 | Yes | 0 | Not yet verified; prior generated mapping quarantined |
| 2019 | 150 | Yes | 149 | NTA answer-key table embedded in the bundled source PDF; 1 dropped item |
| 2020 | 150 | Yes | 0 | NTA key obtained, but the bundled publisher paper has no NTA question/option IDs; no ordinal mapping is guessed |
| 2021 | 150 | Yes | 143 | NTA final key joined to source question/option IDs; 7 NTA-excluded items, 2 multi-correct items |
| 2022 | 150 | Yes | 149 | NTA final key joined to source question/option IDs; 1 dropped item |
| 2023 | 150 | Yes | 145 | NTA final key joined to source QBIDs/option IDs; 5 dropped items, 1 multi-correct item |
| 2024 | 150 | Yes | 145 | Pre-existing NTA final-key import; 5 dropped items |

Current scored offline corpus: **731 questions**.  Source PDFs remain
available for every year, including the 845 questions in unverified cycles that are deliberately
blocked from scoring until their answer mappings can be verified.

## Reproducible official-key imports

- `scripts/rebuild_2021_from_official_key.py`
- `scripts/rebuild_2022_from_official_key.py`
- `scripts/rebuild_2023_from_official_key.py`
- `scripts/rebuild_2019_from_embedded_key.py`

The official key PDFs and their option-ID evidence maps are stored under
`data/answer-keys/`.  The source-page images used by the interactive records
are cached by the service worker, so the certified flow works offline after
the app is first installed.
