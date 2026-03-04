You are building an exemplar school chatbot site to test a reusable multi-school architecture.

**Reference repository — clone and read this in full before writing a single line of code:**
https://github.com/BERI-labs/Beri-AboutHabs-2

Study every file carefully:
- The full Next.js/TypeScript project structure
- The pre-chunking script in `scripts/` and the `.json` chunk file it produces — understand the exact chunk schema (fields, metadata, structure)
- The BM25 + cosine similarity hybrid retrieval system — understand exactly how both scores are computed, weighted, and combined to rank chunks
- The Groq API call — model used, how the retrieved chunks are injected into the prompt, streaming if present
- The `.md` knowledge base format — how sections, citations, and URLs are structured (one citation and one URL per section)
- How `school-config` (or equivalent) feeds SCHOOL_NAME, THEME_COLOURS, SUGGESTED_QUESTIONS, SYSTEM_PROMPT, and LOGO_PATH into the UI and API route
- How the logo, colours, and school name are rendered throughout the UI

Replicate this architecture exactly for a fictional exemplar school. Do not deviate from the pipeline — same chunking approach, same retrieval logic, same API pattern.

---

## The Fictional School

**School name:** Ashford College  
**Tagline:** "Inspiring Minds, Shaping Futures"  
**Type:** Independent co-educational secondary school (ages 11–18)  
**Location:** Elmbridge, Surrey  
**Logo:** Create a simple SVG — a stylised open book with a small flame above it, in the school's brand colours, with "Ashford College" as wordmark. Save as `ashford-logo.svg`.

---

## Configuration Layer

Mirror whatever config pattern the Habs repo uses. The config must expose exactly these five variables, and every school-specific string in the codebase must reference them — nothing hardcoded outside the config:

1. **`SCHOOL_NAME`** — `"Ashford College"`
2. **`THEME_COLOURS`** — Primary: `#1B4F72` (deep navy), Accent: `#D4AC0D` (gold)
3. **`SUGGESTED_QUESTIONS`**:
   - "What are the entry requirements for Year 7?"
   - "How much are the annual tuition fees?"
   - "What scholarships are available?"
   - "What sports does Ashford College offer?"
   - "Can you tell me about the music programme?"
4. **`SYSTEM_PROMPT`** — Instructs the AI to act as a warm, helpful admissions assistant for Ashford College; answer only from retrieved knowledge base chunks; if information isn't available, say so clearly; always cite sources where provided.
5. **`LOGO_PATH`** — Path to `ashford-logo.svg`

---

## Knowledge Base File (`ashford-data.md`)

Mirror the exact `.md` format used in the Habs repo — same section heading style, same citation and URL format. Each section must have exactly one citation and one URL. All citations and URLs are fake but plausible.

---

### Admissions
- Entry points at Year 7 (age 11), Year 9 (age 13), and Sixth Form (age 16)
- Year 7: Ashford Entrance Exam held each January; shortlisted candidates invited to interview in February
- Year 9: ISEB Common Pre-Test taken in Year 6 or 7, followed by school-specific assessment
- Sixth Form: Minimum 6 GCSEs at grade 7 or above; subject interviews required
- Registration deadline: 31 October for all entry points
- Open mornings held in October and November; private tours available year-round by appointment

*Citation:* `[Ashford College Admissions Guide 2024](https://www.ashfordcollege.ac.uk/admissions/guide-2024)`

---

### Tuition Fees
- Years 7–11: £7,200 per term (£21,600 per annum)
- Sixth Form (Years 12–13): £7,800 per term (£23,400 per annum)
- Fees reviewed each September; current schedule effective from September 2024
- Lunch included; extras include residential trips, individual music tuition, and external examination entries
- Payment due by the first day of each term; direct debit and termly lump sum accepted

*Citation:* `[Ashford College Fee Schedule 2024–25](https://www.ashfordcollege.ac.uk/fees/schedule-2024)`

---

### Exam Results
- 2024 A-Level: 94% A*–B; 72% A*–A; 31% A*
- 2024 GCSE: 89% grades 7–9; 61% grade 9; 100% pass rate
- Five-year average A-Level A*–A: 68%
- 81% of 2024 leavers secured places at Russell Group universities
- 14 Oxbridge offers received in 2024; 11 accepted

*Citation:* `[Ashford College Examination Results 2024](https://www.ashfordcollege.ac.uk/results/2024)`

---

### Scholarships
- Academic scholarships at 11+, 13+, and 16+ — up to 20% fee remission; awarded on entrance exam performance and interview
- Music scholarships up to 15% remission — audition required; instruments considered include piano, strings, voice, and brass
- Sport scholarships up to 10% remission — trial required; sports considered include rugby, swimming, and athletics
- Means-tested bursaries available up to 100% of fees for families with demonstrable financial need
- Scholarship applications close two weeks before the relevant entrance assessment
- All awards reviewed annually; holders must maintain academic and conduct standards

*Citation:* `[Ashford College Scholarships & Bursaries 2024](https://www.ashfordcollege.ac.uk/fees/scholarships)`

---

### Co-curricular
- Over 80 clubs and societies running weekly across lunch and after school
- Duke of Edinburgh's Award offered at Bronze (Year 9), Silver (Year 10), and Gold (Year 12)
- Programmes include: Model United Nations, debating society, chess, coding club, film society, and drama society
- Annual whole-school production and inter-house drama competition each spring term
- Trips programme includes language exchanges (France, Germany, Spain), a Year 9 expedition week, and a biennial World Challenge expedition

*Citation:* `[Ashford College Co-curricular Prospectus 2024](https://www.ashfordcollege.ac.uk/cocurricular/prospectus)`

---

### Music
- Three orchestras (Symphony, Chamber, String), two concert bands, and four choirs including a chamber choir and gospel ensemble
- Individual and small-group tuition available in 25+ instruments; visiting specialist teachers
- Annual Spring Concert held at Elmbridge Civic Hall
- Purpose-built music school with recording studio, practice rooms, and industry-standard music technology suite
- ABRSM and Trinity Guildhall examination preparation offered to all instrument pupils
- Chamber music programme for advanced players; regular masterclasses with visiting professional musicians

*Citation:* `[Ashford College Music Department Handbook 2024](https://www.ashfordcollege.ac.uk/music/handbook)`

---

### Sport
- Core sports: rugby, football, cricket, athletics, swimming, netball, tennis, and cross-country
- High-performance programme for county and national-level athletes; links to regional academies
- Facilities: sports hall, 25m six-lane swimming pool, gymnasium, and 14 acres of playing fields
- Recent honours: Surrey U15 Rugby Champions 2024; National Schools Swimming Championships finalist 2024; Surrey Girls Netball Cup winners 2024
- All pupils participate in timetabled games sessions twice per week
- Partnerships with Elmbridge FC, Surrey Cricket Board, and Swim England South East

*Citation:* `[Ashford College Sport 2023–24 Season Review](https://www.ashfordcollege.ac.uk/sport/season-review-2024)`

---

## Pre-chunking

After writing the `.md` file, run the pre-chunking script (mirroring the Habs `scripts/` pattern exactly) to produce `ashford-chunks.json`. The chunk schema must be identical to the Habs `.json` — same fields, same metadata structure. Verify the output looks correct before proceeding.

---

## Retrieval Pipeline

Implement the BM25 + cosine similarity hybrid retrieval exactly as it works in the Habs repo:
- Same tokenisation approach
- Same BM25 parameters (k1, b)
- Same embedding or TF-IDF approach for cosine similarity
- Same score fusion/weighting method
- Same number of top-k chunks passed to the Groq prompt

Do not simplify or approximate — replicate it precisely.

---

## Groq API

Mirror the Habs Groq API call exactly, with one explicit requirement:
- **Model: `GPT-OSS-20B`** (use this exactly — do not substitute)
- Same message structure (system prompt + retrieved chunks + user query)
- Same streaming behaviour if present
- API key read from environment variable `GROQ_API_KEY`

---

## Deliverables

A fully working Next.js/TypeScript project that:
- Passes `ashford-data.md` through the pre-chunking script to produce `ashford-chunks.json`
- Serves the chatbot UI with Ashford College branding (navy/gold theme, SVG logo, school name) all driven from config
- Renders the 5 suggested questions from config
- On query: runs BM25 + cosine hybrid retrieval over `ashford-chunks.json`, injects top-k chunks into the Groq prompt with the system prompt from config, streams the response to the UI
- Is deployable to GitHub Pages or Vercel in the same manner as the Habs site

No hardcoded school strings outside the config file. Every configurable layer must be cleanly separated so that deploying for a new school requires only: replacing the `.md` file, re-running the chunking script, and updating the config.