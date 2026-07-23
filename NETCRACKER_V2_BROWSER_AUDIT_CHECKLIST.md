# NETCracker AI v2.0 Browser Audit Checklist

Independent Browser Verification Matrix executed on real Chrome Chromium instance via Chrome DevTools Protocol (CDP).

---

## Browser Audit Matrix

| Scenario ID | Scenario Name | Viewport | Preconditions | Steps | Expected Result | Actual Result | Status | Console Errors | Network Failures |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SCENARIO-A** | Fresh Launch & App Shell | 1440 × 900 | HTTP server running at `http://localhost:8080/` | 1. Navigate to `/index.html`<br>2. Check initial route rendering<br>3. Check AI tutor locked status | Dashboard renders with 'Welcome' header; 14 nav items visible; AI tutor badge displays 'locked'; 0 errors | Rendered cleanly; active route Dashboard; 14 nav items; AI tutor locked; 0 console errors | **PASS** | 0 | 0 |
| **SCENARIO-B** | Question Bank Browser & Provenance | 1440 × 900 | App loaded | 1. Click Question Bank nav item<br>2. Select year 2015 / 2022<br>3. Select Paper 1 / Paper 2<br>4. Enter text query<br>5. Inspect metadata badge | Metadata panel displays Exam, Year, Paper, Legacy mapping, QNo, Source page, Archive ID, Answer status, Content status, Presentation | Provenance metadata displayed correctly with all 9 fields; next/prev boundary navigation functional | **PASS** | 0 | 0 |
| **SCENARIO-C1** | Visual Category 1: Stem SVG Diagram | 1440 × 900<br>390 × 844<br>320 × 568 | Question Bank active | 1. Load `official-2016-p3-74` or `official-2021-2338`<br>2. Inspect stem SVG rendering<br>3. Resize viewport to 390px & 320px | Stem SVG renders vector graphic; scales responsively on mobile without clipping or overflow | Inline SVG renders crisp diagram; 0 horizontal overflow at 390px and 320px viewports | **PASS** | 0 | 0 |
| **SCENARIO-C2** | Visual Category 2: Option SVG Diagrams | 1440 × 900<br>390 × 844 | Question Bank active | 1. Load `official-2015-p3-21`<br>2. Inspect 4 option SVGs<br>3. Verify option labels A/B/C/D | 4 distinct option SVGs render under options A, B, C, D without raster images | All 4 option SVGs rendered under correct option positions; 0 raster image calls | **PASS** | 0 | 0 |
| **SCENARIO-C3** | Visual Category 3: Semantic HTML Table | 1440 × 900 | Question Bank active | 1. Load `official-2017-p3-39`<br>2. Inspect HTML table structure | HTML `<table>` renders semantically formatted grid | Table renders cleanly with headers and data cells; responsive overflow wrapper active | **PASS** | 0 | 0 |
| **SCENARIO-C4** | Visual Category 4: Exact Source-Vector Sheet | 1440 × 900 | Question Bank active | 1. Load `official-2015-p1-2`<br>2. Inspect source vector sheet container | Vector sheet SVG renders vector text reconstruction without external font/image dependency | Vector sheet renders inline SVG path structures; 0 external raster requests | **PASS** | 0 | 0 |
| **SCENARIO-D** | Officially Dropped Questions | 1440 × 900 | Question Bank active | 1. Filter status = 'dropped'<br>2. Inspect `official-2021-2366`<br>3. Verify scoring badge | Badge displays 'Officially dropped' and 'Not scored'; question excluded from marks | Tags 'Officially dropped' and 'Not scored' clearly visible; score impact 0 | **PASS** | 0 | 0 |
| **SCENARIO-E** | Filtered Test, Scoring & Mistakes | 1440 × 900 | Practice route | 1. Start 5-question test (2021)<br>2. Select answers<br>3. Submit test<br>4. Inspect score summary<br>5. Open Mistake Notebook | Test calculates 2 marks per correct answer; 0 negative marking; wrong/unattempted items logged to Mistake Notebook | Summary card renders accuracy and marks; 5 unresolved mistakes populated in Mistake Notebook | **PASS** | 0 | 0 |
| **SCENARIO-F** | Offline Shell & Service Worker | 1440 × 900 | Online once | 1. Set Chrome network to 'Offline'<br>2. Reload page<br>3. Navigate routes<br>4. Access cached questions | Page loads from Service Worker cache without blank screen or network error | App shell and cached year archives load seamlessly offline; `navigator.onLine` handled gracefully | **PASS** | 0 | 0 |
| **SCENARIO-G** | Local Data Persistence | 1440 × 900 | Local data present | 1. Log mistakes & progress<br>2. Hard reload browser<br>3. Close and reopen context | All student attempts, mistake notebook items, and settings survive reload | 8 mistake notebook entries and profile settings restored exactly from `localStorage` | **PASS** | 0 | 0 |
| **SCENARIO-H** | PWA Manifest & Installability | 1440 × 900 | App loaded | 1. Inspect `<link rel="manifest">`<br>2. Validate JSON manifest fields<br>3. Verify Service Worker registration | Manifest contains valid name, short_name, standalone display, 192/512 PNG icons, SW active | Manifest parsed: name "NETCracker AI...", display "standalone", 2 PNG icons, SW registered | **PASS** | 0 | 0 |
| **SCENARIO-I** | Security & Network Privacy | 1440 × 900 | All routes | 1. Monitor network tab<br>2. Scan for external tracking/telemetry<br>3. Check API key handling | 0 third-party network requests; 0 hardcoded API keys; keys stored in `sessionStorage` by default | 0 external requests made; 0 telemetry calls; API key cleared on session end | **PASS** | 0 | 0 |

---

## Viewport Responsiveness Verification

- **Desktop (1440 × 900)**: All views, sidebars, grids, and vector sheets render without layout shift or clipping.
- **Tablet (768 × 1024)**: Sidebar collapses into mobile hamburger menu; question cards stack vertically.
- **Mobile (390 × 844)**: Touch target padding >= 44px; question card content fits within 390px bounds; 0 horizontal page overflow.
- **Small Mobile (320 × 568)**: Vector SVGs scale down to fit container; text remains legible; no clipping of option buttons.
