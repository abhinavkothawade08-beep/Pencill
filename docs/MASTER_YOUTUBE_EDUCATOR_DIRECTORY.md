# Global Master Directory of YouTube Educators
**Pencill - Find Your Path** | Edition `0.1.0` (first edition, partial) | Research date `2026-10-24` | Record version `1` per record

> **Read first.** This is a *first, partial, evidence-graded edition*, not an exhaustive directory. In the research environment used, `youtube.com` pages could not be opened directly, so **no channel was confirmed on YouTube itself and no video was watched**. Consequently **every quality score is `NOT YET SCORED`**, and `CHANNEL_VERIFIED_CONTENT_NOT_REVIEWED` means only that the channel's identity and URL string were corroborated by official/institutional sources or multiple independent web sources. Nothing here should be presented to learners as a ranked recommendation until the content-review queue in Section 11 is worked through.

## Table of contents
- [Section 1: Executive Summary](#section-1-executive-summary)
- [Section 2: Global Educational Domain Taxonomy](#section-2-global-educational-domain-taxonomy)
- [Section 3: Global Master Educator Directory](#section-3-global-master-educator-directory)
- [Section 4: School Board and Curriculum Directory](#section-4-school-board-and-curriculum-directory)
- [Section 5: Global Competitive Examination Directory](#section-5-global-competitive-examination-directory)
- [Section 6: Professional Certification Directory](#section-6-professional-certification-directory)
- [Section 7: Practical Skills and Project-Based Learning Directory](#section-7-practical-skills-and-project-based-learning-directory)
- [Section 8: Best Educators by Learning Objective](#section-8-best-educators-by-learning-objective)
- [Section 9: Language and Regional Coverage](#section-9-language-and-regional-coverage)
- [Section 10: Quality and Verification Methodology](#section-10-quality-and-verification-methodology)
- [Section 11: Research Gaps and Unverified Candidates](#section-11-research-gaps-and-unverified-candidates)
- [Section 12: Alphabetical and Taxonomic Index](#section-12-alphabetical-and-taxonomic-index)
- [Section 13: Pencill Integration Specification](#section-13-pencill-integration-specification)
- [Section 14: Sources and References](#section-14-sources-and-references)

## Section 1: Executive Summary
### 1.1 Purpose
A long-lived, versioned database of trustworthy YouTube educators and their areas of expertise, designed for Pencill's resource engine. It identifies *educators*, not videos: every video or playlist must still be checked for topic relevance, accuracy, duration, accessibility and suitability before recommendation (Section 13).
### 1.2 What this edition contains
| Item | Count | Meaning |
|---|---|---|
| Educator/channel records (Section 3) | 96 | All have a stable ID `PEN-ED-nnnn` |
| Records with `CHANNEL_VERIFIED_CONTENT_NOT_REVIEWED` | 14 | Channel URL string plus identity corroborated by official, institutional or multi-source evidence; YouTube page itself not opened |
| Records `UNVERIFIED` but identity corroborated by an institutional/official source (URL missing) | 7 | Upgrade once the channel URL is captured |
| Records with a channel URL captured | 17 | URL appeared verbatim in a retrieved source |
| Records with a YouTube channel ID captured | 1 | ID appeared in source URLs; not confirmed on youtube.com |
| Records content-reviewed | 0 | No video-level review was possible |
| Records scored on the 100-point rubric | 0 | All `NOT YET SCORED` |
| Recommended educators (formal) | 0 | Requires content review and scoring (Section 10) |
| Taxonomy nodes (Section 2) | 433 | 23 domains; includes 3 illustrative topic nodes |
| Examination entries (Section 5-6) | 90 | 21 have at least one candidate educator mapped; facts mostly recalled, not officially verified |
| School board / curriculum entries (Section 4) | 36 | 5 have at least one candidate educator mapped |
| Sources registered (Section 14) | 84 | URLs are verbatim search results from this session |

### 1.3 Methodology in brief
Search-based discovery across subjects, exams, regions and languages (Methods B, C, E of the brief) using public web sources; identity corroboration from institutional/official pages (Method G) where available; **content-level review (Method F) was not possible and is the first priority for edition 0.2**. Community lists and vendor blogs were treated as discovery signals only. Recalled facts (e.g. exam administrators) are labelled `RECALLED_NOT_VERIFIED`.
### 1.4 Scope and honest coverage labels
Labels are defined once and applied everywhere: `INITIAL_DISCOVERY` = 1-4 candidate records; `PARTIALLY_MAPPED` = 5 or more candidate records, none content-reviewed; `SUBSTANTIALLY_COVERED` = at least 5 content-reviewed, scored records with official-syllabus mapping (**no category reaches this in 0.1.0**); `REQUIRES_FURTHER_RESEARCH` = no candidates yet. No coverage percentage is given because the population of relevant educators is unknown.
| Domain group | Primary-group candidates | Records touching domain via taxonomy | Identity-verified | Partially verified (official source, URL missing) | Evaluated (scored) | Recommended | Coverage label |
|---|---|---|---|---|---|---|---|
| Mathematics | 15 | 31 | 4 | 1 | 0 | 0 | PARTIALLY_MAPPED |
| Natural Sciences | 12 | 27 | 5 | 1 | 0 | 0 | PARTIALLY_MAPPED |
| Computer Science and Information Technology | 16 | 17 | 1 | 0 | 0 | 0 | PARTIALLY_MAPPED |
| Artificial Intelligence and Data | 8 | 10 | 0 | 0 | 0 | 0 | PARTIALLY_MAPPED |
| Engineering | 3 | 4 | 0 | 0 | 0 | 0 | INITIAL_DISCOVERY |
| Business, Commerce, and Economics | 4 | 6 | 0 | 0 | 0 | 0 | PARTIALLY_MAPPED |
| Finance and Professional Financial Education | 0 | 1 | 0 | 0 | 0 | 0 | INITIAL_DISCOVERY |
| Medical and Health Sciences | 6 | 6 | 1 | 0 | 0 | 0 | PARTIALLY_MAPPED |
| Humanities and Social Sciences | 4 | 7 | 0 | 0 | 0 | 0 | PARTIALLY_MAPPED |
| Languages and Communication | 13 | 16 | 0 | 1 | 0 | 0 | PARTIALLY_MAPPED |
| Arts, Design, and Creative Disciplines | 0 | 0 | 0 | 0 | 0 | 0 | REQUIRES_FURTHER_RESEARCH |
| Vocational, Practical, and Technical Skills | 0 | 0 | 0 | 0 | 0 | 0 | REQUIRES_FURTHER_RESEARCH |
| Early Childhood Education | 0 | 0 | 0 | 0 | 0 | 0 | REQUIRES_FURTHER_RESEARCH |
| Special Education and Accessible Learning | 0 | 0 | 0 | 0 | 0 | 0 | REQUIRES_FURTHER_RESEARCH |
| Learning Skills | 0 | 0 | 0 | 0 | 0 | 0 | REQUIRES_FURTHER_RESEARCH |
| Environmental Sustainability | 0 | 0 | 0 | 0 | 0 | 0 | REQUIRES_FURTHER_RESEARCH |
| Agriculture and Food Science | 0 | 0 | 0 | 0 | 0 | 0 | REQUIRES_FURTHER_RESEARCH |
| Sports Science and Physical Education | 0 | 0 | 0 | 0 | 0 | 0 | REQUIRES_FURTHER_RESEARCH |
| Aviation, Maritime, and Space | 0 | 0 | 0 | 0 | 0 | 0 | REQUIRES_FURTHER_RESEARCH |
| Defense and Security Studies | 0 | 0 | 0 | 0 | 0 | 0 | REQUIRES_FURTHER_RESEARCH |
| Ethics and Professional Development | 0 | 0 | 0 | 0 | 0 | 0 | REQUIRES_FURTHER_RESEARCH |
| Interdisciplinary and Emerging Fields | 0 | 1 | 0 | 0 | 0 | 0 | INITIAL_DISCOVERY |
| Personal Care and Beauty Sciences | 0 | 0 | 0 | 0 | 0 | 0 | REQUIRES_FURTHER_RESEARCH |
| Cross-domain and exam-preparation providers | 15 | 15 | 3 | 4 | 0 | 0 | PARTIALLY_MAPPED |

### 1.5 Verification standards and limitations
- A URL is only shown if it appeared verbatim in a retrieved source; **no URL, handle or channel ID was inferred from a channel name.** Missing values read `NOT_CAPTURED`.
- Channel IDs: only one is captured (3Blue1Brown), cited by two third-party URLs, and is labelled `SOURCE_CITED`, not confirmed on youtube.com.
- Subscriber counts, view counts and earnings estimates seen in sources are **not used** as evidence of quality.
- Many exam-related sources are commercial coaching or test-prep sites with a conflict of interest; they are flagged in Section 14.
- Regional coverage is uneven: outside North America, mapped educators are mainly in the UK, India and Brazil, plus South Korea (EBS); Africa, the Middle East, Southeast Asia, Japan and China have none (Section 9, 11).
- Latest verification date for all records: `2026-10-24`.

## Section 2: Global Educational Domain Taxonomy
**ID rules.** `Dxx` domain, `Dxx.yy` subject, `Dxx.yy.zz` sub-domain, `Dxx.yy.zz.ww` topic. IDs are positional and **append-only**: never renumber; deprecate by setting status. **Status** values: `CORE`, `PROPOSED` (new domain not in the brief; for review), `ILLUSTRATIVE` (topic nodes added only so the engine's example intents can resolve; they are not research results).
**Expansion mechanism.** (1) Add new nodes under the highest suitable parent with status `PROPOSED`; (2) record a one-line rationale and a source; (3) promote to `CORE` when at least one educator record maps to it; (4) retire with `DEPRECATED` and a `replaced_by` pointer. Exam and board classifications are separate, expandable tables (Sections 4-6).

### D01 Mathematics
| Taxonomy_ID | Parent_ID | Level | Name | Status |
|---|---|---|---|---|
| D01 | - | 1 | Mathematics | CORE |
| D01.01 | D01 | 2 | Arithmetic | CORE |
| D01.02 | D01 | 2 | Number theory | CORE |
| D01.03 | D01 | 2 | Elementary mathematics | CORE |
| D01.04 | D01 | 2 | Algebra | CORE |
| D01.05 | D01 | 2 | Linear algebra | CORE |
| D01.06 | D01 | 2 | Geometry | CORE |
| D01.07 | D01 | 2 | Coordinate geometry | CORE |
| D01.08 | D01 | 2 | Trigonometry | CORE |
| D01.09 | D01 | 2 | Calculus | CORE |
| D01.10 | D01 | 2 | Multivariable calculus | CORE |
| D01.11 | D01 | 2 | Differential equations | CORE |
| D01.12 | D01 | 2 | Real analysis | CORE |
| D01.13 | D01 | 2 | Complex analysis | CORE |
| D01.14 | D01 | 2 | Abstract algebra | CORE |
| D01.15 | D01 | 2 | Discrete mathematics | CORE |
| D01.16 | D01 | 2 | Combinatorics | CORE |
| D01.17 | D01 | 2 | Probability | CORE |
| D01.18 | D01 | 2 | Statistics | CORE |
| D01.19 | D01 | 2 | Mathematical logic | CORE |
| D01.20 | D01 | 2 | Optimization | CORE |
| D01.21 | D01 | 2 | Numerical analysis | CORE |
| D01.22 | D01 | 2 | Graph theory | CORE |
| D01.23 | D01 | 2 | Topology | CORE |
| D01.24 | D01 | 2 | Set theory | CORE |
| D01.25 | D01 | 2 | Mathematical modeling | CORE |
| D01.26 | D01 | 2 | Operations research | CORE |
| D01.27 | D01 | 2 | Advanced and research mathematics | CORE |
| D01.11.01 | D01.11 | 3 | First-order differential equations | ILLUSTRATIVE |

### D02 Natural Sciences
| Taxonomy_ID | Parent_ID | Level | Name | Status |
|---|---|---|---|---|
| D02 | - | 1 | Natural Sciences | CORE |
| D02.01 | D02 | 2 | Physics | CORE |
| D02.01.01 | D02.01 | 3 | Classical mechanics | CORE |
| D02.01.02 | D02.01 | 3 | Electricity and magnetism | CORE |
| D02.01.03 | D02.01 | 3 | Electromagnetism | CORE |
| D02.01.04 | D02.01 | 3 | Thermodynamics | CORE |
| D02.01.05 | D02.01 | 3 | Waves and optics | CORE |
| D02.01.06 | D02.01 | 3 | Modern physics | CORE |
| D02.01.07 | D02.01 | 3 | Quantum mechanics | CORE |
| D02.01.08 | D02.01 | 3 | Relativity | CORE |
| D02.01.09 | D02.01 | 3 | Nuclear physics | CORE |
| D02.01.10 | D02.01 | 3 | Particle physics | CORE |
| D02.01.11 | D02.01 | 3 | Condensed matter physics | CORE |
| D02.01.12 | D02.01 | 3 | Astrophysics | CORE |
| D02.01.13 | D02.01 | 3 | Experimental physics | CORE |
| D02.01.14 | D02.01 | 3 | Mathematical physics | CORE |
| D02.02 | D02 | 2 | Chemistry | CORE |
| D02.02.01 | D02.02 | 3 | General chemistry | CORE |
| D02.02.02 | D02.02 | 3 | Organic chemistry | CORE |
| D02.02.03 | D02.02 | 3 | Inorganic chemistry | CORE |
| D02.02.04 | D02.02 | 3 | Physical chemistry | CORE |
| D02.02.05 | D02.02 | 3 | Analytical chemistry | CORE |
| D02.02.06 | D02.02 | 3 | Biochemistry | CORE |
| D02.02.07 | D02.02 | 3 | Environmental chemistry | CORE |
| D02.02.08 | D02.02 | 3 | Industrial chemistry | CORE |
| D02.02.09 | D02.02 | 3 | Computational chemistry | CORE |
| D02.03 | D02 | 2 | Biology | CORE |
| D02.03.01 | D02.03 | 3 | Cell biology | CORE |
| D02.03.02 | D02.03 | 3 | Molecular biology | CORE |
| D02.03.03 | D02.03 | 3 | Genetics | CORE |
| D02.03.04 | D02.03 | 3 | Evolution | CORE |
| D02.03.05 | D02.03 | 3 | Ecology | CORE |
| D02.03.06 | D02.03 | 3 | Zoology | CORE |
| D02.03.07 | D02.03 | 3 | Botany | CORE |
| D02.03.08 | D02.03 | 3 | Microbiology | CORE |
| D02.03.09 | D02.03 | 3 | Human physiology | CORE |
| D02.03.10 | D02.03 | 3 | Anatomy | CORE |
| D02.03.11 | D02.03 | 3 | Neuroscience | CORE |
| D02.03.12 | D02.03 | 3 | Immunology | CORE |
| D02.03.13 | D02.03 | 3 | Biotechnology | CORE |
| D02.03.14 | D02.03 | 3 | Bioinformatics | CORE |
| D02.03.15 | D02.03 | 3 | Molecular genetics | CORE |
| D02.03.16 | D02.03 | 3 | Environmental biology | CORE |
| D02.04 | D02 | 2 | Earth and Space Sciences | CORE |
| D02.04.01 | D02.04 | 3 | Geology | CORE |
| D02.04.02 | D02.04 | 3 | Geography | CORE |
| D02.04.03 | D02.04 | 3 | Meteorology | CORE |
| D02.04.04 | D02.04 | 3 | Climatology | CORE |
| D02.04.05 | D02.04 | 3 | Oceanography | CORE |
| D02.04.06 | D02.04 | 3 | Astronomy | CORE |
| D02.04.07 | D02.04 | 3 | Cosmology | CORE |
| D02.04.08 | D02.04 | 3 | Planetary science | CORE |
| D02.04.09 | D02.04 | 3 | Environmental science | CORE |
| D02.04.10 | D02.04 | 3 | Climate science | CORE |
| D02.01.01.01 | D02.01.01 | 4 | Rotational mechanics | ILLUSTRATIVE |

### D03 Computer Science and Information Technology
| Taxonomy_ID | Parent_ID | Level | Name | Status |
|---|---|---|---|---|
| D03 | - | 1 | Computer Science and Information Technology | CORE |
| D03.01 | D03 | 2 | Computer fundamentals | CORE |
| D03.02 | D03 | 2 | Programming fundamentals | CORE |
| D03.03 | D03 | 2 | Python | CORE |
| D03.04 | D03 | 2 | Java | CORE |
| D03.05 | D03 | 2 | C | CORE |
| D03.06 | D03 | 2 | C++ | CORE |
| D03.07 | D03 | 2 | C# | CORE |
| D03.08 | D03 | 2 | JavaScript | CORE |
| D03.09 | D03 | 2 | TypeScript | CORE |
| D03.10 | D03 | 2 | Go | CORE |
| D03.11 | D03 | 2 | Rust | CORE |
| D03.12 | D03 | 2 | PHP | CORE |
| D03.13 | D03 | 2 | Swift | CORE |
| D03.14 | D03 | 2 | Kotlin | CORE |
| D03.15 | D03 | 2 | Data structures and algorithms | CORE |
| D03.16 | D03 | 2 | Object-oriented programming | CORE |
| D03.17 | D03 | 2 | Functional programming | CORE |
| D03.18 | D03 | 2 | Competitive programming | CORE |
| D03.19 | D03 | 2 | Web development | CORE |
| D03.20 | D03 | 2 | Frontend development | CORE |
| D03.21 | D03 | 2 | Backend development | CORE |
| D03.22 | D03 | 2 | Full-stack development | CORE |
| D03.23 | D03 | 2 | Mobile application development | CORE |
| D03.24 | D03 | 2 | Game development | CORE |
| D03.25 | D03 | 2 | Software engineering | CORE |
| D03.26 | D03 | 2 | System design | CORE |
| D03.27 | D03 | 2 | Operating systems | CORE |
| D03.28 | D03 | 2 | Computer networks | CORE |
| D03.29 | D03 | 2 | Database management | CORE |
| D03.30 | D03 | 2 | SQL | CORE |
| D03.31 | D03 | 2 | Distributed systems | CORE |
| D03.32 | D03 | 2 | Cloud computing | CORE |
| D03.33 | D03 | 2 | DevOps | CORE |
| D03.34 | D03 | 2 | Cybersecurity | CORE |
| D03.35 | D03 | 2 | Ethical security education | CORE |
| D03.36 | D03 | 2 | Computer architecture | CORE |
| D03.37 | D03 | 2 | Embedded systems | CORE |
| D03.38 | D03 | 2 | Blockchain engineering | CORE |
| D03.39 | D03 | 2 | Human-computer interaction | CORE |
| D03.40 | D03 | 2 | Software testing | CORE |
| D03.41 | D03 | 2 | API development | CORE |
| D03.42 | D03 | 2 | Open-source development | CORE |
| D03.02.01 | D03.02 | 3 | Loops | ILLUSTRATIVE |

### D04 Artificial Intelligence and Data
| Taxonomy_ID | Parent_ID | Level | Name | Status |
|---|---|---|---|---|
| D04 | - | 1 | Artificial Intelligence and Data | CORE |
| D04.01 | D04 | 2 | Artificial intelligence fundamentals | CORE |
| D04.02 | D04 | 2 | Machine learning | CORE |
| D04.03 | D04 | 2 | Deep learning | CORE |
| D04.04 | D04 | 2 | Generative AI | CORE |
| D04.05 | D04 | 2 | Large language models | CORE |
| D04.06 | D04 | 2 | Natural language processing | CORE |
| D04.07 | D04 | 2 | Computer vision | CORE |
| D04.08 | D04 | 2 | Reinforcement learning | CORE |
| D04.09 | D04 | 2 | AI agents | CORE |
| D04.10 | D04 | 2 | Retrieval-augmented generation | CORE |
| D04.11 | D04 | 2 | AI application development | CORE |
| D04.12 | D04 | 2 | AI evaluation | CORE |
| D04.13 | D04 | 2 | Responsible AI | CORE |
| D04.14 | D04 | 2 | Data science | CORE |
| D04.15 | D04 | 2 | Data analytics | CORE |
| D04.16 | D04 | 2 | Business intelligence | CORE |
| D04.17 | D04 | 2 | Statistics for data science | CORE |
| D04.18 | D04 | 2 | Data engineering | CORE |
| D04.19 | D04 | 2 | Big data | CORE |
| D04.20 | D04 | 2 | MLOps | CORE |
| D04.21 | D04 | 2 | Model deployment | CORE |
| D04.22 | D04 | 2 | AI research | CORE |
| D04.23 | D04 | 2 | Robotics | CORE |
| D04.24 | D04 | 2 | Autonomous systems | CORE |
| D04.25 | D04 | 2 | Neural networks | CORE |
| D04.26 | D04 | 2 | Recommendation systems | CORE |
| D04.27 | D04 | 2 | Information retrieval | CORE |

### D05 Engineering
| Taxonomy_ID | Parent_ID | Level | Name | Status |
|---|---|---|---|---|
| D05 | - | 1 | Engineering | CORE |
| D05.01 | D05 | 2 | Computer engineering | CORE |
| D05.02 | D05 | 2 | Software engineering (engineering branch) | CORE |
| D05.03 | D05 | 2 | Electrical engineering | CORE |
| D05.04 | D05 | 2 | Electronics engineering | CORE |
| D05.05 | D05 | 2 | Electronics and communication engineering | CORE |
| D05.06 | D05 | 2 | Mechanical engineering | CORE |
| D05.07 | D05 | 2 | Civil engineering | CORE |
| D05.08 | D05 | 2 | Chemical engineering | CORE |
| D05.09 | D05 | 2 | Aerospace engineering | CORE |
| D05.10 | D05 | 2 | Aeronautical engineering | CORE |
| D05.11 | D05 | 2 | Automobile engineering | CORE |
| D05.12 | D05 | 2 | Biomedical engineering | CORE |
| D05.13 | D05 | 2 | Biotechnology engineering | CORE |
| D05.14 | D05 | 2 | Environmental engineering | CORE |
| D05.15 | D05 | 2 | Industrial engineering | CORE |
| D05.16 | D05 | 2 | Manufacturing engineering | CORE |
| D05.17 | D05 | 2 | Instrumentation and control | CORE |
| D05.18 | D05 | 2 | Mechatronics | CORE |
| D05.19 | D05 | 2 | Robotics (engineering branch) | CORE |
| D05.20 | D05 | 2 | Materials science and engineering | CORE |
| D05.21 | D05 | 2 | Petroleum engineering | CORE |
| D05.22 | D05 | 2 | Mining engineering | CORE |
| D05.23 | D05 | 2 | Agricultural engineering | CORE |
| D05.24 | D05 | 2 | Marine engineering | CORE |
| D05.25 | D05 | 2 | Nuclear engineering | CORE |
| D05.26 | D05 | 2 | Renewable energy engineering | CORE |
| D05.27 | D05 | 2 | Structural engineering | CORE |
| D05.28 | D05 | 2 | Power systems | CORE |
| D05.29 | D05 | 2 | VLSI and semiconductor design | CORE |
| D05.30 | D05 | 2 | Analog and digital electronics | CORE |
| D05.31 | D05 | 2 | Signal processing | CORE |
| D05.32 | D05 | 2 | Control systems | CORE |
| D05.33 | D05 | 2 | Engineering mathematics | CORE |
| D05.34 | D05 | 2 | CAD, CAM, and simulation | CORE |

### D06 Business, Commerce, and Economics
| Taxonomy_ID | Parent_ID | Level | Name | Status |
|---|---|---|---|---|
| D06 | - | 1 | Business, Commerce, and Economics | CORE |
| D06.01 | D06 | 2 | Accounting | CORE |
| D06.02 | D06 | 2 | Financial accounting | CORE |
| D06.03 | D06 | 2 | Management accounting | CORE |
| D06.04 | D06 | 2 | Cost accounting | CORE |
| D06.05 | D06 | 2 | Auditing | CORE |
| D06.06 | D06 | 2 | Economics | CORE |
| D06.07 | D06 | 2 | Microeconomics | CORE |
| D06.08 | D06 | 2 | Macroeconomics | CORE |
| D06.09 | D06 | 2 | Econometrics | CORE |
| D06.10 | D06 | 2 | Business mathematics | CORE |
| D06.11 | D06 | 2 | Finance (business) | CORE |
| D06.12 | D06 | 2 | Corporate finance | CORE |
| D06.13 | D06 | 2 | Financial modeling | CORE |
| D06.14 | D06 | 2 | Investment analysis | CORE |
| D06.15 | D06 | 2 | Banking | CORE |
| D06.16 | D06 | 2 | Insurance | CORE |
| D06.17 | D06 | 2 | Taxation | CORE |
| D06.18 | D06 | 2 | Business law | CORE |
| D06.19 | D06 | 2 | Management | CORE |
| D06.20 | D06 | 2 | Marketing | CORE |
| D06.21 | D06 | 2 | Digital marketing | CORE |
| D06.22 | D06 | 2 | Human resources | CORE |
| D06.23 | D06 | 2 | Entrepreneurship | CORE |
| D06.24 | D06 | 2 | Operations management | CORE |
| D06.25 | D06 | 2 | Supply chain management | CORE |
| D06.26 | D06 | 2 | Business analytics | CORE |
| D06.27 | D06 | 2 | International business | CORE |
| D06.28 | D06 | 2 | Project management | CORE |
| D06.29 | D06 | 2 | Product management | CORE |
| D06.30 | D06 | 2 | Business strategy | CORE |

### D07 Finance and Professional Financial Education
| Taxonomy_ID | Parent_ID | Level | Name | Status |
|---|---|---|---|---|
| D07 | - | 1 | Finance and Professional Financial Education | CORE |
| D07.01 | D07 | 2 | Personal finance | CORE |
| D07.02 | D07 | 2 | Financial literacy | CORE |
| D07.03 | D07 | 2 | Stock market fundamentals | CORE |
| D07.04 | D07 | 2 | Equity research | CORE |
| D07.05 | D07 | 2 | Portfolio management | CORE |
| D07.06 | D07 | 2 | Fixed income | CORE |
| D07.07 | D07 | 2 | Derivatives | CORE |
| D07.08 | D07 | 2 | Risk management | CORE |
| D07.09 | D07 | 2 | Quantitative finance | CORE |
| D07.10 | D07 | 2 | Financial mathematics | CORE |
| D07.11 | D07 | 2 | Financial statement analysis | CORE |
| D07.12 | D07 | 2 | Financial planning | CORE |
| D07.13 | D07 | 2 | Wealth management | CORE |
| D07.14 | D07 | 2 | Investment banking education | CORE |
| D07.15 | D07 | 2 | Financial regulation | CORE |
| D07.16 | D07 | 2 | Actuarial science | CORE |

### D08 Medical and Health Sciences
| Taxonomy_ID | Parent_ID | Level | Name | Status |
|---|---|---|---|---|
| D08 | - | 1 | Medical and Health Sciences | CORE |
| D08.01 | D08 | 2 | Anatomy (medical) | CORE |
| D08.02 | D08 | 2 | Physiology (medical) | CORE |
| D08.03 | D08 | 2 | Biochemistry (medical) | CORE |
| D08.04 | D08 | 2 | Pathology | CORE |
| D08.05 | D08 | 2 | Pharmacology | CORE |
| D08.06 | D08 | 2 | Microbiology (medical) | CORE |
| D08.07 | D08 | 2 | Immunology (medical) | CORE |
| D08.08 | D08 | 2 | Medicine | CORE |
| D08.09 | D08 | 2 | Surgery | CORE |
| D08.10 | D08 | 2 | Pediatrics | CORE |
| D08.11 | D08 | 2 | Obstetrics and gynecology | CORE |
| D08.12 | D08 | 2 | Psychiatry | CORE |
| D08.13 | D08 | 2 | Neurology | CORE |
| D08.14 | D08 | 2 | Cardiology | CORE |
| D08.15 | D08 | 2 | Dermatology | CORE |
| D08.16 | D08 | 2 | Radiology | CORE |
| D08.17 | D08 | 2 | Oncology | CORE |
| D08.18 | D08 | 2 | Emergency medicine | CORE |
| D08.19 | D08 | 2 | Dentistry | CORE |
| D08.20 | D08 | 2 | Nursing | CORE |
| D08.21 | D08 | 2 | Pharmacy | CORE |
| D08.22 | D08 | 2 | Public health | CORE |
| D08.23 | D08 | 2 | Epidemiology | CORE |
| D08.24 | D08 | 2 | Nutrition science | CORE |
| D08.25 | D08 | 2 | Physiotherapy | CORE |
| D08.26 | D08 | 2 | Occupational therapy | CORE |
| D08.27 | D08 | 2 | Veterinary medicine | CORE |
| D08.28 | D08 | 2 | Medical laboratory science | CORE |
| D08.29 | D08 | 2 | Medical research | CORE |
| D08.30 | D08 | 2 | Evidence-based medicine | CORE |

### D09 Humanities and Social Sciences
| Taxonomy_ID | Parent_ID | Level | Name | Status |
|---|---|---|---|---|
| D09 | - | 1 | Humanities and Social Sciences | CORE |
| D09.01 | D09 | 2 | History | CORE |
| D09.02 | D09 | 2 | World history | CORE |
| D09.03 | D09 | 2 | Regional and national history | CORE |
| D09.04 | D09 | 2 | Political science | CORE |
| D09.05 | D09 | 2 | International relations | CORE |
| D09.06 | D09 | 2 | Sociology | CORE |
| D09.07 | D09 | 2 | Psychology | CORE |
| D09.08 | D09 | 2 | Philosophy | CORE |
| D09.09 | D09 | 2 | Ethics (academic) | CORE |
| D09.10 | D09 | 2 | Anthropology | CORE |
| D09.11 | D09 | 2 | Archaeology | CORE |
| D09.12 | D09 | 2 | Religious studies (academic) | CORE |
| D09.13 | D09 | 2 | Cultural studies | CORE |
| D09.14 | D09 | 2 | Linguistics | CORE |
| D09.15 | D09 | 2 | Human geography | CORE |
| D09.16 | D09 | 2 | Public administration | CORE |
| D09.17 | D09 | 2 | International development | CORE |
| D09.18 | D09 | 2 | Law | CORE |
| D09.19 | D09 | 2 | Legal studies | CORE |
| D09.20 | D09 | 2 | Constitutional studies | CORE |
| D09.21 | D09 | 2 | Human rights | CORE |
| D09.22 | D09 | 2 | Public policy | CORE |
| D09.23 | D09 | 2 | Criminology | CORE |
| D09.24 | D09 | 2 | Education theory | CORE |
| D09.25 | D09 | 2 | Research methodology | CORE |

### D10 Languages and Communication
| Taxonomy_ID | Parent_ID | Level | Name | Status |
|---|---|---|---|---|
| D10 | - | 1 | Languages and Communication | CORE |
| D10.01 | D10 | 2 | English | CORE |
| D10.02 | D10 | 2 | Hindi | CORE |
| D10.03 | D10 | 2 | Spanish | CORE |
| D10.04 | D10 | 2 | French | CORE |
| D10.05 | D10 | 2 | German | CORE |
| D10.06 | D10 | 2 | Mandarin Chinese | CORE |
| D10.07 | D10 | 2 | Japanese | CORE |
| D10.08 | D10 | 2 | Korean | CORE |
| D10.09 | D10 | 2 | Arabic | CORE |
| D10.10 | D10 | 2 | Portuguese | CORE |
| D10.11 | D10 | 2 | Russian | CORE |
| D10.12 | D10 | 2 | Italian | CORE |
| D10.13 | D10 | 2 | Other widely studied languages | CORE |
| D10.14 | D10 | 2 | Indian regional languages | CORE |
| D10.15 | D10 | 2 | Sign languages | CORE |
| D10.16 | D10 | 2 | Grammar | CORE |
| D10.17 | D10 | 2 | Vocabulary | CORE |
| D10.18 | D10 | 2 | Speaking | CORE |
| D10.19 | D10 | 2 | Listening | CORE |
| D10.20 | D10 | 2 | Reading | CORE |
| D10.21 | D10 | 2 | Writing | CORE |
| D10.22 | D10 | 2 | Pronunciation | CORE |
| D10.23 | D10 | 2 | Academic writing | CORE |
| D10.24 | D10 | 2 | Technical communication | CORE |
| D10.25 | D10 | 2 | Public speaking | CORE |
| D10.26 | D10 | 2 | Debate | CORE |
| D10.27 | D10 | 2 | Translation | CORE |
| D10.28 | D10 | 2 | Interpretation | CORE |

### D11 Arts, Design, and Creative Disciplines
| Taxonomy_ID | Parent_ID | Level | Name | Status |
|---|---|---|---|---|
| D11 | - | 1 | Arts, Design, and Creative Disciplines | CORE |
| D11.01 | D11 | 2 | Drawing | CORE |
| D11.02 | D11 | 2 | Painting | CORE |
| D11.03 | D11 | 2 | Illustration | CORE |
| D11.04 | D11 | 2 | Graphic design | CORE |
| D11.05 | D11 | 2 | UI/UX design | CORE |
| D11.06 | D11 | 2 | Product design | CORE |
| D11.07 | D11 | 2 | Industrial design | CORE |
| D11.08 | D11 | 2 | Architecture | CORE |
| D11.09 | D11 | 2 | Interior design | CORE |
| D11.10 | D11 | 2 | Animation | CORE |
| D11.11 | D11 | 2 | 3D modeling | CORE |
| D11.12 | D11 | 2 | Visual effects | CORE |
| D11.13 | D11 | 2 | Photography | CORE |
| D11.14 | D11 | 2 | Filmmaking | CORE |
| D11.15 | D11 | 2 | Video editing | CORE |
| D11.16 | D11 | 2 | Music theory | CORE |
| D11.17 | D11 | 2 | Instrument instruction | CORE |
| D11.18 | D11 | 2 | Vocal training | CORE |
| D11.19 | D11 | 2 | Composition | CORE |
| D11.20 | D11 | 2 | Dance | CORE |
| D11.21 | D11 | 2 | Creative writing | CORE |
| D11.22 | D11 | 2 | Storytelling | CORE |
| D11.23 | D11 | 2 | Theatre | CORE |
| D11.24 | D11 | 2 | Fashion design | CORE |
| D11.25 | D11 | 2 | Game art | CORE |
| D11.26 | D11 | 2 | Digital art | CORE |

### D12 Vocational, Practical, and Technical Skills
| Taxonomy_ID | Parent_ID | Level | Name | Status |
|---|---|---|---|---|
| D12 | - | 1 | Vocational, Practical, and Technical Skills | CORE |
| D12.01 | D12 | 2 | Electrical installation | CORE |
| D12.02 | D12 | 2 | Electronics repair | CORE |
| D12.03 | D12 | 2 | Plumbing | CORE |
| D12.04 | D12 | 2 | Welding | CORE |
| D12.05 | D12 | 2 | Carpentry | CORE |
| D12.06 | D12 | 2 | Automotive maintenance | CORE |
| D12.07 | D12 | 2 | Industrial maintenance | CORE |
| D12.08 | D12 | 2 | HVAC | CORE |
| D12.09 | D12 | 2 | CNC machining | CORE |
| D12.10 | D12 | 2 | Manufacturing (trade) | CORE |
| D12.11 | D12 | 2 | CAD drafting | CORE |
| D12.12 | D12 | 2 | Construction skills | CORE |
| D12.13 | D12 | 2 | Renewable energy installation | CORE |
| D12.14 | D12 | 2 | Agriculture (trade) | CORE |
| D12.15 | D12 | 2 | Food production | CORE |
| D12.16 | D12 | 2 | Culinary arts | CORE |
| D12.17 | D12 | 2 | Baking | CORE |
| D12.18 | D12 | 2 | Hospitality | CORE |
| D12.19 | D12 | 2 | Logistics | CORE |
| D12.20 | D12 | 2 | Retail operations | CORE |
| D12.21 | D12 | 2 | Laboratory techniques | CORE |
| D12.22 | D12 | 2 | Technical drawing | CORE |
| D12.23 | D12 | 2 | Workplace safety | CORE |
| D12.24 | D12 | 2 | Equipment operation | CORE |

### D13 Early Childhood Education
| Taxonomy_ID | Parent_ID | Level | Name | Status |
|---|---|---|---|---|
| D13 | - | 1 | Early Childhood Education | CORE |
| D13.01 | D13 | 2 | Early literacy | CORE |
| D13.02 | D13 | 2 | Early numeracy | CORE |
| D13.03 | D13 | 2 | Play-based learning | CORE |
| D13.04 | D13 | 2 | Early childhood development | CORE |

### D14 Special Education and Accessible Learning
| Taxonomy_ID | Parent_ID | Level | Name | Status |
|---|---|---|---|---|
| D14 | - | 1 | Special Education and Accessible Learning | CORE |
| D14.01 | D14 | 2 | Special education | CORE |
| D14.02 | D14 | 2 | Learning disabilities and accessible education | CORE |
| D14.03 | D14 | 2 | Assistive technology | CORE |
| D14.04 | D14 | 2 | Inclusive pedagogy | CORE |

### D15 Learning Skills
| Taxonomy_ID | Parent_ID | Level | Name | Status |
|---|---|---|---|---|
| D15 | - | 1 | Learning Skills | CORE |
| D15.01 | D15 | 2 | Study skills | CORE |
| D15.02 | D15 | 2 | Research skills | CORE |
| D15.03 | D15 | 2 | Critical thinking | CORE |
| D15.04 | D15 | 2 | Digital literacy | CORE |
| D15.05 | D15 | 2 | Exam technique | CORE |
| D15.06 | D15 | 2 | Note-taking and memory | CORE |

### D16 Environmental Sustainability
| Taxonomy_ID | Parent_ID | Level | Name | Status |
|---|---|---|---|---|
| D16 | - | 1 | Environmental Sustainability | CORE |
| D16.01 | D16 | 2 | Sustainability science | CORE |
| D16.02 | D16 | 2 | Climate policy education | CORE |
| D16.03 | D16 | 2 | Circular economy | CORE |
| D16.04 | D16 | 2 | Conservation | CORE |

### D17 Agriculture and Food Science
| Taxonomy_ID | Parent_ID | Level | Name | Status |
|---|---|---|---|---|
| D17 | - | 1 | Agriculture and Food Science | CORE |
| D17.01 | D17 | 2 | Agronomy | CORE |
| D17.02 | D17 | 2 | Horticulture | CORE |
| D17.03 | D17 | 2 | Animal husbandry | CORE |
| D17.04 | D17 | 2 | Food science and technology | CORE |

### D18 Sports Science and Physical Education
| Taxonomy_ID | Parent_ID | Level | Name | Status |
|---|---|---|---|---|
| D18 | - | 1 | Sports Science and Physical Education | CORE |
| D18.01 | D18 | 2 | Exercise physiology | CORE |
| D18.02 | D18 | 2 | Biomechanics | CORE |
| D18.03 | D18 | 2 | Sports coaching | CORE |
| D18.04 | D18 | 2 | Physical education | CORE |

### D19 Aviation, Maritime, and Space
| Taxonomy_ID | Parent_ID | Level | Name | Status |
|---|---|---|---|---|
| D19 | - | 1 | Aviation, Maritime, and Space | CORE |
| D19.01 | D19 | 2 | Aviation education | CORE |
| D19.02 | D19 | 2 | Maritime education | CORE |
| D19.03 | D19 | 2 | Space technology | CORE |

### D20 Defense and Security Studies
| Taxonomy_ID | Parent_ID | Level | Name | Status |
|---|---|---|---|---|
| D20 | - | 1 | Defense and Security Studies | CORE |
| D20.01 | D20 | 2 | Strategic studies | CORE |
| D20.02 | D20 | 2 | Military history | CORE |
| D20.03 | D20 | 2 | Defense academy entrance subjects | CORE |

### D21 Ethics and Professional Development
| Taxonomy_ID | Parent_ID | Level | Name | Status |
|---|---|---|---|---|
| D21 | - | 1 | Ethics and Professional Development | CORE |
| D21.01 | D21 | 2 | Professional ethics | CORE |
| D21.02 | D21 | 2 | Career skills | CORE |
| D21.03 | D21 | 2 | Workplace communication | CORE |

### D22 Interdisciplinary and Emerging Fields
| Taxonomy_ID | Parent_ID | Level | Name | Status |
|---|---|---|---|---|
| D22 | - | 1 | Interdisciplinary and Emerging Fields | CORE |
| D22.01 | D22 | 2 | Quantum computing | CORE |
| D22.02 | D22 | 2 | Biotechnology (emerging) | CORE |
| D22.03 | D22 | 2 | Neurotechnology | CORE |
| D22.04 | D22 | 2 | Synthetic biology | CORE |
| D22.05 | D22 | 2 | Nanotechnology | CORE |
| D22.06 | D22 | 2 | Computational social science | CORE |

### D23 Personal Care and Beauty Sciences  *(status: PROPOSED)*
| Taxonomy_ID | Parent_ID | Level | Name | Status |
|---|---|---|---|---|
| D23 | - | 1 | Personal Care and Beauty Sciences | PROPOSED |
| D23.01 | D23 | 2 | Cosmetology | CORE |
| D23.02 | D23 | 2 | Hair science | CORE |
| D23.03 | D23 | 2 | Nail technology | CORE |
| D23.04 | D23 | 2 | Skin science | CORE |

## Section 3: Global Master Educator Directory
Records are grouped by primary domain. Each record is shown across six tables (3.x.A to 3.x.F) keyed by `Educator_ID`; together they contain all 56 schema fields plus four documented extension fields (`Entity_Type`, `Access_Model`, `Corroboration_Level`, `Region_Group`). Component scores (`Expertise_Score`, `Teaching_Clarity_Score`, `Accuracy_Score`, `Curriculum_Alignment_Score`, `Depth_Score`, `Practical_Value_Score`, `Organization_Score`, `Recency_Score`) and `Overall_Score` are `NOT YET SCORED` for **every** record in edition 0.1.0. `Confidence_Level` here expresses confidence that the channel belongs on a future shortlist, based on source evidence only. Learning objectives are *source-described*, not verified from content. Missing values: `NOT_CAPTURED` (not found in retrieved text), `NOT_REVIEWED` (needs content review), `NOT_APPLICABLE`, `UNVERIFIED`, `REQUIRES FURTHER RESEARCH`.

### 3.1 Mathematics (15 records)
**3.1.A Identity**
| Educator_ID | Educator_Name | Channel_Name | Channel_URL | YouTube_Channel_ID | Channel_Handle | Official_Website | Country_or_Region | Primary_Language | Additional_Languages |
|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0001 | Grant Sanderson | 3Blue1Brown | <https://www.youtube.com/@3blue1brown> | UCYO_jab_esuFRV4b17AJtAw | @3blue1brown | <https://www.3blue1brown.com> | United States | English | Community subtitles (Criblate); volunteer Chinese mirror on Bilibili |
| PEN-ED-0002 | Professor Leonard | Professor Leonard | <https://www.youtube.com/c/ProfessorLeonard> | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0003 | NOT_CAPTURED | blackpenredpen | <https://www.youtube.com/c/blackpenredpen> | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0004 | Dr Trefor Bazett | Dr. Trefor Bazett | <https://www.youtube.com/@DrTrefor> | NOT_CAPTURED | @DrTrefor | NOT_CAPTURED | Canada | English | NOT_CAPTURED |
| PEN-ED-0005 | William M. Kinney | Bill Kinney Math | <https://www.youtube.com/c/billkinneymath> | NOT_CAPTURED | NOT_CAPTURED | <https://spark.bethel.edu/math-cs-faculty/3> | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0006 | NOT_CAPTURED (Clemson University instructor; faculty page path '~macaule') | Clemson University course videos (channel name NOT_CAPTURED) | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | <https://www.math.clemson.edu/~macaule/youtube.html> | United States | English | NOT_CAPTURED |
| PEN-ED-0008 | Patrick (surname NOT_CAPTURED) | PatrickJMT | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0009 | Brady Haran and guests (NOT_REVIEWED) | Numberphile | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0010 | Burkard Polster (Monash University) | Mathologer | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | Australia | English | NOT_CAPTURED |
| PEN-ED-0024 | Corbettmaths team | Corbettmaths | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | <https://www.corbettmaths.com> | United Kingdom | English | NOT_CAPTURED |
| PEN-ED-0025 | Hegarty Maths | Hegarty Maths | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | United Kingdom | English | NOT_CAPTURED |
| PEN-ED-0026 | Maths Genie | Maths Genie | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | United Kingdom | English | NOT_CAPTURED |
| PEN-ED-0027 | The GCSE Maths Tutor | The GCSE Maths Tutor | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | United Kingdom | English | NOT_CAPTURED |
| PEN-ED-0080 | Mohit Tyagi | Mohit Tyagi | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | India | Hindi | NOT_CAPTURED |
| PEN-ED-0090 | Professor Ferretto | Matematica com Ferretto | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | Brazil | Portuguese | NOT_CAPTURED |

**3.1.B Educational classification**
| Educator_ID | Educational_Domain | Subject | Subdomain | Topic | Educational_Level | Target_Audience | Teaching_Format | Learning_Objective |
|---|---|---|---|---|---|---|---|---|
| PEN-ED-0001 | D01 Mathematics; D04 Artificial Intelligence and Data; D22 Interdisciplinary and Emerging Fields | D01.05 Linear algebra; D01.09 Calculus; D01.11 Differential equations; D04.25 Neural networks; D22.01 Quantum computing | NOT_APPLICABLE | NOT_APPLICABLE | Beginner to University | STEM learners and undergraduates wanting visual intuition | Animated explanations | FOUNDATIONAL_CONCEPTS, CONCEPTUAL_DEPTH |
| PEN-ED-0002 | D01 Mathematics | D01.04 Algebra; D01.09 Calculus; D01.11 Differential equations; D01.18 Statistics | NOT_APPLICABLE | NOT_APPLICABLE | Beginner to University | Undergraduates and AP/college-level learners | Full-length lectures | COMPLETE_COURSE, CONCEPTUAL_DEPTH |
| PEN-ED-0003 | D01 Mathematics | D01.09 Calculus | NOT_APPLICABLE | NOT_APPLICABLE | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | PROBLEM_SOLVING |
| PEN-ED-0004 | D01 Mathematics | D01.09 Calculus; D01.05 Linear algebra; D01.11 Differential equations | NOT_APPLICABLE | NOT_APPLICABLE | University | Undergraduates | NOT_REVIEWED | CONCEPTUAL_DEPTH |
| PEN-ED-0005 | D01 Mathematics; D07 Finance and Professional Financial Education | D01.12 Real analysis; D01.14 Abstract algebra; D01.11 Differential equations; D01.05 Linear algebra; D01.10 Multivariable calculus; D07.10 Financial mathematics; D07.16 Actuarial science | NOT_APPLICABLE | NOT_APPLICABLE | University | Undergraduate mathematics students | Full-length lectures with Mathematica | THEORETICAL_STUDY, CONCEPTUAL_DEPTH, COMPLETE_COURSE |
| PEN-ED-0006 | D01 Mathematics | D01.11 Differential equations; D01.14 Abstract algebra; D01.05 Linear algebra | NOT_APPLICABLE | NOT_APPLICABLE | University | Undergraduates | Recorded course lectures | THEORETICAL_STUDY, COMPLETE_COURSE |
| PEN-ED-0008 | D01 Mathematics | D01.04 Algebra; D01.09 Calculus; D01.11 Differential equations; D01.05 Linear algebra | NOT_APPLICABLE | NOT_APPLICABLE | Beginner to University | College students | Worked-example whiteboard videos (source-described) | PROBLEM_SOLVING |
| PEN-ED-0009 | D01 Mathematics | D01.02 Number theory; D01.15 Discrete mathematics | NOT_APPLICABLE | NOT_APPLICABLE | General audience | Curious learners | Interview-style explainers | FOUNDATIONAL_CONCEPTS |
| PEN-ED-0010 | D01 Mathematics | D01.27 Advanced and research mathematics | NOT_APPLICABLE | NOT_APPLICABLE | General audience to University | Curious learners and maths students | Slide and animation explainers (NOT_REVIEWED) | CONCEPTUAL_DEPTH |
| PEN-ED-0024 | D01 Mathematics | D01.03 Elementary mathematics; D01.04 Algebra; D01.06 Geometry | NOT_APPLICABLE | NOT_APPLICABLE | KS2 to A Level | UK students | Worked-example videos plus worksheets | REVISION, EXAM_PREPARATION, PROBLEM_SOLVING |
| PEN-ED-0025 | D01 Mathematics | D01.03 Elementary mathematics; D01.04 Algebra | NOT_APPLICABLE | NOT_APPLICABLE | GCSE to A Level | UK students | Tutorial videos | EXAM_PREPARATION, REVISION |
| PEN-ED-0026 | D01 Mathematics | D01.03 Elementary mathematics; D01.04 Algebra | NOT_APPLICABLE | NOT_APPLICABLE | GCSE to A Level | UK students | Videos plus practice banks | EXAM_PREPARATION, REVISION, PROBLEM_SOLVING |
| PEN-ED-0027 | D01 Mathematics | D01.03 Elementary mathematics | NOT_APPLICABLE | NOT_APPLICABLE | GCSE | UK students aiming for top grades | Question walkthroughs | EXAM_PREPARATION, PROBLEM_SOLVING |
| PEN-ED-0080 | D01 Mathematics; D02 Natural Sciences | D01.09 Calculus; D01.04 Algebra; D02.01 Physics | D02.01.01 Classical mechanics | NOT_APPLICABLE | Pre-university | JEE aspirants | Lectures | EXAM_PREPARATION |
| PEN-ED-0090 | D01 Mathematics | D01.03 Elementary mathematics; D01.04 Algebra; D01.24 Set theory | NOT_APPLICABLE | NOT_APPLICABLE | Secondary | ENEM candidates | Pen-and-paper style lessons (per S34) | EXAM_PREPARATION, COMPLETE_COURSE |

**3.1.C Examination classification**
| Educator_ID | Examination_Name | Examination_Category | Country_or_Jurisdiction | School_Board | Curriculum | Syllabus_Coverage | Exam_Preparation_Specialization | Official_Affiliation_Status |
|---|---|---|---|---|---|---|---|---|
| PEN-ED-0001 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent creator; no exam-body affiliation |
| PEN-ED-0002 | None | SCHOOL_LEAVING | United States | NOT_APPLICABLE | College Board Advanced Placement | NOT_VERIFIED against official syllabus | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent creator |
| PEN-ED-0003 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent creator |
| PEN-ED-0004 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Affiliated with University of Victoria Mathematics and Statistics (per S11) |
| PEN-ED-0005 | None | PROFESSIONAL_CERT | International | NOT_APPLICABLE | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | NOT_EXAM_SPECIALIST_PER_SOURCES | Faculty member, Department of Mathematics and Computer Science, Bethel University |
| PEN-ED-0006 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Clemson University instructor |
| PEN-ED-0008 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent creator |
| PEN-ED-0009 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent media |
| PEN-ED-0010 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Run by a Monash University maths professor (per S12) |
| PEN-ED-0024 | GCSE Mathematics | SCHOOL_LEAVING | United Kingdom | NOT_VERIFIED | GCSE and A Level (AQA, OCR, Pearson Edexcel, WJEC/Eduqas) | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Independent |
| PEN-ED-0025 | GCSE Mathematics | SCHOOL_LEAVING | United Kingdom | NOT_VERIFIED | GCSE and A Level (AQA, OCR, Pearson Edexcel, WJEC/Eduqas) | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Commercial platform |
| PEN-ED-0026 | GCSE Mathematics | SCHOOL_LEAVING | United Kingdom | NOT_VERIFIED | GCSE and A Level (AQA, OCR, Pearson Edexcel, WJEC/Eduqas) | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Commercial platform |
| PEN-ED-0027 | GCSE Mathematics | SCHOOL_LEAVING | United Kingdom | NOT_VERIFIED | GCSE and A Level (AQA, OCR, Pearson Edexcel, WJEC/Eduqas) | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Commercial team |
| PEN-ED-0080 | JEE Main; JEE Advanced | UNIVERSITY_ENTRANCE | India | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Independent educator |
| PEN-ED-0090 | ENEM | UNIVERSITY_ENTRANCE | Brazil | NOT_VERIFIED | BNCC and ENEM pathway | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Independent; not INEP |

**3.1.D Quality and evidence**
| Educator_ID | Component scores (8 fields) | Overall_Score | Confidence_Level | Evidence_Summary | Strengths | Limitations | Best_For |
|---|---|---|---|---|---|---|---|
| PEN-ED-0001 | NOT YET SCORED | NOT YET SCORED | Medium | Creator site states the visual-first mission and undergraduate-level scope [S01]; handle supplied by creator interview [S03]; ID appears in two independent URLs [S04][S05]; a university library guide lists the 16-video linear algebra playlist [S07]. | Visual-first conceptual explanations; creator studied maths and CS at Stanford and previously produced Khan Academy content [S01]. | Creator describes part of the output as playful puzzle exploration [S01]; no exercise sets or exam alignment described in any source. Content not reviewed. | Building intuition before formal study of linear algebra, calculus or neural networks. |
| PEN-ED-0002 | NOT YET SCORED | NOT YET SCORED | Low | URL and topic range appear in a university student-success resource list [S10]; editorial list calls the long-form lectures thorough and college-oriented [S13]. | Long-form lectures spanning many courses (source-described). | Teaching quality and accuracy not reviewed; exam alignment not established. Content not reviewed. | Full-course study from algebra to differential equations. |
| PEN-ED-0003 | NOT YET SCORED | NOT YET SCORED | Low | Appears in a university resource list with its channel URL [S10]; no description retrieved. | NOT_CAPTURED | Insufficient evidence on scope, level and quality. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0004 | NOT YET SCORED | NOT YET SCORED | Low | One community post gives the handle and university affiliation [S11]; no second reliable source retrieved. | Described as intuitive and engaging (community opinion). | Single community source; scope not verified. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0005 | NOT YET SCORED | NOT YET SCORED | Medium | Faculty-authored institutional repository record names the channel, its start year (2012) and its subject range [S08]. | Rigorous upper-level topics rarely covered by general channels; institutional authorship. | Description dates from 2022; current upload activity and teaching quality not reviewed. Content not reviewed. | Rigorous undergraduate theory (analysis, abstract algebra) and differential equations. |
| PEN-ED-0006 | NOT YET SCORED | NOT YET SCORED | Low | Instructor's own faculty page describes the course series and their emphasis on structure of linear differential equations [S09]. | Course-structured, theory-leaning treatment of linear ODEs (instructor description). | Channel URL and name not captured; abstract algebra series is described by the instructor as due for re-recording [S09]. Content not reviewed. | Structured university differential equations (first-order and beyond) after content review. |
| PEN-ED-0008 | NOT YET SCORED | NOT YET SCORED | Low | Listed by two independent editorial/commercial lists [S12][S82]. | Step-by-step worked tutorials (source-described) [S13]. | URL not captured; content not reviewed. Content not reviewed. | Quick worked examples for standard college maths. |
| PEN-ED-0009 | NOT YET SCORED | NOT YET SCORED | Low | Listed in editorial list [S12]; a Numberphile video is cited by Wikipedia for 3Blue1Brown [S06]. | Accessible enrichment. | Not curriculum-aligned; enrichment only. Content not reviewed. | Motivation and enrichment, not syllabus study. |
| PEN-ED-0010 | NOT YET SCORED | NOT YET SCORED | Low | Single editorial list names the Monash affiliation [S12]. | Explains advanced topics accessibly. | Enrichment, not curriculum-aligned; single source. Content not reviewed. | Enrichment beyond syllabus. |
| PEN-ED-0024 | NOT YET SCORED | NOT YET SCORED | Medium | Channel self-description via directory [S25]; student-community recommendation [S23][S26]. | Large topic library with daily practice sets (community). | URL not captured; video count dated. Content not reviewed. | GCSE maths practice. |
| PEN-ED-0025 | NOT YET SCORED | NOT YET SCORED | Low | Three independent UK sources recommend it [S21][S24][S26]. | Topic and exam-question coverage. | School-subscription platform; free scope of YouTube content NOT_VERIFIED. Content not reviewed. | GCSE maths revision. |
| PEN-ED-0026 | NOT YET SCORED | NOT YET SCORED | Low | Student-community recommendation [S23][S26]; own blog describes free videos with limits on other features (first-party) [S83]. | Practice-centred. | YouTube channel URL not captured. Content not reviewed. | GCSE maths past-paper practice. |
| PEN-ED-0027 | NOT YET SCORED | NOT YET SCORED | Low | Directory self-description [S25]; community praise for hard questions [S23]. | Targets difficult questions. | URL not captured. Content not reviewed. | Top-grade GCSE maths practice. |
| PEN-ED-0080 | NOT YET SCORED | NOT YET SCORED | Low | Two weak sources [S43][S80]. | NOT_REVIEWED | Weak sources. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0090 | NOT YET SCORED | NOT YET SCORED | Medium | Editorial list [S35]; undergraduate thesis analyses a Ferretto video's teaching strategy [S34]. | Large ENEM-oriented maths library. | URL not captured; the thesis is small-scale. Content not reviewed. | ENEM mathematics. |

**3.1.E Content discovery**
| Educator_ID | Representative_Video_URLs | Relevant_Playlist_URLs | Topic_Coverage | Practical_Content_Availability | Theory_Content_Availability | Problem_Solving_Availability | Project_Content_Availability | Exam_Question_Practice_Availability | Full_Course_Availability |
|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0001 | <https://www.youtube.com/watch?v=XFDM1ip5HdU> | NOT_CAPTURED | Linear algebra series (16 videos), calculus, differential equations, Fourier transforms, neural networks, quantum computing (creator-listed) | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0002 | NOT_CAPTURED | NOT_CAPTURED | Lectures from pre-algebra through differential equations, plus statistics [S10] | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED |
| PEN-ED-0003 | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED (listed as a maths channel only) [S10] | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0004 | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED in detail; mathematics videos [S11] | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0005 | NOT_CAPTURED | NOT_CAPTURED | In-depth lectures on real analysis, abstract algebra, differential equations, linear algebra, multivariable calculus and financial mathematics for actuaries; Mathematica used (faculty description, 2022) | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED |
| PEN-ED-0006 | NOT_CAPTURED | NOT_CAPTURED | Online differential equations course (Math 2080, 2016), advanced engineering mathematics, abstract algebra (Math 4120, 2010) and advanced linear algebra [S09] | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED |
| PEN-ED-0008 | NOT_CAPTURED | NOT_CAPTURED | Calculus, derivatives, limits, integrals, differential equations, linear algebra [S12][S82] | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0009 | NOT_CAPTURED | NOT_CAPTURED | Mathematics outreach interviews and explanations [S12] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0010 | NOT_CAPTURED | NOT_CAPTURED | Accessible explanations of advanced mathematical ideas [S12] | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0024 | NOT_CAPTURED | NOT_CAPTURED | Over 1,100 videos for KS2, KS3, GCSE and A Level (self-description) [S25] | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |
| PEN-ED-0025 | NOT_CAPTURED | NOT_CAPTURED | GCSE and A Level topic tutorials and exam-question videos [S21] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |
| PEN-ED-0026 | NOT_CAPTURED | NOT_CAPTURED | GCSE and A Level maths videos, practice and past papers [S23] | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |
| PEN-ED-0027 | NOT_CAPTURED | NOT_CAPTURED | GCSE Maths; hardest-question series (community description) [S23][S25] | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |
| PEN-ED-0080 | NOT_CAPTURED | NOT_CAPTURED | JEE Main and Advanced mathematics; centre of mass and rotation suggestions [S43][S80] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |
| PEN-ED-0090 | NOT_CAPTURED | NOT_CAPTURED | ENEM and vestibular maths (set-theory lesson analysed in thesis) [S35][S34] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | SOURCE_DESCRIBED |

**3.1.F Verification and maintenance**
| Educator_ID | Verification_Status | Channel_ID_Verification_Status | Official_Source_References | Last_Verified_Date | Research_Notes | Potential_Duplicates | Record_Version | Corroboration_Level | Entity_Type | Access_Model | Region_Group |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0001 | CHANNEL_VERIFIED_CONTENT_NOT_REVIEWED | SOURCE_CITED (S04, S05); not confirmed on youtube.com | [S01] [S02] [S03] [S04] [S05] [S06] [S07] | 2026-10-24 | Subtitles via community tool; YouTube is unavailable in mainland China, volunteers mirror videos on Bilibili [S02]. | None known | 1 | C2 | Individual-led channel | Free public videos; paid tiers NOT_REVIEWED | North America |
| PEN-ED-0002 | CHANNEL_VERIFIED_CONTENT_NOT_REVIEWED | NOT_CAPTURED | [S10] [S13] | 2026-10-24 | Instructor affiliation NOT_CAPTURED. | None identified | 1 | C2 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0003 | CHANNEL_VERIFIED_CONTENT_NOT_REVIEWED | NOT_CAPTURED | [S10] | 2026-10-24 | Intent label PROBLEM_SOLVING is provisional (prior knowledge, UNVERIFIED this session). | None identified | 1 | C2 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0004 | UNVERIFIED | NOT_CAPTURED | [S11] | 2026-10-24 | Upgrade to VERIFIED when handle is confirmed on youtube.com or an institutional page. | None identified | 1 | C0 | Individual-led channel | Free public videos; other access NOT_REVIEWED | North America |
| PEN-ED-0005 | CHANNEL_VERIFIED_CONTENT_NOT_REVIEWED | NOT_CAPTURED | [S08] | 2026-10-24 | Country not stated in source (institution: Bethel University). | None identified | 1 | C2 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0006 | UNVERIFIED | NOT_CAPTURED | [S09] | 2026-10-24 | Identity corroborated by institutional page; channel URL missing so status stays UNVERIFIED. | None identified | 1 | C2 | University or institution channel | Free public videos; other access NOT_REVIEWED | North America |
| PEN-ED-0008 | UNVERIFIED | NOT_CAPTURED | [S12] [S13] [S82] | 2026-10-24 | - | None identified | 1 | C1 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0009 | UNVERIFIED | NOT_CAPTURED | [S06] [S12] | 2026-10-24 | Producer name from prior knowledge (UNVERIFIED). | None identified | 1 | C1 | Media or publisher | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0010 | UNVERIFIED | NOT_CAPTURED | [S12] | 2026-10-24 | Educator name from prior knowledge; affiliation per S12. | None identified | 1 | C0 | Individual-led channel | Free public videos; other access NOT_REVIEWED | Australia and New Zealand |
| PEN-ED-0024 | UNVERIFIED | NOT_CAPTURED | [S23] [S25] [S26] | 2026-10-24 | - | None identified | 1 | C1 | Individual-led channel | Free public videos; other access NOT_REVIEWED | UK and Ireland |
| PEN-ED-0025 | UNVERIFIED | NOT_CAPTURED | [S21] [S24] [S26] | 2026-10-24 | - | None identified | 1 | C1 | Commercial tutoring or EdTech company | Mixed (platform subscription NOT_VERIFIED) | UK and Ireland |
| PEN-ED-0026 | UNVERIFIED | NOT_CAPTURED | [S23] [S26] [S83] | 2026-10-24 | - | None identified | 1 | C1 | Commercial tutoring or EdTech company | Mixed | UK and Ireland |
| PEN-ED-0027 | UNVERIFIED | NOT_CAPTURED | [S23] [S25] | 2026-10-24 | - | None identified | 1 | C1 | Commercial tutoring or EdTech company | Free public videos; other access NOT_REVIEWED | UK and Ireland |
| PEN-ED-0080 | UNVERIFIED | NOT_CAPTURED | [S43] [S80] | 2026-10-24 | - | None identified | 1 | C0 | Individual-led channel | Free public videos; other access NOT_REVIEWED | India and South Asia |
| PEN-ED-0090 | UNVERIFIED | NOT_CAPTURED | [S34] [S35] | 2026-10-24 | - | None identified | 1 | C1 | Individual-led channel | Free public videos; other access NOT_REVIEWED | Latin America |

### 3.2 Natural Sciences (12 records)
**3.2.A Identity**
| Educator_ID | Educator_Name | Channel_Name | Channel_URL | YouTube_Channel_ID | Channel_Handle | Official_Website | Country_or_Region | Primary_Language | Additional_Languages |
|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0012 | Ramamurti Shankar (Yale University) | Fundamentals of Physics (Yale lectures) | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | United States | English | NOT_CAPTURED |
| PEN-ED-0014 | MinutePhysics | MinutePhysics | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0015 | The Physics Classroom | The Physics Classroom | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0017 | University of Nottingham | Periodic Table of Videos | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | United Kingdom | English | NOT_CAPTURED |
| PEN-ED-0018 | Amoeba Sisters | Amoeba Sisters | <https://www.youtube.com/amoebasisters> | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0019 | NOT_CAPTURED | Free Science Lessons | <https://www.youtube.com/@Freesciencelessons> | NOT_CAPTURED | @Freesciencelessons | NOT_CAPTURED | United Kingdom | English | NOT_CAPTURED |
| PEN-ED-0020 | NOT_CAPTURED | Cognito | <https://www.youtube.com/@Cognitoedu> | NOT_CAPTURED | @Cognitoedu | NOT_CAPTURED | United Kingdom | English | NOT_CAPTURED |
| PEN-ED-0021 | Lewis Matheson | Physics Online | <https://www.youtube.com/@PhysicsOnline> | NOT_CAPTURED | @PhysicsOnline | NOT_CAPTURED | United Kingdom | English | NOT_CAPTURED |
| PEN-ED-0022 | NOT_CAPTURED | Z-Physics | <https://www.youtube.com/@zhelyo_physics> | NOT_CAPTURED | @zhelyo_physics | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0079 | Ashish Arora (UNVERIFIED name) | Physics Galaxy | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | India | Hindi | NOT_CAPTURED |
| PEN-ED-0086 | PMF IAS | PMF IAS | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | India | English | NOT_CAPTURED |
| PEN-ED-0094 | Paulo Jubilut | Professor Jubilut | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | Brazil | Portuguese | NOT_CAPTURED |

**3.2.B Educational classification**
| Educator_ID | Educational_Domain | Subject | Subdomain | Topic | Educational_Level | Target_Audience | Teaching_Format | Learning_Objective |
|---|---|---|---|---|---|---|---|---|
| PEN-ED-0012 | D02 Natural Sciences | D02.01 Physics | D02.01.01 Classical mechanics; D02.01.02 Electricity and magnetism | NOT_APPLICABLE | University (introductory) | Undergraduates | Recorded university lectures | COMPLETE_COURSE, THEORETICAL_STUDY |
| PEN-ED-0014 | D02 Natural Sciences | D02.01 Physics | D02.01.06 Modern physics | NOT_APPLICABLE | General audience | Curious learners | Whiteboard animation explainers | FOUNDATIONAL_CONCEPTS |
| PEN-ED-0015 | D02 Natural Sciences | D02.01 Physics | D02.01.01 Classical mechanics; D02.01.05 Waves and optics | NOT_APPLICABLE | School | High-school learners | NOT_REVIEWED | FOUNDATIONAL_CONCEPTS |
| PEN-ED-0017 | D02 Natural Sciences | D02.02 Chemistry | D02.02.01 General chemistry; D02.02.03 Inorganic chemistry | NOT_APPLICABLE | General audience to School | Learners and teachers | Demonstration videos | LABORATORY_DEMONSTRATIONS, FOUNDATIONAL_CONCEPTS |
| PEN-ED-0018 | D02 Natural Sciences | D02.03 Biology | D02.03.01 Cell biology; D02.03.03 Genetics | NOT_APPLICABLE | School (KS4-KS5 revision) | Secondary students | Animated explainers | REVISION, FOUNDATIONAL_CONCEPTS |
| PEN-ED-0019 | D02 Natural Sciences | D02.03 Biology; D02.02 Chemistry; D02.01 Physics | NOT_APPLICABLE | NOT_APPLICABLE | KS4 (GCSE) to A Level | UK secondary students | Teacher-led lessons | EXAM_PREPARATION, REVISION, COMPLETE_COURSE |
| PEN-ED-0020 | D02 Natural Sciences; D01 Mathematics | D02.03 Biology; D02.02 Chemistry; D02.01 Physics; D01.04 Algebra | NOT_APPLICABLE | NOT_APPLICABLE | KS3-KS4 (GCSE) | UK secondary students | Short animated and teacher-led videos | REVISION, EXAM_PREPARATION |
| PEN-ED-0021 | D02 Natural Sciences | D02.01 Physics | NOT_APPLICABLE | NOT_APPLICABLE | GCSE to A Level | UK secondary students | Teacher-led lessons and paper walkthroughs | EXAM_PREPARATION, PROBLEM_SOLVING |
| PEN-ED-0022 | D02 Natural Sciences | D02.01 Physics | NOT_APPLICABLE | NOT_APPLICABLE | A Level | UK sixth-form students | Paper walkthroughs | EXAM_PREPARATION, PROBLEM_SOLVING |
| PEN-ED-0079 | D02 Natural Sciences | D02.01 Physics | D02.01.01 Classical mechanics | NOT_APPLICABLE | Pre-university | JEE aspirants | Lectures | EXAM_PREPARATION, CONCEPTUAL_DEPTH |
| PEN-ED-0086 | D02 Natural Sciences | D02.04 Earth and Space Sciences | D02.04.02 Geography | NOT_APPLICABLE | Professional (civil services) | UPSC aspirants | Lectures | EXAM_PREPARATION |
| PEN-ED-0094 | D02 Natural Sciences | D02.01 Physics; D02.02 Chemistry | NOT_APPLICABLE | NOT_APPLICABLE | Secondary | ENEM candidates | Explainers and lives | EXAM_PREPARATION, REVISION |

**3.2.C Examination classification**
| Educator_ID | Examination_Name | Examination_Category | Country_or_Jurisdiction | School_Board | Curriculum | Syllabus_Coverage | Exam_Preparation_Specialization | Official_Affiliation_Status |
|---|---|---|---|---|---|---|---|---|
| PEN-ED-0012 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Yale University (Josiah Willard Gibbs professor of Physics per S16) |
| PEN-ED-0014 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent creator |
| PEN-ED-0015 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | NOT_VERIFIED |
| PEN-ED-0017 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | University of Nottingham (per S19) |
| PEN-ED-0018 | None (board alignment NOT_VERIFIED) | SCHOOL_LEAVING | United Kingdom | NOT_VERIFIED | GCSE and A Level (AQA, OCR, Pearson Edexcel, WJEC/Eduqas) | NOT_VERIFIED against official syllabus | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent creator |
| PEN-ED-0019 | GCSE sciences; A Level sciences | SCHOOL_LEAVING | United Kingdom | UK GCSE/A Level (specific boards NOT_VERIFIED) | GCSE and A Level (AQA, OCR, Pearson Edexcel, WJEC/Eduqas) | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Independent teacher; not an exam board |
| PEN-ED-0020 | GCSE sciences | SCHOOL_LEAVING | United Kingdom | NOT_VERIFIED | GCSE and A Level (AQA, OCR, Pearson Edexcel, WJEC/Eduqas) | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Commercial education platform; not an exam board |
| PEN-ED-0021 | GCSE Physics; A Level Physics (OCR) | SCHOOL_LEAVING | United Kingdom | OCR (paper walkthroughs per S20) | GCSE and A Level (AQA, OCR, Pearson Edexcel, WJEC/Eduqas) | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Independent; not an exam board |
| PEN-ED-0022 | A Level Physics (OCR) | SCHOOL_LEAVING | United Kingdom | OCR (per S20) | GCSE and A Level (AQA, OCR, Pearson Edexcel, WJEC/Eduqas) | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Independent |
| PEN-ED-0079 | JEE Main; JEE Advanced | UNIVERSITY_ENTRANCE | India | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Commercial |
| PEN-ED-0086 | UPSC Civil Services Examination | CIVIL_SERVICE | India | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Commercial |
| PEN-ED-0094 | ENEM | UNIVERSITY_ENTRANCE | Brazil | NOT_VERIFIED | BNCC and ENEM pathway | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Independent |

**3.2.D Quality and evidence**
| Educator_ID | Component scores (8 fields) | Overall_Score | Confidence_Level | Evidence_Summary | Strengths | Limitations | Best_For |
|---|---|---|---|---|---|---|---|
| PEN-ED-0012 | NOT YET SCORED | NOT YET SCORED | Low | University library guide lists the two series as YouTube channels and states the lecturer's chair [S16]; forum mention of Yale physics lectures [S18]. | Introductory university physics by a senior professor. | Exact channel names and URLs not captured. Content not reviewed. | Rigorous introductory university physics. |
| PEN-ED-0014 | NOT YET SCORED | NOT YET SCORED | Low | Listed on a university physics demonstration facility's channel list [S15] and in editorial list [S19]. | Concise concept hooks. | Enrichment, not syllabus-aligned. Content not reviewed. | Motivation and short concept intros. |
| PEN-ED-0015 | NOT YET SCORED | NOT YET SCORED | Low | Listed on a university physics demonstration facility's channel list [S15]. | NOT_REVIEWED | Single institutional listing; scope not verified. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0017 | NOT YET SCORED | NOT YET SCORED | Low | Editorial list (2013) calls it a leading chemistry resource [S19]. | University-run demonstrations. | Source is dated (2013); current activity not checked. Content not reviewed. | Chemistry demonstrations. |
| PEN-ED-0018 | NOT YET SCORED | NOT YET SCORED | Low | School revision guide lists the channel URL and purpose [S20]. | Concise visual biology explanations. | Alignment to UK specifications not verified; region NOT_CAPTURED. Content not reviewed. | Visual biology revision. |
| PEN-ED-0019 | NOT YET SCORED | NOT YET SCORED | Medium | Handle URL in a school revision guide [S20]; college and student-community recommendations [S21][S26]. | Covers all three sciences (source-described). | Specification-by-specification alignment not checked. Content not reviewed. | GCSE science revision. |
| PEN-ED-0020 | NOT YET SCORED | NOT YET SCORED | Medium | Handle URL in school revision guide [S20]; student-community mention [S26]; a competitor's blog states video lessons are free to individuals (first-party competitor claim, treat cautiously) [S83]. | Compact topic-by-topic coverage. | Freemium platform; paid features NOT_VERIFIED. Content not reviewed. | Fast GCSE science revision. |
| PEN-ED-0021 | NOT YET SCORED | NOT YET SCORED | Medium | Handle URL and OCR walkthrough note in school guide [S20]; channel self-description names the educator [S25]. | Exam-paper walkthroughs. | Other boards NOT_VERIFIED. Content not reviewed. | OCR A Level Physics paper practice. |
| PEN-ED-0022 | NOT YET SCORED | NOT YET SCORED | Low | Handle URL in a school revision guide [S20]. | OCR paper walkthroughs. | Single source; quality not reviewed. Content not reviewed. | OCR A Level Physics practice. |
| PEN-ED-0079 | NOT YET SCORED | NOT YET SCORED | Low | Three sources, one low-reliability [S43][S42][S80]. | Concept clarity (source-described). | Weak sources; URL not captured. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0086 | NOT YET SCORED | NOT YET SCORED | Low | Single community mention [S50]. | NOT_REVIEWED | Single source. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0094 | NOT YET SCORED | NOT YET SCORED | Low | Two editorial sources [S35][S39]. | NOT_REVIEWED | Dated sources. Content not reviewed. | REQUIRES FURTHER RESEARCH |

**3.2.E Content discovery**
| Educator_ID | Representative_Video_URLs | Relevant_Playlist_URLs | Topic_Coverage | Practical_Content_Availability | Theory_Content_Availability | Problem_Solving_Availability | Project_Content_Availability | Exam_Question_Practice_Availability | Full_Course_Availability |
|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0012 | NOT_CAPTURED | NOT_CAPTURED | Physics I mechanics and Physics II electricity and magnetism [S16] | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED |
| PEN-ED-0014 | NOT_CAPTURED | NOT_CAPTURED | Short physics explainers; curated by a university lecture-demonstration office [S15] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0015 | NOT_CAPTURED | NOT_CAPTURED | Introductory physics (NOT_REVIEWED) | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0017 | NOT_CAPTURED | NOT_CAPTURED | Element-by-element chemistry videos [S19] | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0018 | NOT_CAPTURED | NOT_CAPTURED | Biology revision content (used for KS5 Biology by a UK school) [S20] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0019 | NOT_CAPTURED | NOT_CAPTURED | GCSE and A Level sciences; teacher-led lessons on all topics [S20][S21] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | SOURCE_DESCRIBED |
| PEN-ED-0020 | NOT_CAPTURED | NOT_CAPTURED | Concise video run-throughs of every KS3/KS4 science topic [S20]; maths also offered [S26] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |
| PEN-ED-0021 | NOT_CAPTURED | NOT_CAPTURED | GCSE and A Level physics; OCR paper walkthroughs [S20]; hundreds of supporting videos [S25] | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |
| PEN-ED-0022 | NOT_CAPTURED | NOT_CAPTURED | OCR paper walkthroughs [S20] | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |
| PEN-ED-0079 | NOT_CAPTURED | NOT_CAPTURED | Deep mechanics concepts for JEE Main and Advanced [S43] | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |
| PEN-ED-0086 | NOT_CAPTURED | NOT_CAPTURED | Geography for UPSC [S50] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |
| PEN-ED-0094 | NOT_CAPTURED | NOT_CAPTURED | Science for ENEM, with live Q&A [S35][S39] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |

**3.2.F Verification and maintenance**
| Educator_ID | Verification_Status | Channel_ID_Verification_Status | Official_Source_References | Last_Verified_Date | Research_Notes | Potential_Duplicates | Record_Version | Corroboration_Level | Entity_Type | Access_Model | Region_Group |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0012 | UNVERIFIED | NOT_CAPTURED | [S16] [S18] | 2026-10-24 | - | None identified | 1 | C2 | University or institution channel | Free public videos; other access NOT_REVIEWED | North America |
| PEN-ED-0014 | UNVERIFIED | NOT_CAPTURED | [S15] [S19] | 2026-10-24 | - | None identified | 1 | C1 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0015 | UNVERIFIED | NOT_CAPTURED | [S15] | 2026-10-24 | - | None identified | 1 | C0 | Commercial tutoring or EdTech company | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0017 | UNVERIFIED | NOT_CAPTURED | [S19] | 2026-10-24 | - | None identified | 1 | C0 | University or institution channel | Free public videos; other access NOT_REVIEWED | UK and Ireland |
| PEN-ED-0018 | CHANNEL_VERIFIED_CONTENT_NOT_REVIEWED | NOT_CAPTURED | [S20] | 2026-10-24 | - | None identified | 1 | C2 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0019 | CHANNEL_VERIFIED_CONTENT_NOT_REVIEWED | NOT_CAPTURED | [S20] [S21] [S26] | 2026-10-24 | - | None identified | 1 | C2 | Individual-led channel | Free public videos; other access NOT_REVIEWED | UK and Ireland |
| PEN-ED-0020 | CHANNEL_VERIFIED_CONTENT_NOT_REVIEWED | NOT_CAPTURED | [S20] [S26] [S83] | 2026-10-24 | - | None identified | 1 | C2 | Commercial tutoring or EdTech company | Mixed (free videos; platform subscription NOT_VERIFIED) | UK and Ireland |
| PEN-ED-0021 | CHANNEL_VERIFIED_CONTENT_NOT_REVIEWED | NOT_CAPTURED | [S20] [S25] | 2026-10-24 | - | None identified | 1 | C2 | Individual-led channel | Free public videos; other access NOT_REVIEWED | UK and Ireland |
| PEN-ED-0022 | CHANNEL_VERIFIED_CONTENT_NOT_REVIEWED | NOT_CAPTURED | [S20] | 2026-10-24 | - | None identified | 1 | C2 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0079 | UNVERIFIED | NOT_CAPTURED | [S42] [S43] [S80] | 2026-10-24 | - | None identified | 1 | C1 | Commercial tutoring or EdTech company | Free public videos; other access NOT_REVIEWED | India and South Asia |
| PEN-ED-0086 | UNVERIFIED | NOT_CAPTURED | [S50] | 2026-10-24 | - | None identified | 1 | C0 | Commercial tutoring or EdTech company | Free public videos; other access NOT_REVIEWED | India and South Asia |
| PEN-ED-0094 | UNVERIFIED | NOT_CAPTURED | [S35] [S39] | 2026-10-24 | - | None identified | 1 | C1 | Individual-led channel | Free public videos; other access NOT_REVIEWED | Latin America |

### 3.3 Computer Science and Information Technology (16 records)
**3.3.A Identity**
| Educator_ID | Educator_Name | Channel_Name | Channel_URL | YouTube_Channel_ID | Channel_Handle | Official_Website | Country_or_Region | Primary_Language | Additional_Languages |
|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0031 | Harvard University (CS50 team) | CS50 | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | United States | English | NOT_CAPTURED |
| PEN-ED-0032 | freeCodeCamp | freeCodeCamp.org | <https://www.youtube.com/c/Freecodecamp> | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | English | NOT_CAPTURED |
| PEN-ED-0033 | Mosh Hamedani (UNVERIFIED name) | Programming with Mosh | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0034 | Abdul Bari | Abdul Bari | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0035 | NeetCode | NeetCode / NeetCodeIO | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0036 | takeUforward | takeUforward | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0037 | YK Sugishita | CS Dojo | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0038 | mycodeschool | mycodeschool | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0039 | Traversy Media | Traversy Media | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0040 | Fireship | Fireship | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0041 | Neso Academy | Neso Academy | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0071 | Stephane Maarek | Stephane Maarek | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0072 | Digital Cloud Training | Digital Cloud Training | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0073 | Andrew Brown | ExamPro | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | <https://www.exampro.co> | Canada (UNVERIFIED) | English | NOT_CAPTURED |
| PEN-ED-0074 | John Savill | John Savill's Technical Training | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0089 | Ravindrababu Ravula | GATE Lectures by Ravindrababu Ravula | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | India | English | NOT_CAPTURED |

**3.3.B Educational classification**
| Educator_ID | Educational_Domain | Subject | Subdomain | Topic | Educational_Level | Target_Audience | Teaching_Format | Learning_Objective |
|---|---|---|---|---|---|---|---|---|
| PEN-ED-0031 | D03 Computer Science and Information Technology | D03.01 Computer fundamentals; D03.02 Programming fundamentals; D03.05 C; D03.03 Python; D03.19 Web development | NOT_APPLICABLE | NOT_APPLICABLE | Beginner to University | First-time programmers and undergraduates | Recorded lectures | COMPLETE_COURSE, FOUNDATIONAL_CONCEPTS |
| PEN-ED-0032 | D03 Computer Science and Information Technology; D04 Artificial Intelligence and Data | D03.02 Programming fundamentals; D03.03 Python; D03.08 JavaScript; D03.19 Web development; D04.14 Data science; D03.32 Cloud computing | NOT_APPLICABLE | NOT_APPLICABLE | Beginner to Intermediate | Self-taught learners | Coding walkthroughs and full courses | COMPLETE_COURSE, PRACTICAL_TUTORIALS, PROJECT_BASED_LEARNING |
| PEN-ED-0033 | D03 Computer Science and Information Technology | D03.03 Python; D03.04 Java; D03.07 C#; D03.19 Web development | NOT_APPLICABLE | NOT_APPLICABLE | Beginner | Beginners and career changers | Structured tutorials | PRACTICAL_TUTORIALS, COMPLETE_COURSE |
| PEN-ED-0034 | D03 Computer Science and Information Technology | D03.15 Data structures and algorithms; D03.01 Computer fundamentals | NOT_APPLICABLE | NOT_APPLICABLE | University | CS students and interview candidates | Whiteboard lectures | THEORETICAL_STUDY, CONCEPTUAL_DEPTH |
| PEN-ED-0035 | D03 Computer Science and Information Technology | D03.15 Data structures and algorithms; D03.18 Competitive programming | NOT_APPLICABLE | NOT_APPLICABLE | Intermediate | Interview candidates | Problem walkthroughs | PROBLEM_SOLVING, CAREER_ORIENTED_SKILLS |
| PEN-ED-0036 | D03 Computer Science and Information Technology | D03.15 Data structures and algorithms | NOT_APPLICABLE | NOT_APPLICABLE | Intermediate | Placement and interview candidates | Problem walkthroughs | PROBLEM_SOLVING, CAREER_ORIENTED_SKILLS |
| PEN-ED-0037 | D03 Computer Science and Information Technology | D03.15 Data structures and algorithms; D03.02 Programming fundamentals | NOT_APPLICABLE | NOT_APPLICABLE | Beginner to Intermediate | Beginners and interview candidates | Explainer videos | CAREER_ORIENTED_SKILLS, FOUNDATIONAL_CONCEPTS |
| PEN-ED-0038 | D03 Computer Science and Information Technology | D03.15 Data structures and algorithms | NOT_APPLICABLE | NOT_APPLICABLE | Beginner to Intermediate | CS students | Whiteboard lectures | FOUNDATIONAL_CONCEPTS |
| PEN-ED-0039 | D03 Computer Science and Information Technology | D03.19 Web development; D03.08 JavaScript | NOT_APPLICABLE | NOT_APPLICABLE | Beginner to Intermediate | Web learners | Project tutorials | PROJECT_BASED_LEARNING, PRACTICAL_TUTORIALS |
| PEN-ED-0040 | D03 Computer Science and Information Technology | D03.08 JavaScript; D03.33 DevOps | NOT_APPLICABLE | NOT_APPLICABLE | Intermediate | Developers | Short overview videos | CAREER_ORIENTED_SKILLS |
| PEN-ED-0041 | D03 Computer Science and Information Technology; D05 Engineering | D03.01 Computer fundamentals; D05.30 Analog and digital electronics | NOT_APPLICABLE | NOT_APPLICABLE | University | GATE and engineering students | Lecture videos | EXAM_PREPARATION, THEORETICAL_STUDY |
| PEN-ED-0071 | D03 Computer Science and Information Technology | D03.32 Cloud computing | NOT_APPLICABLE | NOT_APPLICABLE | Intermediate | AWS certification candidates | Course lectures | PROFESSIONAL_CERTIFICATION |
| PEN-ED-0072 | D03 Computer Science and Information Technology | D03.32 Cloud computing | NOT_APPLICABLE | NOT_APPLICABLE | Intermediate | AWS candidates | Course lectures | PROFESSIONAL_CERTIFICATION |
| PEN-ED-0073 | D03 Computer Science and Information Technology | D03.32 Cloud computing | NOT_APPLICABLE | NOT_APPLICABLE | Beginner to Intermediate | Cloud candidates | Full courses and practice exams | PROFESSIONAL_CERTIFICATION, COMPLETE_COURSE |
| PEN-ED-0074 | D03 Computer Science and Information Technology | D03.32 Cloud computing | NOT_APPLICABLE | NOT_APPLICABLE | Intermediate to Advanced | Azure candidates | Lectures | PROFESSIONAL_CERTIFICATION |
| PEN-ED-0089 | D03 Computer Science and Information Technology | D03.01 Computer fundamentals; D03.15 Data structures and algorithms | NOT_APPLICABLE | NOT_APPLICABLE | University | GATE CS aspirants | Lectures | EXAM_PREPARATION |

**3.3.C Examination classification**
| Educator_ID | Examination_Name | Examination_Category | Country_or_Jurisdiction | School_Board | Curriculum | Syllabus_Coverage | Exam_Preparation_Specialization | Official_Affiliation_Status |
|---|---|---|---|---|---|---|---|---|
| PEN-ED-0031 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Harvard University course |
| PEN-ED-0032 | None (certification content: see Section 6) | IT_CERT | International | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent nonprofit |
| PEN-ED-0033 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent |
| PEN-ED-0034 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent |
| PEN-ED-0035 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent |
| PEN-ED-0036 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent |
| PEN-ED-0037 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent |
| PEN-ED-0038 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent |
| PEN-ED-0039 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent |
| PEN-ED-0040 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent |
| PEN-ED-0041 | GATE | UNIVERSITY_ENTRANCE | India | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Independent platform |
| PEN-ED-0071 | AWS certifications | IT_CERT | International | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent instructor; not AWS |
| PEN-ED-0072 | AWS certifications | IT_CERT | International | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | NOT_EXAM_SPECIALIST_PER_SOURCES | Commercial; not AWS |
| PEN-ED-0073 | AWS; Azure; GCP certifications | IT_CERT | International | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | NOT_EXAM_SPECIALIST_PER_SOURCES | Commercial; not a cloud provider |
| PEN-ED-0074 | Azure certifications | IT_CERT | International | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent (Microsoft relationship per S64 'Microsoft PM' - UNVERIFIED) |
| PEN-ED-0089 | GATE (CS/IT) | UNIVERSITY_ENTRANCE | India | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Independent educator |

**3.3.D Quality and evidence**
| Educator_ID | Component scores (8 fields) | Overall_Score | Confidence_Level | Evidence_Summary | Strengths | Limitations | Best_For |
|---|---|---|---|---|---|---|---|
| PEN-ED-0031 | NOT YET SCORED | NOT YET SCORED | Medium | Independent lists identify it as Harvard's introductory course freely on YouTube [S56][S57]. | University-designed progression. | Channel URL not captured. Content not reviewed. | Structured introduction to programming. |
| PEN-ED-0032 | NOT YET SCORED | NOT YET SCORED | Medium | Channel URL in university resource list [S10]; nonprofit status and structured courses [S55][S54]; hosts third-party instructor courses (e.g. cloud) [S65]. | Free structured full courses. | Quality varies by guest instructor; website not captured. Content not reviewed. | Free full courses with hands-on coding. |
| PEN-ED-0033 | NOT YET SCORED | NOT YET SCORED | Low | Three independent lists [S52][S54][S56]. | Structured beginner courses (source-described). | URL not captured; paid courses exist alongside free videos. Content not reviewed. | Beginner structured tutorials. |
| PEN-ED-0034 | NOT YET SCORED | NOT YET SCORED | Low | Named in four independent sources [S52][S53][S54][S57]. | University-level algorithm explanations (source-described). | URL and country not captured. Content not reviewed. | Algorithm theory. |
| PEN-ED-0035 | NOT YET SCORED | NOT YET SCORED | Low | Single community article [S53]. | Problem-solving walkthroughs. | Two channels - duplicate resolution needed; URLs not captured. Content not reviewed. | Coding-interview practice. |
| PEN-ED-0036 | NOT YET SCORED | NOT YET SCORED | Low | Single community article [S53]. | NOT_REVIEWED | Single source. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0037 | NOT YET SCORED | NOT YET SCORED | Low | Editorial list names the creator [S54]. | NOT_REVIEWED | Single source. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0038 | NOT YET SCORED | NOT YET SCORED | Low | Editorial list; notes channel has not been updated recently [S54]. | Fundamentals (source-described). | Not recently updated per S54 (recency risk). Content not reviewed. | Timeless DSA fundamentals after review. |
| PEN-ED-0039 | NOT YET SCORED | NOT YET SCORED | Low | Single commercial list [S56]; no second reliable source retrieved. | NOT_REVIEWED | Evidence thin. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0040 | NOT YET SCORED | NOT YET SCORED | Low | Mentioned in a commercial list [S56]. | Fast overviews. | Not designed for deep study. Content not reviewed. | Rapid orientation to tools. |
| PEN-ED-0041 | NOT YET SCORED | NOT YET SCORED | Low | Community Q&A describes it as GATE-level [S51]. | NOT_REVIEWED | Single community source; URL not captured. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0071 | NOT YET SCORED | NOT YET SCORED | Low | Commercial lists [S64]. | Exam-aligned (source-described). | Cert versions change; paid courses sit behind free videos. Content not reviewed. | AWS exam prep (verify current exam version). |
| PEN-ED-0072 | NOT YET SCORED | NOT YET SCORED | Low | Commercial list [S64]. | NOT_REVIEWED | Single source. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0073 | NOT YET SCORED | NOT YET SCORED | Low | First-party article by the founder [S65]; independent list [S64]; country inferred from a flag on the author byline in S65 (location not stated) - UNVERIFIED. | Free full courses. | Cert exam versions change; pass-rate claims unverified. Content not reviewed. | Free certification primers. |
| PEN-ED-0074 | NOT YET SCORED | NOT YET SCORED | Low | Commercial list [S64]. | NOT_REVIEWED | Single source. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0089 | NOT YET SCORED | NOT YET SCORED | Low | Single news source [S48]. | NOT_REVIEWED | Single source. Content not reviewed. | REQUIRES FURTHER RESEARCH |

**3.3.E Content discovery**
| Educator_ID | Representative_Video_URLs | Relevant_Playlist_URLs | Topic_Coverage | Practical_Content_Availability | Theory_Content_Availability | Problem_Solving_Availability | Project_Content_Availability | Exam_Question_Practice_Availability | Full_Course_Availability |
|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0031 | NOT_CAPTURED | NOT_CAPTURED | Introductory CS; web programming course [S56] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED |
| PEN-ED-0032 | NOT_CAPTURED | NOT_CAPTURED | Long full-course videos across programming, data and cloud; ordered course structure [S55] | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | SOURCE_DESCRIBED |
| PEN-ED-0033 | NOT_CAPTURED | NOT_CAPTURED | Python, Java, C#, web development [S54][S56] | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED |
| PEN-ED-0034 | NOT_CAPTURED | NOT_CAPTURED | Algorithms and data structures with hand-drawn visualisations [S54]; theory-leaning [S52] | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0035 | NOT_CAPTURED | NOT_CAPTURED | LeetCode-style problem walkthroughs (two similar channels) [S53] | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0036 | NOT_CAPTURED | NOT_CAPTURED | DSA courses (community recommendation) [S53] | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0037 | NOT_CAPTURED | NOT_CAPTURED | CS concepts and interview preparation [S54] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0038 | NOT_CAPTURED | NOT_CAPTURED | Fundamental DSA (editorial) [S54] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0039 | NOT_CAPTURED | NOT_CAPTURED | Web development tutorials [S56] | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0040 | NOT_CAPTURED | NOT_CAPTURED | Short modern-tech overviews [S56] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0041 | NOT_CAPTURED | NOT_CAPTURED | GATE-level concepts (community) [S51] | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |
| PEN-ED-0071 | NOT_CAPTURED | NOT_CAPTURED | AWS certification overviews alongside paid courses [S64] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0072 | NOT_CAPTURED | NOT_CAPTURED | Full AWS exam-training courses with practice labs [S64] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0073 | NOT_CAPTURED | NOT_CAPTURED | Multi-cloud certification prep: AWS, Azure, GCP; free full courses also published on freeCodeCamp [S65][S64] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED |
| PEN-ED-0074 | NOT_CAPTURED | NOT_CAPTURED | Azure certification preparation [S64] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0089 | NOT_CAPTURED | NOT_CAPTURED | GATE CS/IT classes [S48] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |

**3.3.F Verification and maintenance**
| Educator_ID | Verification_Status | Channel_ID_Verification_Status | Official_Source_References | Last_Verified_Date | Research_Notes | Potential_Duplicates | Record_Version | Corroboration_Level | Entity_Type | Access_Model | Region_Group |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0031 | UNVERIFIED | NOT_CAPTURED | [S56] [S57] | 2026-10-24 | - | None identified | 1 | C1 | University or institution channel | Free public videos; other access NOT_REVIEWED | North America |
| PEN-ED-0032 | CHANNEL_VERIFIED_CONTENT_NOT_REVIEWED | NOT_CAPTURED | [S10] [S54] [S55] [S65] | 2026-10-24 | Many cloud courses are authored by guest instructors; evaluate per playlist. | None identified | 1 | C2 | Nonprofit organisation | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0033 | UNVERIFIED | NOT_CAPTURED | [S52] [S54] [S56] | 2026-10-24 | - | None identified | 1 | C1 | Individual-led channel | Mixed | NOT_CAPTURED |
| PEN-ED-0034 | UNVERIFIED | NOT_CAPTURED | [S52] [S53] [S54] [S57] | 2026-10-24 | - | None identified | 1 | C1 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0035 | UNVERIFIED | NOT_CAPTURED | [S53] | 2026-10-24 | - | NeetCode vs NeetCodeIO: related, not duplicates (per S53) - confirm | 1 | C0 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0036 | UNVERIFIED | NOT_CAPTURED | [S53] | 2026-10-24 | - | None identified | 1 | C0 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0037 | UNVERIFIED | NOT_CAPTURED | [S54] | 2026-10-24 | - | None identified | 1 | C0 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0038 | UNVERIFIED | NOT_CAPTURED | [S54] | 2026-10-24 | Recency flag from source. | None identified | 1 | C0 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0039 | UNVERIFIED | NOT_CAPTURED | [S56] | 2026-10-24 | - | None identified | 1 | C0 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0040 | UNVERIFIED | NOT_CAPTURED | [S56] | 2026-10-24 | - | None identified | 1 | C0 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0041 | UNVERIFIED | NOT_CAPTURED | [S51] | 2026-10-24 | - | None identified | 1 | C0 | Commercial tutoring or EdTech company | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0071 | UNVERIFIED | NOT_CAPTURED | [S64] | 2026-10-24 | - | None identified | 1 | C0 | Individual-led channel | Mixed | NOT_CAPTURED |
| PEN-ED-0072 | UNVERIFIED | NOT_CAPTURED | [S64] | 2026-10-24 | - | None identified | 1 | C0 | Commercial tutoring or EdTech company | Mixed | NOT_CAPTURED |
| PEN-ED-0073 | UNVERIFIED | NOT_CAPTURED | [S64] [S65] | 2026-10-24 | - | None identified | 1 | C1 | Commercial tutoring or EdTech company | Mixed | North America |
| PEN-ED-0074 | UNVERIFIED | NOT_CAPTURED | [S64] | 2026-10-24 | - | None identified | 1 | C0 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0089 | UNVERIFIED | NOT_CAPTURED | [S48] | 2026-10-24 | - | None identified | 1 | C0 | Individual-led channel | Free public videos; other access NOT_REVIEWED | India and South Asia |

### 3.4 Artificial Intelligence and Data (8 records)
**3.4.A Identity**
| Educator_ID | Educator_Name | Channel_Name | Channel_URL | YouTube_Channel_ID | Channel_Handle | Official_Website | Country_or_Region | Primary_Language | Additional_Languages |
|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0042 | Andrej Karpathy | Andrej Karpathy | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0043 | Josh Starmer | StatQuest with Josh Starmer | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0044 | Andrew Ng and DeepLearning.AI | DeepLearning.AI | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0045 | Stanford University | Stanford Online | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | United States | English | NOT_CAPTURED |
| PEN-ED-0046 | Jeremy Howard (fast.ai) | fast.ai | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0047 | Sebastian Raschka | Sebastian Raschka | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0048 | Yannic Kilcher | Yannic Kilcher | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0049 | Krish Naik | Krish Naik | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |

**3.4.B Educational classification**
| Educator_ID | Educational_Domain | Subject | Subdomain | Topic | Educational_Level | Target_Audience | Teaching_Format | Learning_Objective |
|---|---|---|---|---|---|---|---|---|
| PEN-ED-0042 | D04 Artificial Intelligence and Data | D04.03 Deep learning; D04.25 Neural networks; D04.05 Large language models | NOT_APPLICABLE | NOT_APPLICABLE | Intermediate to Advanced | Programmers learning deep learning | Lecture plus live coding | CONCEPTUAL_DEPTH, PRACTICAL_TUTORIALS, PROJECT_BASED_LEARNING |
| PEN-ED-0043 | D04 Artificial Intelligence and Data; D01 Mathematics | D04.17 Statistics for data science; D04.02 Machine learning; D01.18 Statistics | NOT_APPLICABLE | NOT_APPLICABLE | Beginner to Intermediate | Data and ML learners | Illustrated explanations | FOUNDATIONAL_CONCEPTS, CONCEPTUAL_DEPTH |
| PEN-ED-0044 | D04 Artificial Intelligence and Data | D04.02 Machine learning; D04.03 Deep learning; D04.04 Generative AI; D04.20 MLOps | NOT_APPLICABLE | NOT_APPLICABLE | Intermediate to Advanced | AI practitioners | Structured lectures | COMPLETE_COURSE, CAREER_ORIENTED_SKILLS |
| PEN-ED-0045 | D04 Artificial Intelligence and Data | D04.02 Machine learning; D04.07 Computer vision; D04.05 Large language models | NOT_APPLICABLE | NOT_APPLICABLE | University to Postgraduate | Graduate-level learners | Recorded university lectures | RESEARCH_LEVEL, THEORETICAL_STUDY, COMPLETE_COURSE |
| PEN-ED-0046 | D04 Artificial Intelligence and Data | D04.03 Deep learning | NOT_APPLICABLE | NOT_APPLICABLE | Intermediate | Coders | Course lectures | PRACTICAL_TUTORIALS, COMPLETE_COURSE |
| PEN-ED-0047 | D04 Artificial Intelligence and Data | D04.05 Large language models; D04.02 Machine learning | NOT_APPLICABLE | NOT_APPLICABLE | Intermediate to Advanced | ML practitioners | Lectures and code | CONCEPTUAL_DEPTH, RESEARCH_LEVEL |
| PEN-ED-0048 | D04 Artificial Intelligence and Data | D04.22 AI research; D04.03 Deep learning | NOT_APPLICABLE | NOT_APPLICABLE | Advanced | Researchers and engineers | Paper deep dives | RESEARCH_LEVEL |
| PEN-ED-0049 | D04 Artificial Intelligence and Data | D04.02 Machine learning; D04.06 Natural language processing; D04.14 Data science | NOT_APPLICABLE | NOT_APPLICABLE | Beginner to Intermediate | Learners and job seekers | Tutorials and projects | PRACTICAL_TUTORIALS, CAREER_ORIENTED_SKILLS |

**3.4.C Examination classification**
| Educator_ID | Examination_Name | Examination_Category | Country_or_Jurisdiction | School_Board | Curriculum | Syllabus_Coverage | Exam_Preparation_Specialization | Official_Affiliation_Status |
|---|---|---|---|---|---|---|---|---|
| PEN-ED-0042 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent (former OpenAI/Tesla roles per S60) |
| PEN-ED-0043 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent |
| PEN-ED-0044 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Company founded by Andrew Ng (per S61) |
| PEN-ED-0045 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Stanford University |
| PEN-ED-0046 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | fast.ai |
| PEN-ED-0047 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent author (per S62) |
| PEN-ED-0048 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent |
| PEN-ED-0049 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent |

**3.4.D Quality and evidence**
| Educator_ID | Component scores (8 fields) | Overall_Score | Confidence_Level | Evidence_Summary | Strengths | Limitations | Best_For |
|---|---|---|---|---|---|---|---|
| PEN-ED-0042 | NOT YET SCORED | NOT YET SCORED | Medium | Named in five independent lists [S59][S60][S61][S62][S63]; one describes the format as lecture with live coding [S60]. | First-principles implementation teaching by a frontier-model practitioner (source-described). | Channel URL not captured; requires Python and calculus background. Content not reviewed. | Understanding how language models are built. |
| PEN-ED-0043 | NOT YET SCORED | NOT YET SCORED | Medium | Named in four independent lists [S59][S61][S62][S63]. | Statistical intuition for ML (source-described). | URL not captured; not exam-aligned. Content not reviewed. | Intuition for ML statistics. |
| PEN-ED-0044 | NOT YET SCORED | NOT YET SCORED | Low | Two independent lists [S59][S61]. | Curriculum-ordered content. | Platform courses may be paid; free YouTube scope NOT_VERIFIED. Content not reviewed. | Structured AI curriculum. |
| PEN-ED-0045 | NOT YET SCORED | NOT YET SCORED | Low | Two community/editorial lists [S62][S63]. | University-grade lecture series. | URL not captured. Content not reviewed. | Graduate ML courses. |
| PEN-ED-0046 | NOT YET SCORED | NOT YET SCORED | Low | Single community list [S62]. | Practice-first approach (source-described). | Single source. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0047 | NOT YET SCORED | NOT YET SCORED | Low | Single community list [S62]. | NOT_REVIEWED | Single source. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0048 | NOT YET SCORED | NOT YET SCORED | Low | Editorial list [S61]; second mention [S59]. | Paper-reading guidance. | Commentary rather than curriculum; accuracy not reviewed. Content not reviewed. | Following ML research. |
| PEN-ED-0049 | NOT YET SCORED | NOT YET SCORED | Low | Two commercial lists [S59][S60]. | Practice-oriented (source-described). | URL not captured. Content not reviewed. | Practical ML projects in English with Indian audience focus (UNVERIFIED). |

**3.4.E Content discovery**
| Educator_ID | Representative_Video_URLs | Relevant_Playlist_URLs | Topic_Coverage | Practical_Content_Availability | Theory_Content_Availability | Problem_Solving_Availability | Project_Content_Availability | Exam_Question_Practice_Availability | Full_Course_Availability |
|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0042 | NOT_CAPTURED | NOT_CAPTURED | Neural Networks: Zero to Hero series; building transformers from scratch [S60] | SOURCE_DESCRIBED | SOURCE_DESCRIBED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0043 | NOT_CAPTURED | NOT_CAPTURED | Statistics and machine-learning methods in small pieces [S61] | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0044 | NOT_CAPTURED | NOT_CAPTURED | Structured ML, deep learning and MLOps content tied to Coursera programmes [S61] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED |
| PEN-ED-0045 | NOT_CAPTURED | NOT_CAPTURED | CS229, CS231n and LLM lecture series [S63] | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED |
| PEN-ED-0046 | NOT_CAPTURED | NOT_CAPTURED | Practical Deep Learning for Coders [S62] | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED |
| PEN-ED-0047 | NOT_CAPTURED | NOT_CAPTURED | LLMs, training pipelines, research explanations [S62] | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0048 | NOT_CAPTURED | NOT_CAPTURED | ML paper walkthroughs [S61] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0049 | NOT_CAPTURED | NOT_CAPTURED | Broad NLP and deep learning coverage [S60] | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |

**3.4.F Verification and maintenance**
| Educator_ID | Verification_Status | Channel_ID_Verification_Status | Official_Source_References | Last_Verified_Date | Research_Notes | Potential_Duplicates | Record_Version | Corroboration_Level | Entity_Type | Access_Model | Region_Group |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0042 | UNVERIFIED | NOT_CAPTURED | [S59] [S60] [S61] [S62] [S63] | 2026-10-24 | - | None identified | 1 | C1 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0043 | UNVERIFIED | NOT_CAPTURED | [S59] [S61] [S62] [S63] | 2026-10-24 | - | None identified | 1 | C1 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0044 | UNVERIFIED | NOT_CAPTURED | [S59] [S61] | 2026-10-24 | - | None identified | 1 | C1 | Commercial tutoring or EdTech company | Mixed | NOT_CAPTURED |
| PEN-ED-0045 | UNVERIFIED | NOT_CAPTURED | [S62] [S63] | 2026-10-24 | - | None identified | 1 | C1 | University or institution channel | Free public videos; other access NOT_REVIEWED | North America |
| PEN-ED-0046 | UNVERIFIED | NOT_CAPTURED | [S62] | 2026-10-24 | - | None identified | 1 | C0 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0047 | UNVERIFIED | NOT_CAPTURED | [S62] | 2026-10-24 | - | None identified | 1 | C0 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0048 | UNVERIFIED | NOT_CAPTURED | [S59] [S61] | 2026-10-24 | - | None identified | 1 | C1 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0049 | UNVERIFIED | NOT_CAPTURED | [S59] [S60] | 2026-10-24 | - | None identified | 1 | C1 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |

### 3.5 Engineering (3 records)
**3.5.A Identity**
| Educator_ID | Educator_Name | Channel_Name | Channel_URL | YouTube_Channel_ID | Channel_Handle | Official_Website | Country_or_Region | Primary_Language | Additional_Languages |
|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0013 | NPTEL (IIT/IISc consortium) | NPTEL | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | India | English | NOT_CAPTURED |
| PEN-ED-0087 | GATE Academy | GATE Academy | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | India | English | NOT_CAPTURED |
| PEN-ED-0088 | GATEMATIC Education (formerly Learn GATE Free) | GATEMATIC Education | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | India | English | NOT_CAPTURED |

**3.5.B Educational classification**
| Educator_ID | Educational_Domain | Subject | Subdomain | Topic | Educational_Level | Target_Audience | Teaching_Format | Learning_Objective |
|---|---|---|---|---|---|---|---|---|
| PEN-ED-0013 | D05 Engineering; D02 Natural Sciences | D05.03 Electrical engineering; D05.06 Mechanical engineering; D05.07 Civil engineering; D05.01 Computer engineering; D05.33 Engineering mathematics; D02.01 Physics | D02.01.01 Classical mechanics | NOT_APPLICABLE | University | Engineering students and GATE aspirants | Recorded university lectures | COMPLETE_COURSE, EXAM_PREPARATION, THEORETICAL_STUDY |
| PEN-ED-0087 | D05 Engineering | D05.33 Engineering mathematics; D05.32 Control systems | NOT_APPLICABLE | NOT_APPLICABLE | University | GATE aspirants | Lectures | EXAM_PREPARATION |
| PEN-ED-0088 | D05 Engineering | D05.33 Engineering mathematics | NOT_APPLICABLE | NOT_APPLICABLE | University | GATE aspirants | Lectures | EXAM_PREPARATION |

**3.5.C Examination classification**
| Educator_ID | Examination_Name | Examination_Category | Country_or_Jurisdiction | School_Board | Curriculum | Syllabus_Coverage | Exam_Preparation_Specialization | Official_Affiliation_Status |
|---|---|---|---|---|---|---|---|---|
| PEN-ED-0013 | GATE | UNIVERSITY_ENTRANCE | India | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Joint IIT/IISc programme funded by the Indian education ministry (sources use former name MHRD) |
| PEN-ED-0087 | GATE | UNIVERSITY_ENTRANCE | India | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Commercial |
| PEN-ED-0088 | GATE | UNIVERSITY_ENTRANCE | India | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Commercial/free coaching |

**3.5.D Quality and evidence**
| Educator_ID | Component scores (8 fields) | Overall_Score | Confidence_Level | Evidence_Summary | Strengths | Limitations | Best_For |
|---|---|---|---|---|---|---|---|
| PEN-ED-0013 | NOT YET SCORED | NOT YET SCORED | Medium | Two independent sources describe NPTEL as an IIT/IISc programme with ministry funding and recommend it for GATE [S47][S48]; a legacy user-form URL appears in a community thread [S18]. | Institutional faculty; wide engineering coverage; free. | Legacy URL attribution rests on one forum post; lecture quality varies by course and year. Content not reviewed. | Foundational engineering theory and GATE syllabus coverage. |
| PEN-ED-0087 | NOT YET SCORED | NOT YET SCORED | Low | Two sources [S47][S48]. | NOT_REVIEWED | URL not captured. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0088 | NOT YET SCORED | NOT YET SCORED | Low | Single news source [S48]. | NOT_REVIEWED | Single source. Content not reviewed. | REQUIRES FURTHER RESEARCH |

**3.5.E Content discovery**
| Educator_ID | Representative_Video_URLs | Relevant_Playlist_URLs | Topic_Coverage | Practical_Content_Availability | Theory_Content_Availability | Problem_Solving_Availability | Project_Content_Availability | Exam_Question_Practice_Availability | Full_Course_Availability |
|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0013 | NOT_CAPTURED | NOT_CAPTURED | IIT-professor lectures across engineering and science; used for GATE preparation [S47][S48] | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | SOURCE_DESCRIBED |
| PEN-ED-0087 | NOT_CAPTURED | NOT_CAPTURED | Lectures for all GATE papers [S47][S48] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |
| PEN-ED-0088 | NOT_CAPTURED | NOT_CAPTURED | Free GATE coaching videos for several branches [S48] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |

**3.5.F Verification and maintenance**
| Educator_ID | Verification_Status | Channel_ID_Verification_Status | Official_Source_References | Last_Verified_Date | Research_Notes | Potential_Duplicates | Record_Version | Corroboration_Level | Entity_Type | Access_Model | Region_Group |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0013 | UNVERIFIED | NOT_CAPTURED | [S18] [S47] [S48] | 2026-10-24 | Legacy URL form 'youtube.com/user/nptelhrd' seen in S18; confirm canonical handle before ingestion. | None identified | 1 | C1 | University or institution channel | Free public videos; other access NOT_REVIEWED | India and South Asia |
| PEN-ED-0087 | UNVERIFIED | NOT_CAPTURED | [S47] [S48] | 2026-10-24 | - | None identified | 1 | C1 | Commercial tutoring or EdTech company | Free public videos; other access NOT_REVIEWED | India and South Asia |
| PEN-ED-0088 | UNVERIFIED | NOT_CAPTURED | [S48] | 2026-10-24 | - | None identified | 1 | C0 | Commercial tutoring or EdTech company | Free public videos; other access NOT_REVIEWED | India and South Asia |

### 3.6 Business, Commerce, and Economics (4 records)
**3.6.A Identity**
| Educator_ID | Educator_Name | Channel_Name | Channel_URL | YouTube_Channel_ID | Channel_Handle | Official_Website | Country_or_Region | Primary_Language | Additional_Languages |
|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0050 | Tyler Cowen and Alex Tabarrok | Marginal Revolution University | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0051 | Ben Lambert | Ben Lambert | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0052 | Economics Explained | Economics Explained | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0085 | Mrunal Patel | Mrunal | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | India | English | NOT_CAPTURED |

**3.6.B Educational classification**
| Educator_ID | Educational_Domain | Subject | Subdomain | Topic | Educational_Level | Target_Audience | Teaching_Format | Learning_Objective |
|---|---|---|---|---|---|---|---|---|
| PEN-ED-0050 | D06 Business, Commerce, and Economics | D06.07 Microeconomics; D06.08 Macroeconomics; D06.09 Econometrics | NOT_APPLICABLE | NOT_APPLICABLE | Introductory University | Economics students | Short lecture videos | COMPLETE_COURSE, CONCEPTUAL_DEPTH |
| PEN-ED-0051 | D06 Business, Commerce, and Economics | D06.09 Econometrics; D06.07 Microeconomics | NOT_APPLICABLE | NOT_APPLICABLE | University to Postgraduate | University economics students | Whiteboard lectures | THEORETICAL_STUDY, COMPLETE_COURSE |
| PEN-ED-0052 | D06 Business, Commerce, and Economics | D06.06 Economics | NOT_APPLICABLE | NOT_APPLICABLE | General audience | Learners | Narrated explainers | FOUNDATIONAL_CONCEPTS |
| PEN-ED-0085 | D06 Business, Commerce, and Economics; D09 Humanities and Social Sciences | D06.06 Economics; D09.16 Public administration | NOT_APPLICABLE | NOT_APPLICABLE | Professional (civil services) | UPSC aspirants | Lectures | EXAM_PREPARATION |

**3.6.C Examination classification**
| Educator_ID | Examination_Name | Examination_Category | Country_or_Jurisdiction | School_Board | Curriculum | Syllabus_Coverage | Exam_Preparation_Specialization | Official_Affiliation_Status |
|---|---|---|---|---|---|---|---|---|
| PEN-ED-0050 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Run by two economists (per S72) |
| PEN-ED-0051 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent |
| PEN-ED-0052 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent |
| PEN-ED-0085 | UPSC Civil Services Examination | CIVIL_SERVICE | India | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Independent |

**3.6.D Quality and evidence**
| Educator_ID | Component scores (8 fields) | Overall_Score | Confidence_Level | Evidence_Summary | Strengths | Limitations | Best_For |
|---|---|---|---|---|---|---|---|
| PEN-ED-0050 | NOT YET SCORED | NOT YET SCORED | Low | Editorial list [S72]. | Full principles courses. | URL not captured; creators' names from prior knowledge. Content not reviewed. | Principles of economics. |
| PEN-ED-0051 | NOT YET SCORED | NOT YET SCORED | Low | Editorial list [S72]. | Course-level detail (source-described). | Single source; URL not captured. Content not reviewed. | University econometrics. |
| PEN-ED-0052 | NOT YET SCORED | NOT YET SCORED | Low | Editorial list [S72]. | Current-affairs framing. | Not syllabus-aligned. Content not reviewed. | Context for current economics. |
| PEN-ED-0085 | NOT YET SCORED | NOT YET SCORED | Low | Two community mentions [S49][S50]. | Subject-specialist (community). | Syllabus alignment not checked. Content not reviewed. | REQUIRES FURTHER RESEARCH |

**3.6.E Content discovery**
| Educator_ID | Representative_Video_URLs | Relevant_Playlist_URLs | Topic_Coverage | Practical_Content_Availability | Theory_Content_Availability | Problem_Solving_Availability | Project_Content_Availability | Exam_Question_Practice_Availability | Full_Course_Availability |
|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0050 | NOT_CAPTURED | NOT_CAPTURED | Principles of micro and macro, econometrics, everyday economics [S72] | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED |
| PEN-ED-0051 | NOT_CAPTURED | NOT_CAPTURED | Commentary on main undergraduate and graduate economics courses [S72] | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED |
| PEN-ED-0052 | NOT_CAPTURED | NOT_CAPTURED | Real-world economics and current events [S72] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0085 | NOT_CAPTURED | NOT_CAPTURED | Economics for UPSC [S49][S50] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |

**3.6.F Verification and maintenance**
| Educator_ID | Verification_Status | Channel_ID_Verification_Status | Official_Source_References | Last_Verified_Date | Research_Notes | Potential_Duplicates | Record_Version | Corroboration_Level | Entity_Type | Access_Model | Region_Group |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0050 | UNVERIFIED | NOT_CAPTURED | [S72] | 2026-10-24 | - | None identified | 1 | C0 | University or institution channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0051 | UNVERIFIED | NOT_CAPTURED | [S72] | 2026-10-24 | - | None identified | 1 | C0 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0052 | UNVERIFIED | NOT_CAPTURED | [S72] | 2026-10-24 | - | None identified | 1 | C0 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0085 | UNVERIFIED | NOT_CAPTURED | [S49] [S50] | 2026-10-24 | - | None identified | 1 | C1 | Individual-led channel | Free public videos; other access NOT_REVIEWED | India and South Asia |

### 3.7 Medical and Health Sciences (6 records)
**3.7.A Identity**
| Educator_ID | Educator_Name | Channel_Name | Channel_URL | YouTube_Channel_ID | Channel_Handle | Official_Website | Country_or_Region | Primary_Language | Additional_Languages |
|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0054 | Osmosis (Elsevier) | Osmosis | <https://www.youtube.com/c/osmosis> | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0055 | Armando Hasudungan | Armando Hasudungan | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | Australia | English | NOT_CAPTURED |
| PEN-ED-0056 | Ninja Nerd (Zach Murphy and team) | Ninja Nerd | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0057 | Dr. Najeeb | Dr. Najeeb Lectures | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0058 | MedCram | MedCram | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0059 | NOT_CAPTURED | DirtyUSMLE | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |

**3.7.B Educational classification**
| Educator_ID | Educational_Domain | Subject | Subdomain | Topic | Educational_Level | Target_Audience | Teaching_Format | Learning_Objective |
|---|---|---|---|---|---|---|---|---|
| PEN-ED-0054 | D08 Medical and Health Sciences | D08.01 Anatomy (medical); D08.02 Physiology (medical); D08.04 Pathology; D08.05 Pharmacology | NOT_APPLICABLE | NOT_APPLICABLE | Undergraduate medical | Medical students | Animated explainers | REVISION, FOUNDATIONAL_CONCEPTS, EXAM_PREPARATION |
| PEN-ED-0055 | D08 Medical and Health Sciences | D08.01 Anatomy (medical); D08.02 Physiology (medical); D08.05 Pharmacology; D08.07 Immunology (medical) | NOT_APPLICABLE | NOT_APPLICABLE | Undergraduate medical | Medical students | Hand-drawn whiteboard | CONCEPTUAL_DEPTH, REVISION |
| PEN-ED-0056 | D08 Medical and Health Sciences | D08.01 Anatomy (medical); D08.02 Physiology (medical); D08.04 Pathology; D08.05 Pharmacology | NOT_APPLICABLE | NOT_APPLICABLE | Undergraduate medical | Medical and health-science students | Long whiteboard lectures | COMPLETE_COURSE, EXAM_PREPARATION |
| PEN-ED-0057 | D08 Medical and Health Sciences | D08.02 Physiology (medical); D08.03 Biochemistry (medical); D08.04 Pathology | NOT_APPLICABLE | NOT_APPLICABLE | Undergraduate medical | Medical students (MBBS/MD) | Hand-drawn whiteboard lectures | CONCEPTUAL_DEPTH, COMPLETE_COURSE |
| PEN-ED-0058 | D08 Medical and Health Sciences | D08.08 Medicine; D08.04 Pathology | NOT_APPLICABLE | NOT_APPLICABLE | Clinical | Medical students | Whiteboard lectures | EXAM_PREPARATION |
| PEN-ED-0059 | D08 Medical and Health Sciences | D08.08 Medicine | NOT_APPLICABLE | NOT_APPLICABLE | Clinical | USMLE Step 1 candidates | Tutoring videos | EXAM_PREPARATION, REVISION |

**3.7.C Examination classification**
| Educator_ID | Examination_Name | Examination_Category | Country_or_Jurisdiction | School_Board | Curriculum | Syllabus_Coverage | Exam_Preparation_Specialization | Official_Affiliation_Status |
|---|---|---|---|---|---|---|---|---|
| PEN-ED-0054 | USMLE (mapping NOT_VERIFIED) | PROFESSIONAL_LICENSE | United States | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Commercial; ownership by Elsevier recalled from prior knowledge (UNVERIFIED) |
| PEN-ED-0055 | USMLE (supplement per S70) | PROFESSIONAL_LICENSE | United States | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | NOT_EXAM_SPECIALIST_PER_SOURCES | Described as a physician trainee in Sydney (S67, may be outdated) |
| PEN-ED-0056 | USMLE | PROFESSIONAL_LICENSE | United States | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Presenter is a physician assistant; team are non-doctors (per S67) |
| PEN-ED-0057 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent educator |
| PEN-ED-0058 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | SOURCE_DESCRIBED | Commercial |
| PEN-ED-0059 | USMLE Step 1 | PROFESSIONAL_LICENSE | United States | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Independent; not NBME |

**3.7.D Quality and evidence**
| Educator_ID | Component scores (8 fields) | Overall_Score | Confidence_Level | Evidence_Summary | Strengths | Limitations | Best_For |
|---|---|---|---|---|---|---|---|
| PEN-ED-0054 | NOT YET SCORED | NOT YET SCORED | Medium | Channel URL in a peer-reviewed journal letter [S69]; two further independent sources [S67][S68]. The survey reports usage only, not learning effect [S69]. | Broad preclinical coverage. | Survey is a single cohort; usage is not quality evidence; medical accuracy not independently checked. Content not reviewed. | Visual preclinical revision. |
| PEN-ED-0055 | NOT YET SCORED | NOT YET SCORED | Medium | Four independent sources [S67][S68][S69][S70]; 12.3% usage in the cohort survey [S69]. | Visual teaching by a clinician (source-described). | URL not captured; physician status may have changed. Content not reviewed. | Visual learners in medicine. |
| PEN-ED-0056 | NOT YET SCORED | NOT YET SCORED | Low | Two independent sources [S67][S68]. | Detailed lectures. | Source notes some content is too detailed for medical students and videos are long [S67]. Content not reviewed. | Deep dives for health-science learners. |
| PEN-ED-0057 | NOT YET SCORED | NOT YET SCORED | Low | Commercial list [S71]; forum-style recommendations for MBBS physiology; 3.5% usage in cohort survey [S69]. | Detailed visual teaching. | Free versus paid scope NOT_VERIFIED; URL not captured. Content not reviewed. | Conceptual medical physiology. |
| PEN-ED-0058 | NOT YET SCORED | NOT YET SCORED | Low | Single commercial list [S71]. | NOT_REVIEWED | Single source. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0059 | NOT YET SCORED | NOT YET SCORED | Low | Single commercial test-prep blog [S70]. | Exam-focused. | Polling method unverified; single source. Content not reviewed. | REQUIRES FURTHER RESEARCH |

**3.7.E Content discovery**
| Educator_ID | Representative_Video_URLs | Relevant_Playlist_URLs | Topic_Coverage | Practical_Content_Availability | Theory_Content_Availability | Problem_Solving_Availability | Project_Content_Availability | Exam_Question_Practice_Availability | Full_Course_Availability |
|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0054 | NOT_CAPTURED | NOT_CAPTURED | Covers all preclinical subjects (forum claim) [S68]; most used channel in one Peruvian medical-student cohort survey [S69] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |
| PEN-ED-0055 | NOT_CAPTURED | NOT_CAPTURED | Hand-drawn videos on anatomy, physiology, pharmacology, immunology, neurology [S67][S71] | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0056 | NOT_CAPTURED | NOT_CAPTURED | Anatomy, physiology, pathophysiology, pharmacology; USMLE programmes [S67] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | SOURCE_DESCRIBED |
| PEN-ED-0057 | NOT_CAPTURED | NOT_CAPTURED | Hand-drawn lectures in biochemistry, pathophysiology, GI system and pathology [S71] | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED |
| PEN-ED-0058 | NOT_CAPTURED | NOT_CAPTURED | Clinical explanations for exams [S71] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |
| PEN-ED-0059 | NOT_CAPTURED | NOT_CAPTURED | High-yield USMLE Step 1 topics from exam-taker polling (source-described) [S70] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |

**3.7.F Verification and maintenance**
| Educator_ID | Verification_Status | Channel_ID_Verification_Status | Official_Source_References | Last_Verified_Date | Research_Notes | Potential_Duplicates | Record_Version | Corroboration_Level | Entity_Type | Access_Model | Region_Group |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0054 | CHANNEL_VERIFIED_CONTENT_NOT_REVIEWED | NOT_CAPTURED | [S67] [S68] [S69] | 2026-10-24 | - | None identified | 1 | C2 | Commercial tutoring or EdTech company | Mixed (platform paid tiers NOT_VERIFIED) | NOT_CAPTURED |
| PEN-ED-0055 | UNVERIFIED | NOT_CAPTURED | [S67] [S68] [S69] [S70] [S71] | 2026-10-24 | - | None identified | 1 | C1 | Individual-led channel | Free public videos; other access NOT_REVIEWED | Australia and New Zealand |
| PEN-ED-0056 | UNVERIFIED | NOT_CAPTURED | [S67] [S68] | 2026-10-24 | - | None identified | 1 | C1 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0057 | UNVERIFIED | NOT_CAPTURED | [S69] [S71] | 2026-10-24 | - | None identified | 1 | C1 | Individual-led channel | Mixed (NOT_VERIFIED) | NOT_CAPTURED |
| PEN-ED-0058 | UNVERIFIED | NOT_CAPTURED | [S71] | 2026-10-24 | - | None identified | 1 | C0 | Commercial tutoring or EdTech company | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0059 | UNVERIFIED | NOT_CAPTURED | [S70] | 2026-10-24 | - | None identified | 1 | C0 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |

### 3.8 Humanities and Social Sciences (4 records)
**3.8.A Identity**
| Educator_ID | Educator_Name | Channel_Name | Channel_URL | YouTube_Channel_ID | Channel_Handle | Official_Website | Country_or_Region | Primary_Language | Additional_Languages |
|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0053 | CrashCourse (Complexly) | CrashCourse | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0083 | StudyIQ | StudyIQ | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | India | English, Hindi | NOT_CAPTURED |
| PEN-ED-0084 | Drishti IAS | Drishti IAS | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | India | Hindi, English | NOT_CAPTURED |
| PEN-ED-0093 | Se Liga Nessa Historia | Se Liga Nessa Historia | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | Brazil | Portuguese | NOT_CAPTURED |

**3.8.B Educational classification**
| Educator_ID | Educational_Domain | Subject | Subdomain | Topic | Educational_Level | Target_Audience | Teaching_Format | Learning_Objective |
|---|---|---|---|---|---|---|---|---|
| PEN-ED-0053 | D09 Humanities and Social Sciences; D06 Business, Commerce, and Economics; D02 Natural Sciences | D09.02 World history; D09.07 Psychology; D06.08 Macroeconomics; D02.03 Biology | NOT_APPLICABLE | NOT_APPLICABLE | School to Introductory University | Students and general learners | Animated explainers | FOUNDATIONAL_CONCEPTS, REVISION |
| PEN-ED-0083 | D09 Humanities and Social Sciences | D09.16 Public administration; D09.01 History; D09.04 Political science | NOT_APPLICABLE | NOT_APPLICABLE | Professional (civil services) | UPSC CSE aspirants | Lectures and current-affairs videos | EXAM_PREPARATION |
| PEN-ED-0084 | D09 Humanities and Social Sciences | D09.16 Public administration; D09.01 History; D09.04 Political science | NOT_APPLICABLE | NOT_APPLICABLE | Professional (civil services) | UPSC aspirants | Lectures | EXAM_PREPARATION |
| PEN-ED-0093 | D09 Humanities and Social Sciences | D09.01 History; D09.03 Regional and national history | NOT_APPLICABLE | NOT_APPLICABLE | Secondary | ENEM candidates | Explainer videos | EXAM_PREPARATION, FOUNDATIONAL_CONCEPTS |

**3.8.C Examination classification**
| Educator_ID | Examination_Name | Examination_Category | Country_or_Jurisdiction | School_Board | Curriculum | Syllabus_Coverage | Exam_Preparation_Specialization | Official_Affiliation_Status |
|---|---|---|---|---|---|---|---|---|
| PEN-ED-0053 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Media producer |
| PEN-ED-0083 | UPSC Civil Services Examination | CIVIL_SERVICE | India | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Commercial |
| PEN-ED-0084 | UPSC Civil Services Examination | CIVIL_SERVICE | India | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Commercial |
| PEN-ED-0093 | ENEM | UNIVERSITY_ENTRANCE | Brazil | NOT_VERIFIED | BNCC and ENEM pathway | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Independent |

**3.8.D Quality and evidence**
| Educator_ID | Component scores (8 fields) | Overall_Score | Confidence_Level | Evidence_Summary | Strengths | Limitations | Best_For |
|---|---|---|---|---|---|---|---|
| PEN-ED-0053 | NOT YET SCORED | NOT YET SCORED | Low | Subject range described by two lists [S78][S72]. | Wide subject coverage. | Overview depth; not exam-board aligned. Content not reviewed. | Quick overviews. |
| PEN-ED-0083 | NOT YET SCORED | NOT YET SCORED | Low | Two community mentions [S49][S50]. | NOT_REVIEWED | Syllabus alignment not checked. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0084 | NOT YET SCORED | NOT YET SCORED | Low | Single community mention [S49]. | NOT_REVIEWED | Syllabus alignment not checked. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0093 | NOT YET SCORED | NOT YET SCORED | Low | Single editorial source [S37]. | History focus. | Single source; may be distinct from 'Se Liga - Enem e Vestibulares' (S33). Content not reviewed. | ENEM history. |

**3.8.E Content discovery**
| Educator_ID | Representative_Video_URLs | Relevant_Playlist_URLs | Topic_Coverage | Practical_Content_Availability | Theory_Content_Availability | Problem_Solving_Availability | Project_Content_Availability | Exam_Question_Practice_Availability | Full_Course_Availability |
|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0053 | NOT_CAPTURED | NOT_CAPTURED | Short courses in history, sciences, economics, psychology, literature and more [S78] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0083 | NOT_CAPTURED | NOT_CAPTURED | UPSC current affairs and subjects [S49][S50] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |
| PEN-ED-0084 | NOT_CAPTURED | NOT_CAPTURED | UPSC coaching content [S49] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |
| PEN-ED-0093 | NOT_CAPTURED | NOT_CAPTURED | Brazilian and world history; created by two USP graduates (per S37) | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |

**3.8.F Verification and maintenance**
| Educator_ID | Verification_Status | Channel_ID_Verification_Status | Official_Source_References | Last_Verified_Date | Research_Notes | Potential_Duplicates | Record_Version | Corroboration_Level | Entity_Type | Access_Model | Region_Group |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0053 | UNVERIFIED | NOT_CAPTURED | [S72] [S78] | 2026-10-24 | Producer name from prior knowledge (UNVERIFIED). | None identified | 1 | C1 | Media or publisher | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0083 | UNVERIFIED | NOT_CAPTURED | [S49] [S50] | 2026-10-24 | - | None identified | 1 | C1 | Commercial tutoring or EdTech company | Free public videos; other access NOT_REVIEWED | India and South Asia |
| PEN-ED-0084 | UNVERIFIED | NOT_CAPTURED | [S49] | 2026-10-24 | - | None identified | 1 | C0 | Commercial tutoring or EdTech company | Free public videos; other access NOT_REVIEWED | India and South Asia |
| PEN-ED-0093 | UNVERIFIED | NOT_CAPTURED | [S33] [S37] | 2026-10-24 | - | Check vs 'Se Liga - Enem e Vestibulares' named in S33 | 1 | C0 | Individual-led channel | Free public videos; other access NOT_REVIEWED | Latin America |

### 3.9 Languages and Communication (13 records)
**3.9.A Identity**
| Educator_ID | Educator_Name | Channel_Name | Channel_URL | YouTube_Channel_ID | Channel_Handle | Official_Website | Country_or_Region | Primary_Language | Additional_Languages |
|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0023 | Mr Bruff (Andrew Bruff) | Mr Bruff | NOT_CAPTURED | NOT_CAPTURED | @MrBruff | NOT_CAPTURED | United Kingdom | English | NOT_CAPTURED |
| PEN-ED-0060 | Easy Languages network (Hamerski and Schmid founded Easy German) | Easy Languages (multiple channels) | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | Germany (founding team moved to Berlin) | Local language with English subtitles | NOT_CAPTURED |
| PEN-ED-0061 | Talk To Me In Korean | Talk To Me In Korean | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0062 | NOT_CAPTURED | Learn Korean in Korean | <https://www.youtube.com/@learnkoreaninkorean> | NOT_CAPTURED | @learnkoreaninkorean | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0063 | NOT_CAPTURED | Seemile Korean | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0064 | Alexa Polidoro | Learn French with Alexa | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0065 | NOT_CAPTURED | Learn French With Vincent | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0066 | NOT_CAPTURED | InnerFrench | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0067 | NOT_CAPTURED | Yoyo Chinese | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0068 | NOT_CAPTURED | Butterfly Spanish | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0069 | NOT_CAPTURED | Dreaming Spanish | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0070 | NOT_CAPTURED | German with Jenny | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0096 | British Council | TakeIELTS (British Council) | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | United Kingdom / global | English | NOT_CAPTURED |

**3.9.B Educational classification**
| Educator_ID | Educational_Domain | Subject | Subdomain | Topic | Educational_Level | Target_Audience | Teaching_Format | Learning_Objective |
|---|---|---|---|---|---|---|---|---|
| PEN-ED-0023 | D10 Languages and Communication | D10.01 English; D10.21 Writing | NOT_APPLICABLE | NOT_APPLICABLE | GCSE to A Level | UK secondary students | Teacher-led lessons | EXAM_PREPARATION, REVISION |
| PEN-ED-0060 | D10 Languages and Communication | D10.05 German; D10.03 Spanish; D10.04 French; D10.19 Listening | NOT_APPLICABLE | NOT_APPLICABLE | Beginner to Intermediate | Language learners | Street interviews with bilingual subtitles | PRACTICAL_TUTORIALS, FOUNDATIONAL_CONCEPTS |
| PEN-ED-0061 | D10 Languages and Communication | D10.08 Korean; D10.16 Grammar | NOT_APPLICABLE | NOT_APPLICABLE | Beginner to Advanced | Korean learners | Lessons | COMPLETE_COURSE, FOUNDATIONAL_CONCEPTS |
| PEN-ED-0062 | D10 Languages and Communication | D10.08 Korean | NOT_APPLICABLE | NOT_APPLICABLE | Intermediate | Learners wanting immersion | Immersion lessons | PRACTICAL_TUTORIALS |
| PEN-ED-0063 | D10 Languages and Communication | D10.08 Korean | NOT_APPLICABLE | NOT_APPLICABLE | Beginner | Multilingual learners | Bilingual lessons | FOUNDATIONAL_CONCEPTS |
| PEN-ED-0064 | D10 Languages and Communication | D10.04 French | NOT_APPLICABLE | NOT_APPLICABLE | Beginner | French learners | Lessons | FOUNDATIONAL_CONCEPTS |
| PEN-ED-0065 | D10 Languages and Communication | D10.04 French | NOT_APPLICABLE | NOT_APPLICABLE | Beginner | French learners | Lessons | FOUNDATIONAL_CONCEPTS |
| PEN-ED-0066 | D10 Languages and Communication | D10.04 French; D10.19 Listening | NOT_APPLICABLE | NOT_APPLICABLE | Intermediate | French learners | Spoken-French lessons | PRACTICAL_TUTORIALS |
| PEN-ED-0067 | D10 Languages and Communication | D10.06 Mandarin Chinese | NOT_APPLICABLE | NOT_APPLICABLE | Beginner | Mandarin learners | Lessons | FOUNDATIONAL_CONCEPTS |
| PEN-ED-0068 | D10 Languages and Communication | D10.03 Spanish | NOT_APPLICABLE | NOT_APPLICABLE | Beginner | Spanish learners | Lessons | FOUNDATIONAL_CONCEPTS |
| PEN-ED-0069 | D10 Languages and Communication | D10.03 Spanish; D10.19 Listening | NOT_APPLICABLE | NOT_APPLICABLE | Beginner to Intermediate | Spanish learners | Comprehensible-input videos | PRACTICAL_TUTORIALS |
| PEN-ED-0070 | D10 Languages and Communication | D10.05 German | NOT_APPLICABLE | NOT_APPLICABLE | Beginner | German learners | Lessons | FOUNDATIONAL_CONCEPTS |
| PEN-ED-0096 | D10 Languages and Communication | D10.01 English; D10.19 Listening; D10.18 Speaking; D10.20 Reading; D10.21 Writing | NOT_APPLICABLE | NOT_APPLICABLE | Intermediate to Advanced (test candidates) | IELTS candidates | Teacher-led videos | EXAM_PREPARATION |

**3.9.C Examination classification**
| Educator_ID | Examination_Name | Examination_Category | Country_or_Jurisdiction | School_Board | Curriculum | Syllabus_Coverage | Exam_Preparation_Specialization | Official_Affiliation_Status |
|---|---|---|---|---|---|---|---|---|
| PEN-ED-0023 | GCSE English Language/Literature; A Level English | SCHOOL_LEAVING | United Kingdom | Multiple (NOT_VERIFIED) | GCSE and A Level (AQA, OCR, Pearson Edexcel, WJEC/Eduqas) | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Independent teacher |
| PEN-ED-0060 | None | LANGUAGE_PROFICIENCY | International | NOT_APPLICABLE | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | NOT_EXAM_SPECIALIST_PER_SOURCES | Network partnered with Seedlang (per S73) |
| PEN-ED-0061 | TOPIK (mapping NOT_VERIFIED) | LANGUAGE_PROFICIENCY | International | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | NOT_EXAM_SPECIALIST_PER_SOURCES | Commercial |
| PEN-ED-0062 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent |
| PEN-ED-0063 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent |
| PEN-ED-0064 | None | LANGUAGE_PROFICIENCY | International | NOT_APPLICABLE | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent |
| PEN-ED-0065 | None | LANGUAGE_PROFICIENCY | International | NOT_APPLICABLE | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent |
| PEN-ED-0066 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent |
| PEN-ED-0067 | HSK (mapping NOT_VERIFIED) | LANGUAGE_PROFICIENCY | International | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | NOT_EXAM_SPECIALIST_PER_SOURCES | Commercial |
| PEN-ED-0068 | None | LANGUAGE_PROFICIENCY | International | NOT_APPLICABLE | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent |
| PEN-ED-0069 | None | LANGUAGE_PROFICIENCY | International | NOT_APPLICABLE | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | NOT_EXAM_SPECIALIST_PER_SOURCES | Commercial |
| PEN-ED-0070 | Goethe-Zertifikat (mapping NOT_VERIFIED) | LANGUAGE_PROFICIENCY | International | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent |
| PEN-ED-0096 | IELTS | LANGUAGE_PROFICIENCY | International | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Official IELTS partner (British Council) channel; IELTS is co-owned with IDP and Cambridge (prior knowledge, UNVERIFIED) |

**3.9.D Quality and evidence**
| Educator_ID | Component scores (8 fields) | Overall_Score | Confidence_Level | Evidence_Summary | Strengths | Limitations | Best_For |
|---|---|---|---|---|---|---|---|
| PEN-ED-0023 | NOT YET SCORED | NOT YET SCORED | Medium | College blog calls him a curriculum specialist [S21]; handle in a second college list [S22]; student-community mention [S26]. | Curriculum-focused English teaching. | Full URL not captured; educator surname from prior knowledge (UNVERIFIED). Content not reviewed. | GCSE and A Level English revision. |
| PEN-ED-0060 | NOT YET SCORED | NOT YET SCORED | Medium | Encyclopedia entry [S73]; vendor recommendations [S76][S77]. | Authentic listening material. | Many separate channels - one record per language channel needed. Content not reviewed. | Listening practice with natural speech. |
| PEN-ED-0061 | NOT YET SCORED | NOT YET SCORED | Low | Two vendor blogs [S74][S75]. | Established learner brand. | Vendor-affiliated sources; URL not captured. Content not reviewed. | Korean from scratch. |
| PEN-ED-0062 | NOT YET SCORED | NOT YET SCORED | Low | Handle in single vendor blog [S74]. | Immersion. | Single vendor source. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0063 | NOT YET SCORED | NOT YET SCORED | Low | Single vendor blog [S75]. | Multilingual support. | Single source. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0064 | NOT YET SCORED | NOT YET SCORED | Low | Single vendor blog [S76]. | Beginner-friendly (source-described). | Single source. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0065 | NOT YET SCORED | NOT YET SCORED | Low | Single vendor blog [S77]; also named in S76. | NOT_REVIEWED | Vendor sources. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0066 | NOT YET SCORED | NOT YET SCORED | Low | Single vendor blog [S76]. | NOT_REVIEWED | Single source. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0067 | NOT YET SCORED | NOT YET SCORED | Low | Vendor blog [S77]. | Beginner-oriented. | Single source. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0068 | NOT YET SCORED | NOT YET SCORED | Low | Vendor blog [S77]. | NOT_REVIEWED | Single source. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0069 | NOT YET SCORED | NOT YET SCORED | Low | Vendor blog [S76]. | Input-based method. | Single source. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0070 | NOT YET SCORED | NOT YET SCORED | Low | Vendor blog [S77]. | NOT_REVIEWED | Single source. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0096 | NOT YET SCORED | NOT YET SCORED | Medium | The British Council's own page states it hosts the videos on its official TakeIELTS YouTube channel [S27]. | Official exam-format guidance. | Channel URL not captured on this page; scope shown is introductory. Content not reviewed. | Understanding IELTS formats and tips. |

**3.9.E Content discovery**
| Educator_ID | Representative_Video_URLs | Relevant_Playlist_URLs | Topic_Coverage | Practical_Content_Availability | Theory_Content_Availability | Problem_Solving_Availability | Project_Content_Availability | Exam_Question_Practice_Availability | Full_Course_Availability |
|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0023 | NOT_CAPTURED | NOT_CAPTURED | GCSE and A Level English Language and Literature [S21][S22] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |
| PEN-ED-0060 | NOT_CAPTURED | NOT_CAPTURED | Subtitled street interviews in 40+ languages [S73] | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0061 | NOT_CAPTURED | NOT_CAPTURED | Korean lessons, books and videos [S74][S75] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED |
| PEN-ED-0062 | NOT_CAPTURED | NOT_CAPTURED | Immersive Korean-only lessons [S74] | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0063 | NOT_CAPTURED | NOT_CAPTURED | Korean with English, Japanese, Chinese or Vietnamese support [S75] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0064 | NOT_CAPTURED | NOT_CAPTURED | Beginner-friendly French [S76] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0065 | NOT_CAPTURED | NOT_CAPTURED | Beginner French [S77] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0066 | NOT_CAPTURED | NOT_CAPTURED | French for learners (comprehensible input) [S76] | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0067 | NOT_CAPTURED | NOT_CAPTURED | Mandarin for beginners [S77] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0068 | NOT_CAPTURED | NOT_CAPTURED | Spanish lessons [S77] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0069 | NOT_CAPTURED | NOT_CAPTURED | Comprehensible-input Spanish [S76] | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0070 | NOT_CAPTURED | NOT_CAPTURED | German lessons [S77] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0096 | NOT_CAPTURED | NOT_CAPTURED | Official IELTS preparation videos led by IELTS teachers, with practical exercises [S27] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |

**3.9.F Verification and maintenance**
| Educator_ID | Verification_Status | Channel_ID_Verification_Status | Official_Source_References | Last_Verified_Date | Research_Notes | Potential_Duplicates | Record_Version | Corroboration_Level | Entity_Type | Access_Model | Region_Group |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0023 | UNVERIFIED | NOT_CAPTURED | [S21] [S22] [S26] | 2026-10-24 | - | None identified | 1 | C1 | Individual-led channel | Free public videos; other access NOT_REVIEWED | UK and Ireland |
| PEN-ED-0060 | UNVERIFIED | NOT_CAPTURED | [S73] [S76] [S77] | 2026-10-24 | - | Network of 12+ channels; create one record per language channel | 1 | C1 | Media or publisher | Free public videos; other access NOT_REVIEWED | Continental Europe |
| PEN-ED-0061 | UNVERIFIED | NOT_CAPTURED | [S74] [S75] | 2026-10-24 | - | None identified | 1 | C1 | Commercial tutoring or EdTech company | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0062 | UNVERIFIED | NOT_CAPTURED | [S74] | 2026-10-24 | - | None identified | 1 | C0 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0063 | UNVERIFIED | NOT_CAPTURED | [S75] | 2026-10-24 | - | None identified | 1 | C0 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0064 | UNVERIFIED | NOT_CAPTURED | [S76] | 2026-10-24 | - | None identified | 1 | C0 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0065 | UNVERIFIED | NOT_CAPTURED | [S76] [S77] | 2026-10-24 | - | None identified | 1 | C1 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0066 | UNVERIFIED | NOT_CAPTURED | [S76] | 2026-10-24 | - | None identified | 1 | C0 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0067 | UNVERIFIED | NOT_CAPTURED | [S77] | 2026-10-24 | - | None identified | 1 | C0 | Commercial tutoring or EdTech company | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0068 | UNVERIFIED | NOT_CAPTURED | [S77] | 2026-10-24 | - | None identified | 1 | C0 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0069 | UNVERIFIED | NOT_CAPTURED | [S76] | 2026-10-24 | - | None identified | 1 | C0 | Commercial tutoring or EdTech company | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0070 | UNVERIFIED | NOT_CAPTURED | [S77] | 2026-10-24 | - | None identified | 1 | C0 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0096 | UNVERIFIED | NOT_CAPTURED | [S27] [S28] | 2026-10-24 | Identity verified through official source; URL missing so status UNVERIFIED. | None identified | 1 | C2 | Official exam body or public broadcaster | Free public videos; other access NOT_REVIEWED | UK and Ireland |

### 3.10 Cross-domain and exam-preparation providers (15 records)
**3.10.A Identity**
| Educator_ID | Educator_Name | Channel_Name | Channel_URL | YouTube_Channel_ID | Channel_Handle | Official_Website | Country_or_Region | Primary_Language | Additional_Languages |
|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0007 | Khan Academy | Khan Academy | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0011 | MIT OpenCourseWare | MIT OpenCourseWare | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | United States | English | NOT_CAPTURED |
| PEN-ED-0016 | NOT_CAPTURED | The Organic Chemistry Tutor | <https://www.youtube.com/c/TheOrganicChemistryTutor> | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0028 | Primrose Kitten team | Primrose Kitten Academy | NOT_CAPTURED | NOT_CAPTURED | @PrimroseKitten | NOT_CAPTURED | United Kingdom | English | NOT_CAPTURED |
| PEN-ED-0029 | BBC | BBC Bitesize GCSE | <https://www.youtube.com/@BBCBitesizeGCSE> | NOT_CAPTURED | @BBCBitesizeGCSE | NOT_CAPTURED | United Kingdom | English | NOT_CAPTURED |
| PEN-ED-0030 | BBC | BBC Teach (Bitesize for Teachers) | <https://www.youtube.com/@bbcteach> | NOT_CAPTURED | @bbcteach | NOT_CAPTURED | United Kingdom | English | NOT_CAPTURED |
| PEN-ED-0075 | Alakh Pandey | Physics Wallah - Alakh Pandey | <https://www.youtube.com/@PhysicsWallah> | NOT_CAPTURED | @PhysicsWallah | NOT_CAPTURED | India | Hindi | English channels also exist (NOT_VERIFIED) |
| PEN-ED-0076 | Physics Wallah team | PW JEE Wallah | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | India | Hindi | NOT_CAPTURED |
| PEN-ED-0077 | Unacademy | Unacademy (JEE, GATE and civil-services channels) | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | India | English, Hindi | NOT_CAPTURED |
| PEN-ED-0078 | Vedantu | Vedantu JEE | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | India | Hindi, English | NOT_CAPTURED |
| PEN-ED-0081 | Etoos Education | Etoos Education | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | India | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0082 | Motion Education | Motion Education | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | India | NOT_CAPTURED | NOT_CAPTURED |
| PEN-ED-0091 | Me Salva! | Me Salva! | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | Brazil | Portuguese | NOT_CAPTURED |
| PEN-ED-0092 | Descomplica | Descomplica | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | Brazil | Portuguese | NOT_CAPTURED |
| PEN-ED-0095 | EBS (Korea Educational Broadcasting System) | EBS 고교강의 / EBSi | NOT_CAPTURED | NOT_CAPTURED | NOT_CAPTURED | <https://www.ebsi.co.kr> | South Korea | Korean | NOT_CAPTURED |

**3.10.B Educational classification**
| Educator_ID | Educational_Domain | Subject | Subdomain | Topic | Educational_Level | Target_Audience | Teaching_Format | Learning_Objective |
|---|---|---|---|---|---|---|---|---|
| PEN-ED-0007 | D01 Mathematics; D02 Natural Sciences; D06 Business, Commerce, and Economics | D01.01 Arithmetic; D01.04 Algebra; D01.09 Calculus; D02.01 Physics; D02.03 Biology; D06.11 Finance (business) | NOT_APPLICABLE | NOT_APPLICABLE | Beginner to University | School and early-university learners | Short lessons with practice (platform) | FOUNDATIONAL_CONCEPTS, COMPLETE_COURSE, PROBLEM_SOLVING |
| PEN-ED-0011 | D01 Mathematics; D02 Natural Sciences; D03 Computer Science and Information Technology | D01.05 Linear algebra; D01.11 Differential equations; D02.01 Physics; D03.01 Computer fundamentals | D02.01.01 Classical mechanics | NOT_APPLICABLE | University | University and self-directed learners | Recorded university lectures | COMPLETE_COURSE, THEORETICAL_STUDY |
| PEN-ED-0016 | D01 Mathematics; D02 Natural Sciences | D01.04 Algebra; D02.02 Chemistry; D02.01 Physics | D02.02.01 General chemistry; D02.02.02 Organic chemistry; D02.01.01 Classical mechanics | NOT_APPLICABLE | Beginner to University | Students needing worked examples | Worked-example videos | PROBLEM_SOLVING, FOUNDATIONAL_CONCEPTS |
| PEN-ED-0028 | D02 Natural Sciences; D01 Mathematics; D09 Humanities and Social Sciences | D02.03 Biology; D02.02 Chemistry; D01.04 Algebra; D09.07 Psychology; D09.06 Sociology | NOT_APPLICABLE | NOT_APPLICABLE | GCSE to A Level | UK students | Revision videos | REVISION, EXAM_PREPARATION |
| PEN-ED-0029 | D10 Languages and Communication; D01 Mathematics; D02 Natural Sciences | D10.01 English; D01.04 Algebra; D02.03 Biology | NOT_APPLICABLE | NOT_APPLICABLE | KS3-GCSE | UK students | Short revision videos | REVISION, EXAM_PREPARATION |
| PEN-ED-0030 | D09 Humanities and Social Sciences | D09.24 Education theory | NOT_APPLICABLE | NOT_APPLICABLE | Primary to Secondary | Teachers and pupils | Classroom videos | FOUNDATIONAL_CONCEPTS |
| PEN-ED-0075 | D02 Natural Sciences; D01 Mathematics | D02.01 Physics; D02.02 Chemistry; D01.04 Algebra | D02.01.01 Classical mechanics | D02.01.01.01 Rotational mechanics | School to Pre-university | CBSE, JEE and NEET aspirants | Recorded classroom-style lectures | EXAM_PREPARATION, COMPLETE_COURSE, REVISION |
| PEN-ED-0076 | D02 Natural Sciences; D01 Mathematics | D02.01 Physics; D02.02 Chemistry; D01.04 Algebra | D02.01.01 Classical mechanics | NOT_APPLICABLE | Pre-university | JEE aspirants | Recorded lectures | EXAM_PREPARATION |
| PEN-ED-0077 | D02 Natural Sciences; D01 Mathematics | D02.01 Physics; D02.02 Chemistry; D01.04 Algebra | NOT_APPLICABLE | NOT_APPLICABLE | Pre-university to Professional | Exam aspirants | Live and recorded classes | EXAM_PREPARATION, COMPLETE_COURSE |
| PEN-ED-0078 | D02 Natural Sciences; D01 Mathematics | D02.01 Physics; D02.02 Chemistry; D01.04 Algebra | NOT_APPLICABLE | NOT_APPLICABLE | Pre-university | JEE aspirants | Recorded and live classes | EXAM_PREPARATION |
| PEN-ED-0081 | D02 Natural Sciences; D01 Mathematics | D02.01 Physics; D02.02 Chemistry; D01.04 Algebra | NOT_APPLICABLE | NOT_APPLICABLE | Pre-university | JEE aspirants | Recorded lectures | EXAM_PREPARATION |
| PEN-ED-0082 | D02 Natural Sciences; D01 Mathematics | D02.01 Physics; D02.02 Chemistry; D01.04 Algebra | NOT_APPLICABLE | NOT_APPLICABLE | Pre-university | JEE and NEET aspirants | Recorded lectures | EXAM_PREPARATION |
| PEN-ED-0091 | D01 Mathematics; D02 Natural Sciences | D01.03 Elementary mathematics; D02.01 Physics; D02.02 Chemistry | NOT_APPLICABLE | NOT_APPLICABLE | Secondary | ENEM candidates | Slide/software-based lessons (per S34) | EXAM_PREPARATION, REVISION |
| PEN-ED-0092 | D01 Mathematics; D10 Languages and Communication | D01.03 Elementary mathematics; D10.21 Writing | NOT_APPLICABLE | NOT_APPLICABLE | Secondary | ENEM candidates | Classroom-style lessons and lives | EXAM_PREPARATION, REVISION |
| PEN-ED-0095 | D01 Mathematics; D10 Languages and Communication | D01.03 Elementary mathematics; D10.01 English; D10.08 Korean | NOT_APPLICABLE | NOT_APPLICABLE | Upper-secondary | Suneung candidates | Recorded and live lectures | EXAM_PREPARATION, COMPLETE_COURSE, REVISION |

**3.10.C Examination classification**
| Educator_ID | Examination_Name | Examination_Category | Country_or_Jurisdiction | School_Board | Curriculum | Syllabus_Coverage | Exam_Preparation_Specialization | Official_Affiliation_Status |
|---|---|---|---|---|---|---|---|---|
| PEN-ED-0007 | None (exam mappings NOT_REVIEWED) | SCHOOL_LEAVING | United States | NOT_VERIFIED | College Board Advanced Placement | NOT_VERIFIED against official syllabus | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent nonprofit; exam-board affiliation NOT_VERIFIED |
| PEN-ED-0011 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Massachusetts Institute of Technology |
| PEN-ED-0016 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Independent creator |
| PEN-ED-0028 | GCSE; A Level | SCHOOL_LEAVING | United Kingdom | NOT_VERIFIED | GCSE and A Level (AQA, OCR, Pearson Edexcel, WJEC/Eduqas) | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Commercial |
| PEN-ED-0029 | GCSE | SCHOOL_LEAVING | United Kingdom | NOT_VERIFIED | GCSE and A Level (AQA, OCR, Pearson Edexcel, WJEC/Eduqas) | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Public broadcaster (not an awarding body) |
| PEN-ED-0030 | None | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_EXAM_SPECIALIST_PER_SOURCES | Public broadcaster |
| PEN-ED-0075 | JEE Main; JEE Advanced; NEET-UG; CBSE Class 9-10 | UNIVERSITY_ENTRANCE | India | CBSE (per S40) | Central Board of Secondary Education (CBSE) | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Commercial EdTech (publicly listed company per S40); not an exam authority |
| PEN-ED-0076 | JEE Main; JEE Advanced | UNIVERSITY_ENTRANCE | India | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Part of the Physics Wallah company (per S40 'other channels') |
| PEN-ED-0077 | JEE; NEET-UG; UPSC CSE; GATE | CIVIL_SERVICE, UNIVERSITY_ENTRANCE | India | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Commercial EdTech |
| PEN-ED-0078 | JEE Main; JEE Advanced | UNIVERSITY_ENTRANCE | India | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Commercial EdTech |
| PEN-ED-0081 | JEE Main; JEE Advanced | UNIVERSITY_ENTRANCE | India | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Commercial |
| PEN-ED-0082 | JEE Main; JEE Advanced; NEET-UG | UNIVERSITY_ENTRANCE | India | NOT_VERIFIED | NOT_APPLICABLE | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Commercial coaching institute |
| PEN-ED-0091 | ENEM | UNIVERSITY_ENTRANCE | Brazil | NOT_VERIFIED | BNCC and ENEM pathway | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Commercial |
| PEN-ED-0092 | ENEM | UNIVERSITY_ENTRANCE | Brazil | NOT_VERIFIED | BNCC and ENEM pathway | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Commercial pre-vestibular course |
| PEN-ED-0095 | Suneung (CSAT) | UNIVERSITY_ENTRANCE | South Korea | NOT_VERIFIED | National curriculum and Suneung pathway | NOT_VERIFIED against official syllabus | SOURCE_DESCRIBED | Public educational broadcaster; materials linked to the exam; not the exam administrator (KICE per prior knowledge, UNVERIFIED) |

**3.10.D Quality and evidence**
| Educator_ID | Component scores (8 fields) | Overall_Score | Confidence_Level | Evidence_Summary | Strengths | Limitations | Best_For |
|---|---|---|---|---|---|---|---|
| PEN-ED-0007 | NOT YET SCORED | NOT YET SCORED | Medium | Named in many independent lists [S13][S19][S42][S58]; a creator page records that 3Blue1Brown's author worked there [S01]. | Broad structured coverage; free access (nonprofit model per S58). | Channel URL and regional variants not captured; depth for advanced topics not reviewed. Content not reviewed. | Beginner-to-intermediate foundations across school subjects. |
| PEN-ED-0011 | NOT YET SCORED | NOT YET SCORED | Medium | MIT's own news release refers to its OpenCourseWare YouTube channel [S17]; course mentions in community thread [S18]. | University-grade course sequences from an accredited institution. | Channel URL and website not captured; individual courses vary in age and format. Content not reviewed. | Full university courses with problem sets on the OCW site. |
| PEN-ED-0016 | NOT YET SCORED | NOT YET SCORED | Low | Channel URL and video-count statement in a university resource list [S10]; community post groups it with Khan Academy as formal-education channel [S11]. | Very broad worked-problem library (source-described). | Instructor identity not captured; accuracy and pedagogy not reviewed. Content not reviewed. | Worked problems for chemistry and maths courses. |
| PEN-ED-0028 | NOT YET SCORED | NOT YET SCORED | Low | Directory self-description [S25]; handle in college list [S22]. | Multi-subject revision. | Alignment not verified. Content not reviewed. | Multi-subject revision. |
| PEN-ED-0029 | NOT YET SCORED | NOT YET SCORED | Medium | URL in school guide [S20]; BBC Bitesize described as essential revision site by college [S21]. | Curriculum-linked content from a public broadcaster. | Board-specific variation not reviewed. Content not reviewed. | Broad GCSE revision. |
| PEN-ED-0030 | NOT YET SCORED | NOT YET SCORED | Low | URL and description in school guide [S20]. | Teacher-oriented classroom content. | Subject coverage not catalogued. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0075 | NOT YET SCORED | NOT YET SCORED | Medium | Encyclopedia entry confirms the 2016 YouTube origin and audience [S40]; the @PhysicsWallah handle appears only in owner-authored description text scraped onto a low-reliability page [S84]; video titles in a third-party document show a rotational-motion series [S81]. | Exam-focused series with revision and one-shot formats (titles). | Paid app is the main product; teaching quality, level fit for Advanced-only content and accuracy not reviewed. Content not reviewed. | JEE/NEET physics lecture series (rotational mechanics titles seen). |
| PEN-ED-0076 | NOT YET SCORED | NOT YET SCORED | Low | Named in a low-reliability SEO list [S43]; sibling channels referenced in PW text [S81]. | NOT_REVIEWED | Low-reliability source; handle not captured. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0077 | NOT YET SCORED | NOT YET SCORED | Low | Five independent mentions [S41][S42][S48][S49][S50]. | Large multi-exam faculty. | Multiple channels; handles not captured; platform is largely paid. Content not reviewed. | REQUIRES FURTHER RESEARCH per exam |
| PEN-ED-0078 | NOT YET SCORED | NOT YET SCORED | Low | Mentioned in S41 and S42. | NOT_REVIEWED | Handle not captured. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0081 | NOT YET SCORED | NOT YET SCORED | Low | Two community mentions [S42][S80]. | NOT_REVIEWED | Weak sources. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0082 | NOT YET SCORED | NOT YET SCORED | Low | Community mention [S42]. Coaching-site content elsewhere in this directory must be treated with conflict-of-interest care. | NOT_REVIEWED | Weak evidence. Content not reviewed. | REQUIRES FURTHER RESEARCH |
| PEN-ED-0091 | NOT YET SCORED | NOT YET SCORED | Medium | Named by platform's official blog [S33], vendor lists [S36][S38], and a thesis analysis [S34]. | Multi-subject ENEM prep. | URL not captured; paid course exists. Content not reviewed. | ENEM multi-subject prep. |
| PEN-ED-0092 | NOT YET SCORED | NOT YET SCORED | Medium | Platform's official blog [S33]; vendor lists [S36][S38]; news (2015) [S39]. | Broad ENEM coverage. | URL not captured; paid course. Content not reviewed. | ENEM revision lives. |
| PEN-ED-0095 | NOT YET SCORED | NOT YET SCORED | Medium | Platform site [S29]; news reports name the YouTube channel and services [S30][S31]; free-access description [S32]. | Free, broadcaster-run, exam-linked. | YouTube channel URL not captured; current instructors NOT_REVIEWED. Content not reviewed. | Suneung preparation in Korean. |

**3.10.E Content discovery**
| Educator_ID | Representative_Video_URLs | Relevant_Playlist_URLs | Topic_Coverage | Practical_Content_Availability | Theory_Content_Availability | Problem_Solving_Availability | Project_Content_Availability | Exam_Question_Practice_Availability | Full_Course_Availability |
|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0007 | NOT_CAPTURED | NOT_CAPTURED | K-12 through early university across maths, sciences, economics, finance and more [S58] | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED |
| PEN-ED-0011 | NOT_CAPTURED | NOT_CAPTURED | University course lectures; community posts cite 18.03 differential equations and 18.06 linear algebra [S18] | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED |
| PEN-ED-0016 | NOT_CAPTURED | NOT_CAPTURED | Over 2,000 videos from algebra upward (count dated); chemistry and maths mentioned by community post [S10][S11] | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0028 | NOT_CAPTURED | NOT_CAPTURED | GCSE and A Level revision across several subjects [S25] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |
| PEN-ED-0029 | NOT_CAPTURED | NOT_CAPTURED | GCSE revision playlists incl. English revision tips [S20]; site covers all GCSE subjects [S21] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |
| PEN-ED-0030 | NOT_CAPTURED | NOT_CAPTURED | Free classroom resources for teachers [S20] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED |
| PEN-ED-0075 | NOT_CAPTURED | NOT_CAPTURED | Rotational Motion series (Class 11 Ch.7) incl. torque, rolling, hinge forces; 5.5-hour revision lecture titles seen in third-party text [S81]; JEE, NEET and CBSE 9-10 audience [S40] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | SOURCE_DESCRIBED |
| PEN-ED-0076 | NOT_CAPTURED | NOT_CAPTURED | Advanced-level mechanics suggestions incl. rotational motion and centre of mass [S43] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |
| PEN-ED-0077 | NOT_CAPTURED | NOT_CAPTURED | Live and recorded classes for JEE, NEET, UPSC, banking; separate GATE channel [S41][S42][S48] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | SOURCE_DESCRIBED |
| PEN-ED-0078 | NOT_CAPTURED | NOT_CAPTURED | JEE lectures by named educators; live doubt solving [S41] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |
| PEN-ED-0081 | NOT_CAPTURED | NOT_CAPTURED | JEE lectures (community list) [S42][S80] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |
| PEN-ED-0082 | NOT_CAPTURED | NOT_CAPTURED | JEE, NEET and olympiad coaching (Kota) [S42] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |
| PEN-ED-0091 | NOT_CAPTURED | NOT_CAPTURED | Pre-ENEM courses; Intensive ENEM sets lesson analysed in thesis [S34][S36] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |
| PEN-ED-0092 | NOT_CAPTURED | NOT_CAPTURED | Free ENEM lessons from a paid course; live revisions [S33][S36] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | NOT_REVIEWED |
| PEN-ED-0095 | NOT_CAPTURED | NOT_CAPTURED | Free CSAT (Suneung) lectures, materials linked to the exam, live post-exam explanation broadcasts [S29][S30][S31] | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | SOURCE_DESCRIBED | SOURCE_DESCRIBED |

**3.10.F Verification and maintenance**
| Educator_ID | Verification_Status | Channel_ID_Verification_Status | Official_Source_References | Last_Verified_Date | Research_Notes | Potential_Duplicates | Record_Version | Corroboration_Level | Entity_Type | Access_Model | Region_Group |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PEN-ED-0007 | UNVERIFIED | NOT_CAPTURED | [S01] [S13] [S19] [S42] [S58] | 2026-10-24 | Several regional Khan Academy channels exist; treat as separate records when identified. | Possible sibling regional channels | 1 | C1 | Nonprofit organisation | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0011 | UNVERIFIED | NOT_CAPTURED | [S17] [S18] | 2026-10-24 | Walter Lewin courses were removed in 2014 (see Section 11). | None identified | 1 | C2 | University or institution channel | Free public videos; other access NOT_REVIEWED | North America |
| PEN-ED-0016 | CHANNEL_VERIFIED_CONTENT_NOT_REVIEWED | NOT_CAPTURED | [S10] [S11] | 2026-10-24 | - | None identified | 1 | C2 | Individual-led channel | Free public videos; other access NOT_REVIEWED | NOT_CAPTURED |
| PEN-ED-0028 | UNVERIFIED | NOT_CAPTURED | [S22] [S25] | 2026-10-24 | - | None identified | 1 | C1 | Commercial tutoring or EdTech company | Free public videos; other access NOT_REVIEWED | UK and Ireland |
| PEN-ED-0029 | CHANNEL_VERIFIED_CONTENT_NOT_REVIEWED | NOT_CAPTURED | [S20] [S21] | 2026-10-24 | - | None identified | 1 | C2 | Official exam body or public broadcaster | Free public videos; other access NOT_REVIEWED | UK and Ireland |
| PEN-ED-0030 | CHANNEL_VERIFIED_CONTENT_NOT_REVIEWED | NOT_CAPTURED | [S20] | 2026-10-24 | - | None identified | 1 | C2 | Official exam body or public broadcaster | Free public videos; other access NOT_REVIEWED | UK and Ireland |
| PEN-ED-0075 | UNVERIFIED | NOT_CAPTURED | [S40] [S41] [S42] [S81] [S84] | 2026-10-24 | Handle taken from owner-authored description text reproduced on a low-reliability scraped page; confirm on youtube.com, then upgrade status. | Related channels (e.g. 'PW JEE Wallah') - separate records | 1 | C1 | Commercial tutoring or EdTech company | Mixed (free YouTube; paid app per S40) | India and South Asia |
| PEN-ED-0076 | UNVERIFIED | NOT_CAPTURED | [S40] [S43] [S81] | 2026-10-24 | - | Related to PEN record for Physics Wallah flagship | 1 | C0 | Commercial tutoring or EdTech company | Free public videos; other access NOT_REVIEWED | India and South Asia |
| PEN-ED-0077 | UNVERIFIED | NOT_CAPTURED | [S41] [S42] [S48] [S49] [S50] | 2026-10-24 | - | Several Unacademy channels (e.g. 'JEE Nexus by Unacademy' per S43) need separate records | 1 | C1 | Commercial tutoring or EdTech company | Mixed | India and South Asia |
| PEN-ED-0078 | UNVERIFIED | NOT_CAPTURED | [S41] [S42] | 2026-10-24 | - | None identified | 1 | C1 | Commercial tutoring or EdTech company | Mixed | India and South Asia |
| PEN-ED-0081 | UNVERIFIED | NOT_CAPTURED | [S42] [S80] | 2026-10-24 | - | None identified | 1 | C0 | Commercial tutoring or EdTech company | Free public videos; other access NOT_REVIEWED | India and South Asia |
| PEN-ED-0082 | UNVERIFIED | NOT_CAPTURED | [S42] | 2026-10-24 | - | None identified | 1 | C0 | Commercial tutoring or EdTech company | Free public videos; other access NOT_REVIEWED | India and South Asia |
| PEN-ED-0091 | UNVERIFIED | NOT_CAPTURED | [S33] [S34] [S36] [S38] | 2026-10-24 | - | None identified | 1 | C2 | Commercial tutoring or EdTech company | Mixed | Latin America |
| PEN-ED-0092 | UNVERIFIED | NOT_CAPTURED | [S33] [S36] [S38] [S39] | 2026-10-24 | - | None identified | 1 | C2 | Commercial tutoring or EdTech company | Mixed | Latin America |
| PEN-ED-0095 | UNVERIFIED | NOT_CAPTURED | [S29] [S30] [S31] [S32] | 2026-10-24 | Platform URL verified; the YouTube channel URL is not captured so channel status stays UNVERIFIED. | None identified | 1 | C2 | Official exam body or public broadcaster | Free public videos; other access NOT_REVIEWED | East Asia |

## Section 4: School Board and Curriculum Directory
Names and administrators were recalled from prior knowledge unless marked otherwise; **similarly named qualifications are not equivalent** (e.g. England's GCSE vs Cambridge IGCSE vs Edexcel International GCSE). Where a board varies by region, the variation must be documented before educators are mapped. Official syllabus references and last-verification dates are `NOT_CAPTURED` except where noted.

| Board_ID | Jurisdiction | Official name (recalled) | Education level | Major qualifications | Language of instruction | Candidate educators (IDs) | Whole-curriculum vs single-subject channels | Official syllabus reference | Fact status | Last verified | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PEN-BD-001 | International | International Baccalaureate (PYP, MYP, DP) | Primary, middle, upper secondary | IB Diploma; MYP and PYP programmes | English, French, Spanish and others | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | No verified channel. |
| PEN-BD-002 | International | Cambridge International (Primary, Lower Secondary, IGCSE, O Level, AS and A Level) | Primary to pre-university | IGCSE, O Level, AS, A Level | English | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | Distinct from England's GCSE/A Level. |
| PEN-BD-003 | International | Pearson Edexcel (GCSE, GCE, International GCSE, International A Level) | Secondary to pre-university | GCSE, GCE, IGCSE, IAL | English | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | Edexcel International GCSE differs from England GCSE. |
| PEN-BD-004 | England | GCSE and A Level (AQA, OCR, Pearson Edexcel, WJEC/Eduqas) | KS4 and sixth form | GCSE, A Level | English | PEN-ED-0019, PEN-ED-0020, PEN-ED-0021, PEN-ED-0022, PEN-ED-0023, PEN-ED-0024, PEN-ED-0025, PEN-ED-0026, PEN-ED-0027, PEN-ED-0028, PEN-ED-0029, PEN-ED-0018 | Mixed; whole-curriculum scope NOT_REVIEWED | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | OCR physics walkthroughs [S20]; other specification alignment unchecked. |
| PEN-BD-005 | Scotland, Wales, Northern Ireland | SQA, Qualifications Wales, CCEA national qualifications | Secondary | National 5, Higher, GCSE/A Level variants | English | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | Do not conflate with England; no mapping yet. |
| PEN-BD-006 | India | Central Board of Secondary Education (CBSE) | Classes 1-12 | Class 10 and Class 12 board examinations | English, Hindi | PEN-ED-0075 | Mixed; whole-curriculum scope NOT_REVIEWED | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | PW is documented as serving CBSE Class 9-10 [S40]; other educators unmapped. |
| PEN-BD-007 | India | CISCE (ICSE and ISC) | Classes 1-12 | ICSE, ISC | English | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | No mapping. |
| PEN-BD-008 | India | National Institute of Open Schooling (NIOS) | Secondary and senior secondary | Open-school certificates | English, Hindi and others | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | No mapping. |
| PEN-BD-009 | India | State boards (e.g. Maharashtra, Tamil Nadu, Karnataka, Uttar Pradesh, Bihar, West Bengal, Gujarat) | Classes 1-12 | State SSC/HSC | State languages | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | A community Q&A reports few Gujarati-language channels [S51]; regional-language coverage is a known gap. |
| PEN-BD-010 | United States | State standards (e.g. Common Core-derived, Texas TEKS, Virginia SOL, New York Regents, California) | K-12 | State exit exams and diplomas | English, Spanish | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | Most standards are state-specific; no mapping. |
| PEN-BD-011 | United States | College Board Advanced Placement | Upper secondary | AP exams | English | PEN-ED-0002, PEN-ED-0007 | Mixed; whole-curriculum scope NOT_REVIEWED | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | Mapping NOT_VERIFIED. |
| PEN-BD-012 | Canada | Provincial curricula (Ontario OSSD, British Columbia, Alberta, Quebec and others) | K-12 | Provincial diplomas | English, French | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | No mapping. |
| PEN-BD-013 | Australia | Australian Curriculum and state/territory senior certificates (VCE, HSC, QCE, SACE, WACE, TCE) | F-12 | Senior certificates and ATAR | English | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | State variation must be recorded; Armando Hasudungan is tertiary medical, not school. |
| PEN-BD-014 | New Zealand | NCEA | Years 11-13 | NCEA levels 1-3 | English, Maori | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | No mapping. |
| PEN-BD-015 | South Africa | CAPS and National Senior Certificate | Grades R-12 | NSC (Matric) | English, Afrikaans, others | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | No verified educators. |
| PEN-BD-016 | Singapore | Singapore-Cambridge GCE | Secondary and JC | O, N and A Level | English | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | No mapping. |
| PEN-BD-017 | Hong Kong | HKDSE | Senior secondary | HKDSE | English, Chinese | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | No mapping. |
| PEN-BD-018 | China | National curriculum and Gaokao pathway | K-12 | Zhongkao, Gaokao | Mandarin | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | YouTube is not available in mainland China [S02]; local platforms not researched. |
| PEN-BD-019 | Japan | MEXT course of study and Common Test pathway | K-12 | University Common Test | Japanese | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | No mapping. |
| PEN-BD-020 | South Korea | National curriculum and Suneung pathway | K-12 | CSAT | Korean | PEN-ED-0095 | Mixed; whole-curriculum scope NOT_REVIEWED | NOT_CAPTURED | OFFICIAL_SOURCE_SEEN | 2026-10-24 | EBSi official platform [S29]. |
| PEN-BD-021 | France | Baccalaureat | Lycee | Baccalaureat generale/technologique | French | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | No mapping. |
| PEN-BD-022 | Germany | Abitur (state-specific) | Gymnasium upper level | Abitur | German | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | State variation. |
| PEN-BD-023 | Italy | Esame di Stato | Upper secondary | Maturita | Italian | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | No mapping. |
| PEN-BD-024 | Spain | Bachillerato and PAU/EBAU/EvAU | Upper secondary | University access test | Spanish and co-official languages | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | Regional variation. |
| PEN-BD-025 | Brazil | BNCC and ENEM pathway | Basic and secondary | ENEM | Portuguese | PEN-ED-0090, PEN-ED-0091, PEN-ED-0092, PEN-ED-0093, PEN-ED-0094 | Mixed; whole-curriculum scope NOT_REVIEWED | NOT_CAPTURED | PARTIALLY_VERIFIED_SECONDARY | 2026-10-24 | Official YouTube blog lists ENEM channels [S33]. |
| PEN-BD-026 | Nigeria | WAEC, NECO and JAMB pathway | Senior secondary | WASSCE, NECO, UTME | English | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | Only low-reliability leads [S79]. |
| PEN-BD-027 | Kenya | KNEC: KCSE and competency-based curriculum | Secondary | KCSE | English, Kiswahili | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | Curriculum transition requires official check. |
| PEN-BD-028 | Egypt | Thanaweya Amma | Upper secondary | Thanaweya Amma | Arabic | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | Arabic-language discovery not started. |
| PEN-BD-029 | Pakistan | Federal and provincial boards (and Cambridge schools) | Secondary | Matric, intermediate | Urdu, English | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | No mapping. |
| PEN-BD-030 | Bangladesh | General education boards | Secondary | SSC, HSC | Bengali, English | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | No mapping. |
| PEN-BD-031 | Sri Lanka | National curriculum and GCE | Secondary | GCE O/A Level | Sinhala, Tamil, English | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | No mapping. |
| PEN-BD-032 | Nepal | National Examinations Board | Secondary | SEE, Grade 12 | Nepali, English | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | No mapping. |
| PEN-BD-033 | Malaysia | KSSM and SPM/STPM | Secondary | SPM, STPM | Malay, English | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | No mapping. |
| PEN-BD-034 | Indonesia | National curriculum | Basic to secondary | UTBK-SNBT pathway | Indonesian | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | No mapping. |
| PEN-BD-035 | Mexico | Secretaria de Educacion Publica curricula | Basic to upper secondary | Entrance tests | Spanish | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | No mapping. |
| PEN-BD-036 | Turkey | National curriculum and YKS | Secondary | YKS | Turkish | NONE_YET | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | NOT_VERIFIED | No mapping. |

## Section 5: Global Competitive Examination Directory
Organised by category, then country. Fact status: `RECALLED_NOT_VERIFIED` = administrator and structure recalled, official site not fetched; `PARTIALLY_VERIFIED_SECONDARY` = confirmed by secondary sources (mostly commercial); `OFFICIAL_SOURCE_SEEN` = an official page was retrieved. 'Candidate educators' are channels *mentioned for that exam by sources*, not syllabus-verified or content-reviewed. The taxonomy is expandable; this table is **not** a complete list of world examinations.

| Exam_ID | Country_or_Jurisdiction | Examination_Category | Examination_Name | Administering body (status shown in Fact status) | Subject or tested skill | Candidate educators (IDs) | Official syllabus reference | Fact status | Currency notes |
|---|---|---|---|---|---|---|---|---|---|
| PEN-EX-061 | Brazil | UNIVERSITY_ENTRANCE | ENEM | INEP [recalled] | Languages, humanities, natural sciences, mathematics, essay | PEN-ED-0090, PEN-ED-0091, PEN-ED-0092, PEN-ED-0093, PEN-ED-0094 | NOT_CAPTURED | PARTIALLY_VERIFIED_SECONDARY | Platform's own blog lists channels [S33]; syllabus matrix not retrieved. |
| PEN-EX-043 | China | UNIVERSITY_ENTRANCE | Gaokao | Ministry of Education [recalled] | Chinese, mathematics, foreign language, electives | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | YouTube is not available in mainland China [S02]; main platform ecosystem (e.g. Bilibili) not researched. |
| PEN-EX-001 | India | UNIVERSITY_ENTRANCE | JEE Main | National Testing Agency (NTA) [recalled]; two sessions per cycle [S45] | Physics, Chemistry, Mathematics | PEN-ED-0075, PEN-ED-0076, PEN-ED-0077, PEN-ED-0078, PEN-ED-0079, PEN-ED-0080, PEN-ED-0081, PEN-ED-0082 | NOT_CAPTURED | PARTIALLY_VERIFIED_SECONDARY | Gateway to JEE Advanced (top 250,000 category-wise per S45); verify cycle rules officially. |
| PEN-EX-002 | India | UNIVERSITY_ENTRANCE | JEE Advanced | Organising IIT on rotation under the Joint Admission Board; IIT Delhi expected for 2027, not yet officially confirmed [S44][S46] | Physics, Chemistry, Mathematics, experimental skills | PEN-ED-0075, PEN-ED-0076, PEN-ED-0077, PEN-ED-0078, PEN-ED-0079, PEN-ED-0080, PEN-ED-0081, PEN-ED-0082 | Official site named as jeeadv.ac.in by secondary sources [S44][S46]; syllabus PDF not retrieved | PARTIALLY_VERIFIED_SECONDARY | 2027 brochure not yet released per secondary sources (checked 2026-10-24); syllabus said to be unchanged from 2026 unless announced [S45]. |
| PEN-EX-003 | India | UNIVERSITY_ENTRANCE | NEET-UG | National Testing Agency (NTA) [recalled] | Biology, Physics, Chemistry | PEN-ED-0075, PEN-ED-0077, PEN-ED-0082 | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Biology-specific educators not yet discovered. |
| PEN-EX-004 | India | UNIVERSITY_ENTRANCE | CUET-UG | National Testing Agency (NTA) [recalled] | Domain subjects, language, general test | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-005 | India | UNIVERSITY_ENTRANCE | CUET-PG | National Testing Agency (NTA) [recalled] | Subject papers | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-006 | India | UNIVERSITY_ENTRANCE | GATE | IISc and seven IITs jointly, with a rotating organising institute; 2026 organised by IIT Guwahati [S47] | Engineering and science papers, aptitude | PEN-ED-0013, PEN-ED-0087, PEN-ED-0088, PEN-ED-0089, PEN-ED-0041, PEN-ED-0077 | NOT_CAPTURED | PARTIALLY_VERIFIED_SECONDARY | Verify 2027 organising institute and papers officially. |
| PEN-EX-009 | India | UNIVERSITY_ENTRANCE | NATA | Council of Architecture [recalled] | Drawing, aptitude, mathematics | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-010 | India | UNIVERSITY_ENTRANCE | NIFT entrance examinations | National Institute of Fashion Technology [recalled] | Design aptitude | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-011 | India | UNIVERSITY_ENTRANCE | NID DAT | National Institute of Design [recalled] | Design aptitude | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-012 | India | UNIVERSITY_ENTRANCE | UCEED / CEED | IIT Bombay design programme [recalled] | Design aptitude | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-049 | Indonesia | UNIVERSITY_ENTRANCE | UTBK-SNBT | National selection committee [recalled] | Academic potential and skills | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-037 | Italy | UNIVERSITY_ENTRANCE | IMAT | Italian Ministry of University and Research [recalled] | Medicine entrance for international applicants | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-038 | Italy | UNIVERSITY_ENTRANCE | TOLC examinations | CISIA [recalled] | University entrance tests by field | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-044 | Japan | UNIVERSITY_ENTRANCE | Common Test for University Admissions | National Center for University Entrance Examinations [recalled] | Multiple subjects | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | No Japanese-language channels researched. |
| PEN-EX-062 | Mexico | UNIVERSITY_ENTRANCE | EXANI-II and COMIPEMS | CENEVAL [recalled] | Admission tests | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Spanish-language discovery not started. |
| PEN-EX-058 | Nigeria | UNIVERSITY_ENTRANCE | UTME | JAMB [recalled] | Four-subject test | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Only low-reliability analytics leads [S79]. |
| PEN-EX-050 | Pakistan | UNIVERSITY_ENTRANCE | MDCAT and ECAT | REQUIRES FURTHER RESEARCH | Medical and engineering entrance | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-045 | South Korea | UNIVERSITY_ENTRANCE | Suneung (CSAT) | Korea Institute for Curriculum and Evaluation [recalled] | Korean, mathematics, English, inquiry subjects | PEN-ED-0095 | EBSi platform hosts exam-linked lectures [S29] | OFFICIAL_SOURCE_SEEN | EBS is the public broadcaster, not the administrator; sources reference 2027 and 2028 exam cycles on the platform [S29]. |
| PEN-EX-063 | Turkey | UNIVERSITY_ENTRANCE | YKS | Assessment, Selection and Placement Centre [recalled] | Basic proficiency and field tests | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-028 | United Kingdom | UNIVERSITY_ENTRANCE | UCAT | UCAT Consortium [recalled] | Cognitive and situational judgement | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-029 | United Kingdom | UNIVERSITY_ENTRANCE | LNAT | LNAT Consortium [recalled] | Verbal reasoning and essay | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-030 | United Kingdom | UNIVERSITY_ENTRANCE | TMUA | REQUIRES FURTHER RESEARCH | Mathematical thinking | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-031 | United Kingdom | UNIVERSITY_ENTRANCE | MAT | University of Oxford [recalled] | Mathematics problem solving | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-032 | United Kingdom | UNIVERSITY_ENTRANCE | STEP | REQUIRES FURTHER RESEARCH | Advanced mathematics | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-033 | United Kingdom | UNIVERSITY_ENTRANCE | ESAT | REQUIRES FURTHER RESEARCH | Mathematics and sciences modules | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Newer test; confirm status and sponsors. |
| PEN-EX-019 | United States | UNIVERSITY_ENTRANCE | SAT | College Board [recalled] | Reading and writing, mathematics | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Delivered digitally in recent years; verify current format. |
| PEN-EX-020 | United States | UNIVERSITY_ENTRANCE | ACT | ACT, Inc. [recalled] | English, mathematics, reading, optional science | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Format changes reported in recent years; verify. |
| PEN-EX-007 | India | GRADUATE_ADMISSION | CAT | Indian Institutes of Management on rotation [recalled] | Quantitative aptitude, verbal ability, data interpretation | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-008 | India | GRADUATE_ADMISSION | CLAT | Consortium of National Law Universities [recalled] | English, legal reasoning, current affairs, logic, quantitative | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-022 | United States | GRADUATE_ADMISSION | GRE General Test | Educational Testing Service [recalled] | Verbal, quantitative, analytical writing | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Format shortened in recent years; verify. |
| PEN-EX-023 | United States | GRADUATE_ADMISSION | GMAT | Graduate Management Admission Council [recalled] | Quantitative, verbal, data insights | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Current edition differs from classic GMAT; verify. |
| PEN-EX-024 | United States | GRADUATE_ADMISSION | LSAT | Law School Admission Council [recalled] | Reading, logical and analytical reasoning, writing | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-025 | United States | GRADUATE_ADMISSION | MCAT | Association of American Medical Colleges [recalled] | Sciences, CARS | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | No verified MCAT channel found. |
| PEN-EX-026 | United States | GRADUATE_ADMISSION | DAT | American Dental Association [recalled] | Sciences, reading, perceptual ability | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-054 | Australia | SCHOOL_LEAVING | ATAR pathways (state and territory certificates) | State and territory authorities [recalled] | Senior secondary subjects | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | State differences must be recorded. |
| PEN-EX-051 | Bangladesh | SCHOOL_LEAVING | SSC and HSC | Education Boards [recalled] | School subjects | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-027 | Canada | SCHOOL_LEAVING | Provincial diploma and curricula (Ontario OSSD, BC, Alberta, Quebec) | Provincial ministries [recalled] | Provincial subjects | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Provincial differences must be documented before mapping. |
| PEN-EX-060 | Egypt | SCHOOL_LEAVING | Thanaweya Amma | Ministry of Education [recalled] | Secondary subjects | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Arabic-language discovery not started. |
| PEN-EX-040 | France | SCHOOL_LEAVING | Baccalaureat | French Ministry of Education [recalled] | Upper-secondary subjects | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-039 | Germany | SCHOOL_LEAVING | Abitur | State education ministries (Laender) [recalled] | Upper-secondary subjects | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | State differences must be recorded. |
| PEN-EX-047 | Hong Kong | SCHOOL_LEAVING | HKDSE | Hong Kong Examinations and Assessment Authority [recalled] | Core and elective subjects | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-064 | International | SCHOOL_LEAVING | IB Diploma Programme | International Baccalaureate Organization [recalled] | Six subject groups, TOK, EE, CAS | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | No IB-specific channel verified; one economics channel recalled (UNVERIFIED) - Section 11. |
| PEN-EX-065 | International | SCHOOL_LEAVING | Cambridge IGCSE, O Level, AS and A Level | Cambridge University Press and Assessment [recalled] | All subjects | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | No verified channel; not equivalent to UK GCSE. |
| PEN-EX-042 | Italy | SCHOOL_LEAVING | Esame di Stato (upper-secondary) | Italian Ministry of Education [recalled] | Upper-secondary subjects | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-059 | Kenya | SCHOOL_LEAVING | KCSE and competency-based curriculum transition | Kenya National Examinations Council [recalled] | School subjects | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Curriculum transition status requires official check. |
| PEN-EX-048 | Malaysia | SCHOOL_LEAVING | SPM and STPM | Malaysian Examinations Syndicate / Council [recalled] | School subjects | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-053 | Nepal | SCHOOL_LEAVING | Secondary Education Examination and Grade 12 | National Examinations Board [recalled] | School subjects | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-055 | New Zealand | SCHOOL_LEAVING | NCEA | NZQA [recalled] | Standards-based qualification | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-057 | Nigeria | SCHOOL_LEAVING | WASSCE and NECO | WAEC and NECO [recalled] | School subjects | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Only low-reliability analytics leads [S79]; see Section 11. |
| PEN-EX-046 | Singapore | SCHOOL_LEAVING | Singapore-Cambridge GCE O/N/A Level | Singapore Examinations and Assessment Board [recalled] | All subjects | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-056 | South Africa | SCHOOL_LEAVING | National Senior Certificate (CAPS) | Department of Basic Education [recalled] | Matric subjects | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | No verified educators discovered. |
| PEN-EX-041 | Spain | SCHOOL_LEAVING | Bachillerato and university access test (PAU/EBAU/EvAU) | Ministry and regional authorities [recalled] | Upper-secondary subjects | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Regional naming varies; verify. |
| PEN-EX-052 | Sri Lanka | SCHOOL_LEAVING | GCE Advanced Level | Department of Examinations [recalled] | Stream subjects | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-034 | United Kingdom | SCHOOL_LEAVING | GCSE | Awarding organisations (AQA, OCR, Pearson Edexcel, WJEC/Eduqas, CCEA) [recalled] | All subjects | PEN-ED-0019, PEN-ED-0020, PEN-ED-0021, PEN-ED-0023, PEN-ED-0024, PEN-ED-0025, PEN-ED-0026, PEN-ED-0027, PEN-ED-0028, PEN-ED-0029, PEN-ED-0018 | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Board-by-board alignment unchecked; GCSE is not equivalent to Cambridge IGCSE. |
| PEN-EX-035 | United Kingdom | SCHOOL_LEAVING | A Level (GCE) | Awarding organisations [recalled] | Subject exams | PEN-ED-0021, PEN-ED-0022, PEN-ED-0019, PEN-ED-0023, PEN-ED-0024, PEN-ED-0025, PEN-ED-0026, PEN-ED-0028 | NOT_CAPTURED | RECALLED_NOT_VERIFIED | OCR physics walkthroughs per S20. |
| PEN-EX-021 | United States | SCHOOL_LEAVING | Advanced Placement (AP) | College Board [recalled] | Subject exams (e.g. Calculus AB) | PEN-ED-0002, PEN-ED-0007 | NOT_CAPTURED | RECALLED_NOT_VERIFIED | AP Calculus channels listed only by low-reliability sources; Khan mapping NOT_VERIFIED. |
| PEN-EX-013 | India | CIVIL_SERVICE | UPSC Civil Services Examination | Union Public Service Commission [recalled] | General studies, optional subject, essay | PEN-ED-0083, PEN-ED-0084, PEN-ED-0085, PEN-ED-0086, PEN-ED-0077 | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Coaching-company channels; none matched to the official syllabus yet. |
| PEN-EX-014 | India | CIVIL_SERVICE | NDA and CDS | Union Public Service Commission [recalled] | Mathematics, general ability, English | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-015 | India | CIVIL_SERVICE | SSC examinations (e.g. CGL) | Staff Selection Commission [recalled] | Reasoning, quantitative, English, general awareness | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-016 | India | CIVIL_SERVICE | Banking recruitment (IBPS, SBI) | IBPS and State Bank of India [recalled] | Reasoning, quantitative, English, banking awareness | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-017 | India | CIVIL_SERVICE | CTET and state TETs | CBSE and state agencies [recalled] | Pedagogy, language, subjects | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-066 | International | OLYMPIAD | International Olympiads (Mathematics, Physics, Chemistry, Biology, Informatics) | International olympiad boards [recalled] | Competition problem solving | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |

## Section 6: Professional Certification Directory
Distinguishes **licensing** (legally required to practise: e.g. `PROFESSIONAL_LICENSE`) from **voluntary certification** (`PROFESSIONAL_CERT`, `IT_CERT`) and **language proficiency** tests. Certification content ages quickly: exam codes, versions and retirement status must be checked on the issuer's site before any recommendation.

| Exam_ID | Country_or_Jurisdiction | Examination_Category | Examination_Name | Administering body (status shown in Fact status) | Subject or tested skill | Candidate educators (IDs) | Official syllabus reference | Fact status | Currency notes |
|---|---|---|---|---|---|---|---|---|---|
| PEN-EX-018 | India | PROFESSIONAL_LICENSE | NEET-PG | National Board of Examinations in Medical Sciences [recalled] | Medical subjects | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-036 | United Kingdom | PROFESSIONAL_LICENSE | PLAB | General Medical Council [recalled] | Clinical knowledge and skills | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Pathway rules change; verify. |
| PEN-EX-067 | United States | PROFESSIONAL_LICENSE | USMLE (Steps 1-3) | NBME and FSMB [recalled] | Medical sciences and clinical knowledge | PEN-ED-0054, PEN-ED-0056, PEN-ED-0059, PEN-ED-0055 | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Educators supplementary only; mapping from commercial sources [S70][S67]. |
| PEN-EX-068 | United States | PROFESSIONAL_LICENSE | NCLEX | NCSBN [recalled] | Nursing practice | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-069 | United States | PROFESSIONAL_LICENSE | CPA Exam | AICPA and NASBA; licensure by state boards [recalled] | Accounting, auditing, tax | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Recent structural changes; verify. |
| PEN-EX-070 | United States | PROFESSIONAL_LICENSE | Bar examinations | Jurisdiction-specific [recalled] | Law | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Jurisdiction-specific; format changes pending - verify. |
| PEN-EX-071 | United States | PROFESSIONAL_LICENSE | Professional Engineer (FE/PE) | NCEES [recalled] | Engineering | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-072 | International | PROFESSIONAL_CERT | CFA Program | CFA Institute [recalled] | Investment analysis | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Voluntary credential; no verified channel. |
| PEN-EX-073 | International | PROFESSIONAL_CERT | FRM | GARP [recalled] | Risk management | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Voluntary credential. |
| PEN-EX-074 | International | PROFESSIONAL_CERT | ACCA | ACCA [recalled] | Accounting and finance | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Voluntary professional qualification. |
| PEN-EX-075 | International | PROFESSIONAL_CERT | Actuarial examinations (SOA, CAS and others) | Actuarial societies [recalled] | Actuarial science | PEN-ED-0005 | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Kinney lists financial mathematics for actuaries [S08]; not exam-mapped. |
| PEN-EX-076 | International | IT_CERT | AWS certifications | Amazon Web Services [recalled] | Cloud architecture and operations | PEN-ED-0071, PEN-ED-0072, PEN-ED-0073, PEN-ED-0032 | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Exam versions change; verify current exam guides. |
| PEN-EX-077 | International | IT_CERT | Microsoft Azure certifications | Microsoft [recalled] | Azure administration, development | PEN-ED-0074, PEN-ED-0073 | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Some certifications are retired periodically; verify. |
| PEN-EX-078 | International | IT_CERT | Google Cloud certifications | Google Cloud [recalled] | Cloud | PEN-ED-0073 | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Candidates for GCP preparation recalled in sources but not verified. |
| PEN-EX-079 | International | IT_CERT | CompTIA, Cisco, Red Hat, Oracle, Kubernetes/CNCF, Salesforce, Databricks, Snowflake, Adobe, Autodesk | Respective vendors [recalled] | Vendor-specific | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Only low-reliability channel mentions [S66]; discovery not completed. |
| PEN-EX-080 | International | LANGUAGE_PROFICIENCY | IELTS | Jointly owned by British Council, IDP and Cambridge [recalled]; British Council runs an official TakeIELTS YouTube channel [S27] | Listening, reading, writing, speaking | PEN-ED-0096 | Official preparation page [S27] | OFFICIAL_SOURCE_SEEN | Independent IELTS teachers (IELTS Liz, IELTS Ryan) only in community Q&A [S28]. |
| PEN-EX-081 | International | LANGUAGE_PROFICIENCY | TOEFL iBT | ETS [recalled] | Reading, listening, speaking, writing | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Format revised in 2026 per prior knowledge (UNVERIFIED); official ETS channel named only in community Q&A [S28]. |
| PEN-EX-082 | International | LANGUAGE_PROFICIENCY | PTE Academic | Pearson [recalled] | Four skills | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-083 | International | LANGUAGE_PROFICIENCY | Cambridge English qualifications | Cambridge University Press and Assessment [recalled] | Four skills | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-084 | International | LANGUAGE_PROFICIENCY | Duolingo English Test | Duolingo [recalled] | Adaptive English test | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Discovery not started. |
| PEN-EX-085 | International | LANGUAGE_PROFICIENCY | JLPT | Japan Foundation and Japan Educational Exchanges and Services [recalled] | Japanese | NONE_YET | NOT_CAPTURED | RECALLED_NOT_VERIFIED | No Japanese-learning channel verified. |
| PEN-EX-086 | International | LANGUAGE_PROFICIENCY | HSK | Chinese Testing International [recalled] | Mandarin | PEN-ED-0067 | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Yoyo Chinese mapping NOT_VERIFIED [S77]. |
| PEN-EX-087 | International | LANGUAGE_PROFICIENCY | TOPIK | NIIED [recalled] | Korean | PEN-ED-0061 | NOT_CAPTURED | RECALLED_NOT_VERIFIED | TTMIK mapping NOT_VERIFIED [S74]. |
| PEN-EX-088 | International | LANGUAGE_PROFICIENCY | DELF and DALF | France Education international [recalled] | French | PEN-ED-0064, PEN-ED-0065 | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Mapping NOT_VERIFIED. |
| PEN-EX-089 | International | LANGUAGE_PROFICIENCY | DELE | Instituto Cervantes [recalled] | Spanish | PEN-ED-0068, PEN-ED-0069 | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Mapping NOT_VERIFIED. |
| PEN-EX-090 | International | LANGUAGE_PROFICIENCY | Goethe-Zertifikat | Goethe-Institut [recalled] | German | PEN-ED-0070, PEN-ED-0060 | NOT_CAPTURED | RECALLED_NOT_VERIFIED | Mapping NOT_VERIFIED. |

**Cloud/IT certification educators with corroboration (not content-reviewed):** PEN-ED-0071 Stephane Maarek, PEN-ED-0072 Digital Cloud Training, PEN-ED-0073 ExamPro, PEN-ED-0074 John Savill's Technical Training, PEN-ED-0032 freeCodeCamp.org. One source is first-party (ExamPro's founder, S65); the others are commercial lists.

## Section 7: Practical Skills and Project-Based Learning Directory
Records whose *source descriptions* indicate hands-on, demonstration, project or career-skill content. Whether a channel actually demonstrates (rather than only explains) must be confirmed in content review.

| Educator_ID | Channel_Name | Practical intents | Source-described format | Subjects | Verification_Status |
|---|---|---|---|---|---|
| PEN-ED-0017 | Periodic Table of Videos | LABORATORY_DEMONSTRATIONS | Demonstration videos | D02.02 Chemistry | UNVERIFIED |
| PEN-ED-0032 | freeCodeCamp.org | PRACTICAL_TUTORIALS, PROJECT_BASED_LEARNING | Coding walkthroughs and full courses | D03.02 Programming fundamentals; D03.03 Python; D03.08 JavaScript; D03.19 Web development; D04.14 Data science; D03.32 Cloud computing | CHANNEL_VERIFIED_CONTENT_NOT_REVIEWED |
| PEN-ED-0033 | Programming with Mosh | PRACTICAL_TUTORIALS | Structured tutorials | D03.03 Python; D03.04 Java; D03.07 C#; D03.19 Web development | UNVERIFIED |
| PEN-ED-0035 | NeetCode / NeetCodeIO | CAREER_ORIENTED_SKILLS | Problem walkthroughs | D03.15 Data structures and algorithms; D03.18 Competitive programming | UNVERIFIED |
| PEN-ED-0036 | takeUforward | CAREER_ORIENTED_SKILLS | Problem walkthroughs | D03.15 Data structures and algorithms | UNVERIFIED |
| PEN-ED-0037 | CS Dojo | CAREER_ORIENTED_SKILLS | Explainer videos | D03.15 Data structures and algorithms; D03.02 Programming fundamentals | UNVERIFIED |
| PEN-ED-0039 | Traversy Media | PROJECT_BASED_LEARNING, PRACTICAL_TUTORIALS | Project tutorials | D03.19 Web development; D03.08 JavaScript | UNVERIFIED |
| PEN-ED-0040 | Fireship | CAREER_ORIENTED_SKILLS | Short overview videos | D03.08 JavaScript; D03.33 DevOps | UNVERIFIED |
| PEN-ED-0042 | Andrej Karpathy | PRACTICAL_TUTORIALS, PROJECT_BASED_LEARNING | Lecture plus live coding | D04.03 Deep learning; D04.25 Neural networks; D04.05 Large language models | UNVERIFIED |
| PEN-ED-0044 | DeepLearning.AI | CAREER_ORIENTED_SKILLS | Structured lectures | D04.02 Machine learning; D04.03 Deep learning; D04.04 Generative AI; D04.20 MLOps | UNVERIFIED |
| PEN-ED-0046 | fast.ai | PRACTICAL_TUTORIALS | Course lectures | D04.03 Deep learning | UNVERIFIED |
| PEN-ED-0049 | Krish Naik | PRACTICAL_TUTORIALS, CAREER_ORIENTED_SKILLS | Tutorials and projects | D04.02 Machine learning; D04.06 Natural language processing; D04.14 Data science | UNVERIFIED |
| PEN-ED-0060 | Easy Languages (multiple channels) | PRACTICAL_TUTORIALS | Street interviews with bilingual subtitles | D10.05 German; D10.03 Spanish; D10.04 French; D10.19 Listening | UNVERIFIED |
| PEN-ED-0062 | Learn Korean in Korean | PRACTICAL_TUTORIALS | Immersion lessons | D10.08 Korean | UNVERIFIED |
| PEN-ED-0066 | InnerFrench | PRACTICAL_TUTORIALS | Spoken-French lessons | D10.04 French; D10.19 Listening | UNVERIFIED |
| PEN-ED-0069 | Dreaming Spanish | PRACTICAL_TUTORIALS | Comprehensible-input videos | D10.03 Spanish; D10.19 Listening | UNVERIFIED |
| PEN-ED-0071 | Stephane Maarek | PROFESSIONAL_CERTIFICATION | Course lectures | D03.32 Cloud computing | UNVERIFIED |
| PEN-ED-0072 | Digital Cloud Training | PROFESSIONAL_CERTIFICATION | Course lectures | D03.32 Cloud computing | UNVERIFIED |
| PEN-ED-0073 | ExamPro | PROFESSIONAL_CERTIFICATION | Full courses and practice exams | D03.32 Cloud computing | UNVERIFIED |
| PEN-ED-0074 | John Savill's Technical Training | PROFESSIONAL_CERTIFICATION | Lectures | D03.32 Cloud computing | UNVERIFIED |

**Curated index resources (not channels; unverified individually):** the University of Washington Physics Lecture Demonstration Facility publishes a list of university physics demonstration and lecture channels (e.g. Cleveland State University - The Flying Circus of Physics with Jearl Walker; Colorado State University - Little Shop of Physics; BYU Physics and Astronomy; MIT Technical Services Group; Utah State University) [S15]. These are strong leads for `LABORATORY_DEMONSTRATIONS` and should be added as records after channel capture.
**Vocational and trade skills (D12), arts (D11), finance credentials (D07):** no candidates were discovered in this session. This is a research gap, not evidence of absence (Section 11).

## Section 8: Best Educators by Learning Objective
Labels below are **`SOURCE_SUPPORTED_PROVISIONAL`**: each entry has at least one source that describes the channel in that role; none is content-verified or scored. Where evidence is too thin, the cell says so rather than naming a leader.

| Objective | Provisional entries | Source evidence | Limitation / gap |
|---|---|---|---|
| Best for beginners | PEN-ED-0032 freeCodeCamp.org, PEN-ED-0007 Khan Academy, PEN-ED-0033 Programming with Mosh, PEN-ED-0043 StatQuest with Josh Starmer | freeCodeCamp: self-paced beginner courses [S55]; Khan Academy: arithmetic upwards [S58]; Mosh: structured beginner courses [S54]; StatQuest: for learners intimidated by ML maths [S61] | Language and school-science beginner channels are single-vendor-sourced |
| Best for deep conceptual understanding | PEN-ED-0001 3Blue1Brown, PEN-ED-0043 StatQuest with Josh Starmer, PEN-ED-0042 Andrej Karpathy, PEN-ED-0057 Dr. Najeeb Lectures, PEN-ED-0055 Armando Hasudungan | Visual-first mission [S01]; statistical intuition [S61]; first-principles implementation [S60]; hand-drawn medical teaching [S71][S67] | Not exam-aligned |
| Best for rigorous theory | PEN-ED-0005 Bill Kinney Math, PEN-ED-0006 Clemson University course videos (channel name NOT_CAPTURED), PEN-ED-0012 Fundamentals of Physics (Yale lectures), PEN-ED-0034 Abdul Bari, PEN-ED-0051 Ben Lambert | Upper-level maths lectures [S08]; structure-focused ODE course [S09]; university physics by a named chair [S16]; theory-leaning algorithms [S52]; undergraduate/graduate economics courses [S72] | No proof-level channel verified beyond the first two |
| Best for practical tutorials | PEN-ED-0032 freeCodeCamp.org, PEN-ED-0042 Andrej Karpathy, PEN-ED-0033 Programming with Mosh, PEN-ED-0049 Krish Naik | Hands-on programming lessons [S58]; live-coding lectures [S60]; practice-oriented ML [S60] | No vocational or lab-skills channel verified |
| Best for solving difficult problems | None assigned | No entry meets the evidence bar. Weak leads only: The GCSE Maths Tutor (community praise for hardest questions [S23]); Physics Galaxy (low-reliability list [S43]). | REQUIRES FURTHER RESEARCH |
| Best for examination preparation | PEN-ED-0096 TakeIELTS (British Council), PEN-ED-0095 EBS 고교강의 / EBSi, PEN-ED-0075 Physics Wallah - Alakh Pandey, PEN-ED-0021 Physics Online, PEN-ED-0022 Z-Physics, PEN-ED-0019 Free Science Lessons, PEN-ED-0090 Matematica com Ferretto, PEN-ED-0091 Me Salva!, PEN-ED-0092 Descomplica | Official IELTS channel [S27]; broadcaster-run Suneung platform [S29]; JEE/NEET/CBSE origin and rotational-motion series titles [S40][S81]; OCR paper walkthroughs [S20]; ENEM lists incl. platform blog [S33] | Syllabus alignment unchecked for every entry |
| Best for complete courses | PEN-ED-0031 CS50, PEN-ED-0011 MIT OpenCourseWare, PEN-ED-0032 freeCodeCamp.org, PEN-ED-0002 Professor Leonard, PEN-ED-0005 Bill Kinney Math, PEN-ED-0050 Marginal Revolution University, PEN-ED-0045 Stanford Online | Introductory university course [S56]; institution courses [S17][S18]; multi-hour full courses [S55]; lecture ranges [S10][S08]; full economics principles [S72]; recorded Stanford courses [S63] | Course completeness not verified |
| Best for revision | PEN-ED-0020 Cognito, PEN-ED-0029 BBC Bitesize GCSE, PEN-ED-0018 Amoeba Sisters, PEN-ED-0092 Descomplica | Concise run-throughs of every topic [S20]; GCSE revision playlists [S20]; revision-focused biology [S20]; live ENEM revisions [S33] | UK-heavy |
| Best for project-based learning | PEN-ED-0032 freeCodeCamp.org, PEN-ED-0042 Andrej Karpathy | Project and course content [S55]; build-from-scratch models [S60] | Thin evidence |
| Best for advanced and research-level education | PEN-ED-0045 Stanford Online, PEN-ED-0048 Yannic Kilcher, PEN-ED-0042 Andrej Karpathy, PEN-ED-0047 Sebastian Raschka, PEN-ED-0005 Bill Kinney Math | Graduate course lectures [S63]; research-paper walkthroughs [S61]; research explanations [S62] | Single-source for several |

## Section 9: Language and Regional Coverage
Regional counts come from the `Region_Group` field. `NOT_CAPTURED` means the sources did not state a location and none was inferred.
| Region group | Records | Identity-verified | Coverage label |
|---|---|---|---|
| India and South Asia | 16 | 0 | PARTIALLY_MAPPED |
| North America | 8 | 1 | PARTIALLY_MAPPED |
| UK and Ireland | 13 | 5 | PARTIALLY_MAPPED |
| Continental Europe | 1 | 0 | INITIAL_DISCOVERY |
| East Asia | 1 | 0 | INITIAL_DISCOVERY |
| Southeast Asia | 0 | 0 | REQUIRES_FURTHER_RESEARCH |
| Middle East | 0 | 0 | REQUIRES_FURTHER_RESEARCH |
| Africa | 0 | 0 | REQUIRES_FURTHER_RESEARCH |
| Latin America | 5 | 0 | PARTIALLY_MAPPED |
| Australia and New Zealand | 2 | 0 | INITIAL_DISCOVERY |
| NOT_CAPTURED | 50 | 8 | NOT_APPLICABLE |

| Primary instruction language (as recorded) | Records |
|---|---|
| NOT_CAPTURED | 51 |
| English | 32 |
| Hindi | 6 |
| Portuguese | 5 |
| Local language with English subtitles | 1 |
| Korean | 1 |

**Observations.** (1) English dominates the records because English-language list sources dominate the web results; this is an artefact of search, not of quality. (2) The only verified non-English official education body is Korea's EBS (platform verified; YouTube channel URL pending). (3) Brazilian ENEM coverage is relatively broad for Portuguese thanks to an official YouTube blog [S33]. (4) YouTube is not available in mainland China [S02], so Chinese school and Gaokao education needs a platform strategy (e.g. Bilibili) beyond YouTube. (5) No records exist for Arabic, Japanese, Russian, Turkish, Indonesian, Swahili, Hausa/Yoruba or most Indian regional-language education.

## Section 10: Quality and Verification Methodology
### 10.1 Scoring model (to be applied in edition 0.2)
| Criterion | Weight | Field |
|---|---|---|
| Subject expertise and demonstrated competence | 20 | Expertise_Score |
| Teaching clarity and pedagogical quality | 20 | Teaching_Clarity_Score |
| Accuracy and reliability of explanations | 15 | Accuracy_Score |
| Curriculum or examination alignment | 15 | Curriculum_Alignment_Score |
| Conceptual depth and completeness | 10 | Depth_Score |
| Practical demonstrations, exercises or problem solving | 10 | Practical_Value_Score |
| Content organisation and learning progression | 5 | Organization_Score |
| Recency and maintenance | 5 | Recency_Score |
`Overall_Score` = sum of the eight component scores. Bands: 90-100 Exceptional; 80-89 Excellent; 70-79 Strong; 60-69 Useful; below 60 not shortlisted without further evidence. Criteria are applied relative to a channel's purpose (a theory channel is not penalised for lacking coding demos). Scores require direct review of at least 2-3 representative videos or playlists; otherwise `NOT YET SCORED`. Scores are research classifications, not universal truths.
### 10.2 Confidence levels
`High`: content-reviewed plus official or institutional corroboration. `Medium`: multiple independent or official sources, content unreviewed. `Low`: single or weak source. In edition 0.1.0 no record is High.
### 10.3 Verification statuses (controlled vocabulary)
| Status | Rule used in this edition |
|---|---|
| `VERIFIED_CHANNEL_AND_CONTENT` | Not used (needs content review and YouTube confirmation) |
| `VERIFIED_CHANNEL_CONTENT_PARTIALLY_REVIEWED` | Not used |
| `CHANNEL_VERIFIED_CONTENT_NOT_REVIEWED` | Channel URL string appeared verbatim in a retrieved source AND identity is confirmed by an official/institutional/owner source (Corroboration `C2`). The YouTube page itself was not opened. |
| `UNVERIFIED` | Everything else, including channels with well-corroborated identity but no captured URL |
| `INACTIVE_OR_UNAVAILABLE` | None identified yet; activity not checked |
| `DUPLICATE_RECORD` | None; potential duplicates are annotated in `Potential_Duplicates` |
### 10.4 Corroboration levels (extension field)
`C2`: named (with URL where stated) by an official, institutional, owner-authored or peer-reviewed source. `C1`: two or more independent secondary sources. `C0`: one secondary source or only low-reliability sources. Commercial test-prep and vendor blogs are treated as secondary and flagged where they have a conflict of interest.
### 10.5 Channel-ID and URL policy
`YouTube_Channel_ID` is captured only when it appears in a retrieved URL; `Channel_ID_Verification_Status` values: `SOURCE_CITED (...)` or `NOT_CAPTURED`. Never derive an ID from a name or handle. Resolution must be done with the official YouTube Data API at ingestion time (Section 13.5).
### 10.6 Quality assurance performed on this document
Automated checks passed before publication: unique `Educator_ID` and `Exam_ID`/`Board_ID`; no duplicate channel names, URLs, handles or IDs; every URL matches a URL pattern; every taxonomy reference resolves to a node; every source tag exists in Section 14; every `CHANNEL_VERIFIED...` record has a YouTube URL and `C2` corroboration; no numeric score appears anywhere. Warnings: none.
### 10.7 Free versus restricted content; accessibility; freshness
`Access_Model` records what the sources say about free versus paid material; for commercial platforms the paid curriculum is **not** assumed to equal the public videos. Subtitle and transcript availability is `NOT_REVIEWED` for all records except where the creator states community subtitles (3Blue1Brown [S02]). Freshness classes: *evergreen* (maths, classical physics, algorithms) vs *volatile* (certifications, exam patterns, laws, official syllabi) - volatile content needs re-verification at least annually.

## Section 11: Research Gaps and Unverified Candidates
### 11.1 What was and was not done (phase status)
| Phase | Status | Notes |
|---|---|---|
| 1 Taxonomy | DONE | 433 nodes incl. proposed domain D23 |
| 2 Candidate discovery | PARTIAL | 96 records plus candidates below |
| 3 Channel identity verification | PARTIAL | 14 identity-verified (URL string + official corroboration); YouTube pages not opened |
| 4 Quality evaluation | NOT DONE | No video review; no scores |
| 5 Mapping to subjects/exams | PARTIAL | Source-described only; no official-syllabus mapping |
| 6 Coverage audit | DONE (this section) | Tables in 1.4 and 9 |
| 7 Dedupe and normalise | PARTIAL | Potential duplicates annotated; none merged |
| 8 Master document | DONE | This file |
| 9 QA | PARTIAL | Automated format checks only (10.6) |
### 11.2 Highest-priority gaps
- Content-level review and scoring of all records (blocked by inability to open YouTube pages).
- Channel URL, handle and channel ID capture for every `UNVERIFIED` record via the YouTube Data API.
- Official-syllabus mapping for each exam (JEE Advanced and NEET first: obtain current official brochures).
- Domains with no primary records (D07 has only incidental coverage via actuarial/financial mathematics): finance credentials (D07), arts and design (D11), vocational skills (D12), early childhood (D13), special education (D14), agriculture (D17), sports science (D18), aviation/maritime/space (D19), defense studies (D20), beauty sciences (D23).
- Regions with no verified educators: Africa, Middle East, Southeast Asia, Japan, China (YouTube blocked; Bilibili strategy needed), most of continental Europe.
- Medical admission and licensing: MCAT, NEET biology, PLAB, NCLEX, MRCP have no mapped educators.
- School boards: IB, Cambridge International, Pearson international qualifications, CISCE, NIOS, US state standards, Australian state curricula have no mapped educators.
- Indian regional languages and non-English exam preparation beyond Hindi.
- Engineering branches other than GATE-linked lecture series; laboratory and simulation channels.
- Replace coaching-company sources (conflict of interest) with official exam-body documents for exam facts.
### 11.3 Unverified candidates and flagged channels (not directory records)
Items marked `RECALLED_NOT_CORROBORATED` come from prior knowledge, not from this session's sources. `EDITORIAL_REVIEW_REQUIRED` means an ethical or policy decision is needed before inclusion.

| Candidate | Domain or exam | Status | Evidence and notes |
|---|---|---|---|
| Walter Lewin lectures (copies on third-party channels such as 'For the Allure of Physics', self-described unofficial) | Physics | EDITORIAL_REVIEW_REQUIRED | MIT indefinitely removed his online courses from OpenCourseWare and edX in December 2014 after finding a violation of its sexual harassment policy [S17]; third-party copies persist [S15][S18]. Excluded from shortlist pending an editorial policy decision. |
| Gate Smashers | CS (GATE) | RECALLED_NOT_CORROBORATED | Not present in retrieved text. |
| Jenny's Lectures CS/IT | CS | WEAK_MENTION | Name appears once in a community article [S57]. |
| Ben Eater | Computer architecture, electronics | RECALLED_NOT_CORROBORATED | Referenced by 3Blue1Brown channel pages as a collaborator (Criblate) [S02]; teaching content not retrieved. |
| Professor Messer; Jeremy's IT Lab; NetworkChuck; The Cyber Mentor; John Hammond; LiveOverflow | IT certifications and security | WEAK_MENTION | Only in low-reliability list posts [S66]. |
| Adrian Cantrill (AWS) | Cloud certification | WEAK_MENTION | Only in a forum answer; no reliable source retrieved. |
| Antoni Tzavelas (GCP) | Cloud certification | WEAK_MENTION | Single commercial list [S64]. |
| Only IAS; Sleepy Classes; Finology Legal | UPSC | WEAK_MENTION | Community Q&A [S49][S50]. |
| eCareerPoint; Goprep; Eduniti; JEE Nexus by Unacademy | JEE | WEAK_MENTION | Community and SEO lists [S42][S43]. |
| IELTS Liz; IELTS Ryan; Notefull; Magoosh TOEFL; ETS TOEFL official channel (current name unverified) | English tests | WEAK_MENTION | Community Q&A [S28]. |
| Professor Ivys; Aulalivre; Imaginie Redacao; Professor Noslen | ENEM | WEAK_MENTION | Editorial and platform lists [S35][S36][S33]. |
| Korean Unnie; Learn Korean with Go! Billy Korean | Korean | WEAK_MENTION | Vendor blog [S75]. |
| Excellence Academy; Great Minds Academy; ExamGuide | West African exams (JAMB, WAEC, NECO) | ANALYTICS_INFERRED_ONLY | Inferred by an analytics site's audience model, not by a teaching review [S79]. |
| Sixty Symbols; Physics Girl; Eugene Khutoryansky videos; Physics Explained | Physics outreach | WEAK_MENTION | Editorial list [S14]. |
| Alex Maths Engineering | Engineering mathematics | WEAK_MENTION | Commercial list [S82]. |
| Yobinori (Japanese maths/physics), Bilibili-based Chinese educators, Arabic-language educators | East Asia / Middle East | NOT_RESEARCHED | Named as research priorities; no corroborating sources retrieved this session. |
| Vocational, arts, music, design and finance-credential educators (e.g. welding, electrical trades, drawing, CFA/FRM) | Domains D07, D11, D12 | NOT_RESEARCHED | No candidates discovered this session. |

### 11.4 Next research priorities
1. Resolve handles/IDs through the YouTube Data API and record canonical IDs. 2. Review 2-3 videos per shortlisted channel (start with the 21 records that are `CHANNEL_VERIFIED...` or `UNVERIFIED` with `C2` corroboration) and score. 3. Fetch official syllabi for JEE Advanced, NEET-UG, GATE, UPSC, ENEM, Suneung, GCSE (OCR), IELTS. 4. Run regional discovery in Arabic, Japanese, Mandarin (Bilibili), Indonesian, Spanish (Latin America), Swahili and Indian regional languages. 5. Add vocational, arts, finance-credential and early-childhood domains.

## Section 12: Alphabetical and Taxonomic Index
All indexes are generated from the records and list `Educator_ID`s.
### 12.1 By educator name (records whose educator name is NOT_CAPTURED are omitted)
| Key | Educator_IDs |
|---|---|
| Abdul Bari | PEN-ED-0034 |
| Alakh Pandey | PEN-ED-0075 |
| Alexa Polidoro | PEN-ED-0064 |
| Amoeba Sisters | PEN-ED-0018 |
| Andrej Karpathy | PEN-ED-0042 |
| Andrew Brown | PEN-ED-0073 |
| Andrew Ng and DeepLearning.AI | PEN-ED-0044 |
| Armando Hasudungan | PEN-ED-0055 |
| Ashish Arora (UNVERIFIED name) | PEN-ED-0079 |
| BBC | PEN-ED-0029, PEN-ED-0030 |
| Ben Lambert | PEN-ED-0051 |
| Brady Haran and guests (NOT_REVIEWED) | PEN-ED-0009 |
| British Council | PEN-ED-0096 |
| Burkard Polster (Monash University) | PEN-ED-0010 |
| Corbettmaths team | PEN-ED-0024 |
| CrashCourse (Complexly) | PEN-ED-0053 |
| Descomplica | PEN-ED-0092 |
| Digital Cloud Training | PEN-ED-0072 |
| Dr Trefor Bazett | PEN-ED-0004 |
| Dr. Najeeb | PEN-ED-0057 |
| Drishti IAS | PEN-ED-0084 |
| EBS (Korea Educational Broadcasting System) | PEN-ED-0095 |
| Easy Languages network (Hamerski and Schmid founded Easy German) | PEN-ED-0060 |
| Economics Explained | PEN-ED-0052 |
| Etoos Education | PEN-ED-0081 |
| Fireship | PEN-ED-0040 |
| GATE Academy | PEN-ED-0087 |
| GATEMATIC Education (formerly Learn GATE Free) | PEN-ED-0088 |
| Grant Sanderson | PEN-ED-0001 |
| Harvard University (CS50 team) | PEN-ED-0031 |
| Hegarty Maths | PEN-ED-0025 |
| Jeremy Howard (fast.ai) | PEN-ED-0046 |
| John Savill | PEN-ED-0074 |
| Josh Starmer | PEN-ED-0043 |
| Khan Academy | PEN-ED-0007 |
| Krish Naik | PEN-ED-0049 |
| Lewis Matheson | PEN-ED-0021 |
| MIT OpenCourseWare | PEN-ED-0011 |
| Maths Genie | PEN-ED-0026 |
| Me Salva! | PEN-ED-0091 |
| MedCram | PEN-ED-0058 |
| MinutePhysics | PEN-ED-0014 |
| Mohit Tyagi | PEN-ED-0080 |
| Mosh Hamedani (UNVERIFIED name) | PEN-ED-0033 |
| Motion Education | PEN-ED-0082 |
| Mr Bruff (Andrew Bruff) | PEN-ED-0023 |
| Mrunal Patel | PEN-ED-0085 |
| NPTEL (IIT/IISc consortium) | PEN-ED-0013 |
| NeetCode | PEN-ED-0035 |
| Neso Academy | PEN-ED-0041 |
| Ninja Nerd (Zach Murphy and team) | PEN-ED-0056 |
| Osmosis (Elsevier) | PEN-ED-0054 |
| PMF IAS | PEN-ED-0086 |
| Patrick (surname NOT_CAPTURED) | PEN-ED-0008 |
| Paulo Jubilut | PEN-ED-0094 |
| Physics Wallah team | PEN-ED-0076 |
| Primrose Kitten team | PEN-ED-0028 |
| Professor Ferretto | PEN-ED-0090 |
| Professor Leonard | PEN-ED-0002 |
| Ramamurti Shankar (Yale University) | PEN-ED-0012 |
| Ravindrababu Ravula | PEN-ED-0089 |
| Se Liga Nessa Historia | PEN-ED-0093 |
| Sebastian Raschka | PEN-ED-0047 |
| Stanford University | PEN-ED-0045 |
| Stephane Maarek | PEN-ED-0071 |
| StudyIQ | PEN-ED-0083 |
| Talk To Me In Korean | PEN-ED-0061 |
| The GCSE Maths Tutor | PEN-ED-0027 |
| The Physics Classroom | PEN-ED-0015 |
| Traversy Media | PEN-ED-0039 |
| Tyler Cowen and Alex Tabarrok | PEN-ED-0050 |
| Unacademy | PEN-ED-0077 |
| University of Nottingham | PEN-ED-0017 |
| Vedantu | PEN-ED-0078 |
| William M. Kinney | PEN-ED-0005 |
| YK Sugishita | PEN-ED-0037 |
| Yannic Kilcher | PEN-ED-0048 |
| freeCodeCamp | PEN-ED-0032 |
| mycodeschool | PEN-ED-0038 |
| takeUforward | PEN-ED-0036 |

### 12.2 By channel name
| Key | Educator_IDs |
|---|---|
| 3Blue1Brown | PEN-ED-0001 |
| Abdul Bari | PEN-ED-0034 |
| Amoeba Sisters | PEN-ED-0018 |
| Andrej Karpathy | PEN-ED-0042 |
| Armando Hasudungan | PEN-ED-0055 |
| BBC Bitesize GCSE | PEN-ED-0029 |
| BBC Teach (Bitesize for Teachers) | PEN-ED-0030 |
| Ben Lambert | PEN-ED-0051 |
| Bill Kinney Math | PEN-ED-0005 |
| Butterfly Spanish | PEN-ED-0068 |
| CS Dojo | PEN-ED-0037 |
| CS50 | PEN-ED-0031 |
| Clemson University course videos (channel name NOT_CAPTURED) | PEN-ED-0006 |
| Cognito | PEN-ED-0020 |
| Corbettmaths | PEN-ED-0024 |
| CrashCourse | PEN-ED-0053 |
| DeepLearning.AI | PEN-ED-0044 |
| Descomplica | PEN-ED-0092 |
| Digital Cloud Training | PEN-ED-0072 |
| DirtyUSMLE | PEN-ED-0059 |
| Dr. Najeeb Lectures | PEN-ED-0057 |
| Dr. Trefor Bazett | PEN-ED-0004 |
| Dreaming Spanish | PEN-ED-0069 |
| Drishti IAS | PEN-ED-0084 |
| EBS 고교강의 / EBSi | PEN-ED-0095 |
| Easy Languages (multiple channels) | PEN-ED-0060 |
| Economics Explained | PEN-ED-0052 |
| Etoos Education | PEN-ED-0081 |
| ExamPro | PEN-ED-0073 |
| Fireship | PEN-ED-0040 |
| Free Science Lessons | PEN-ED-0019 |
| Fundamentals of Physics (Yale lectures) | PEN-ED-0012 |
| GATE Academy | PEN-ED-0087 |
| GATE Lectures by Ravindrababu Ravula | PEN-ED-0089 |
| GATEMATIC Education | PEN-ED-0088 |
| German with Jenny | PEN-ED-0070 |
| Hegarty Maths | PEN-ED-0025 |
| InnerFrench | PEN-ED-0066 |
| John Savill's Technical Training | PEN-ED-0074 |
| Khan Academy | PEN-ED-0007 |
| Krish Naik | PEN-ED-0049 |
| Learn French With Vincent | PEN-ED-0065 |
| Learn French with Alexa | PEN-ED-0064 |
| Learn Korean in Korean | PEN-ED-0062 |
| MIT OpenCourseWare | PEN-ED-0011 |
| Marginal Revolution University | PEN-ED-0050 |
| Matematica com Ferretto | PEN-ED-0090 |
| Mathologer | PEN-ED-0010 |
| Maths Genie | PEN-ED-0026 |
| Me Salva! | PEN-ED-0091 |
| MedCram | PEN-ED-0058 |
| MinutePhysics | PEN-ED-0014 |
| Mohit Tyagi | PEN-ED-0080 |
| Motion Education | PEN-ED-0082 |
| Mr Bruff | PEN-ED-0023 |
| Mrunal | PEN-ED-0085 |
| NPTEL | PEN-ED-0013 |
| NeetCode / NeetCodeIO | PEN-ED-0035 |
| Neso Academy | PEN-ED-0041 |
| Ninja Nerd | PEN-ED-0056 |
| Numberphile | PEN-ED-0009 |
| Osmosis | PEN-ED-0054 |
| PMF IAS | PEN-ED-0086 |
| PW JEE Wallah | PEN-ED-0076 |
| PatrickJMT | PEN-ED-0008 |
| Periodic Table of Videos | PEN-ED-0017 |
| Physics Galaxy | PEN-ED-0079 |
| Physics Online | PEN-ED-0021 |
| Physics Wallah - Alakh Pandey | PEN-ED-0075 |
| Primrose Kitten Academy | PEN-ED-0028 |
| Professor Jubilut | PEN-ED-0094 |
| Professor Leonard | PEN-ED-0002 |
| Programming with Mosh | PEN-ED-0033 |
| Se Liga Nessa Historia | PEN-ED-0093 |
| Sebastian Raschka | PEN-ED-0047 |
| Seemile Korean | PEN-ED-0063 |
| Stanford Online | PEN-ED-0045 |
| StatQuest with Josh Starmer | PEN-ED-0043 |
| Stephane Maarek | PEN-ED-0071 |
| StudyIQ | PEN-ED-0083 |
| TakeIELTS (British Council) | PEN-ED-0096 |
| Talk To Me In Korean | PEN-ED-0061 |
| The GCSE Maths Tutor | PEN-ED-0027 |
| The Organic Chemistry Tutor | PEN-ED-0016 |
| The Physics Classroom | PEN-ED-0015 |
| Traversy Media | PEN-ED-0039 |
| Unacademy (JEE, GATE and civil-services channels) | PEN-ED-0077 |
| Vedantu JEE | PEN-ED-0078 |
| Yannic Kilcher | PEN-ED-0048 |
| Yoyo Chinese | PEN-ED-0067 |
| Z-Physics | PEN-ED-0022 |
| blackpenredpen | PEN-ED-0003 |
| fast.ai | PEN-ED-0046 |
| freeCodeCamp.org | PEN-ED-0032 |
| mycodeschool | PEN-ED-0038 |
| takeUforward | PEN-ED-0036 |

### 12.3 By subject / taxonomy node
| Key | Educator_IDs |
|---|---|
| D01.01 Arithmetic | PEN-ED-0007 |
| D01.02 Number theory | PEN-ED-0009 |
| D01.03 Elementary mathematics | PEN-ED-0024, PEN-ED-0025, PEN-ED-0026, PEN-ED-0027, PEN-ED-0090, PEN-ED-0091, PEN-ED-0092, PEN-ED-0095 |
| D01.04 Algebra | PEN-ED-0002, PEN-ED-0007, PEN-ED-0008, PEN-ED-0016, PEN-ED-0020, PEN-ED-0024, PEN-ED-0025, PEN-ED-0026, PEN-ED-0028, PEN-ED-0029, PEN-ED-0075, PEN-ED-0076, PEN-ED-0077, PEN-ED-0078, PEN-ED-0080, PEN-ED-0081, PEN-ED-0082, PEN-ED-0090 |
| D01.05 Linear algebra | PEN-ED-0001, PEN-ED-0004, PEN-ED-0005, PEN-ED-0006, PEN-ED-0008, PEN-ED-0011 |
| D01.06 Geometry | PEN-ED-0024 |
| D01.09 Calculus | PEN-ED-0001, PEN-ED-0002, PEN-ED-0003, PEN-ED-0004, PEN-ED-0007, PEN-ED-0008, PEN-ED-0080 |
| D01.10 Multivariable calculus | PEN-ED-0005 |
| D01.11 Differential equations | PEN-ED-0001, PEN-ED-0002, PEN-ED-0004, PEN-ED-0005, PEN-ED-0006, PEN-ED-0008, PEN-ED-0011 |
| D01.12 Real analysis | PEN-ED-0005 |
| D01.14 Abstract algebra | PEN-ED-0005, PEN-ED-0006 |
| D01.15 Discrete mathematics | PEN-ED-0009 |
| D01.18 Statistics | PEN-ED-0002, PEN-ED-0043 |
| D01.24 Set theory | PEN-ED-0090 |
| D01.27 Advanced and research mathematics | PEN-ED-0010 |
| D02.01 Physics | PEN-ED-0007, PEN-ED-0019, PEN-ED-0020, PEN-ED-0021, PEN-ED-0022, PEN-ED-0077, PEN-ED-0078, PEN-ED-0081, PEN-ED-0082, PEN-ED-0091, PEN-ED-0094 |
| D02.01.01 Classical mechanics | PEN-ED-0011, PEN-ED-0012, PEN-ED-0013, PEN-ED-0015, PEN-ED-0016, PEN-ED-0075, PEN-ED-0076, PEN-ED-0079, PEN-ED-0080 |
| D02.01.01.01 Rotational mechanics | PEN-ED-0075 |
| D02.01.02 Electricity and magnetism | PEN-ED-0012 |
| D02.01.05 Waves and optics | PEN-ED-0015 |
| D02.01.06 Modern physics | PEN-ED-0014 |
| D02.02 Chemistry | PEN-ED-0019, PEN-ED-0020, PEN-ED-0028, PEN-ED-0075, PEN-ED-0076, PEN-ED-0077, PEN-ED-0078, PEN-ED-0081, PEN-ED-0082, PEN-ED-0091, PEN-ED-0094 |
| D02.02.01 General chemistry | PEN-ED-0016, PEN-ED-0017 |
| D02.02.02 Organic chemistry | PEN-ED-0016 |
| D02.02.03 Inorganic chemistry | PEN-ED-0017 |
| D02.03 Biology | PEN-ED-0007, PEN-ED-0019, PEN-ED-0020, PEN-ED-0028, PEN-ED-0029, PEN-ED-0053 |
| D02.03.01 Cell biology | PEN-ED-0018 |
| D02.03.03 Genetics | PEN-ED-0018 |
| D02.04.02 Geography | PEN-ED-0086 |
| D03.01 Computer fundamentals | PEN-ED-0011, PEN-ED-0031, PEN-ED-0034, PEN-ED-0041, PEN-ED-0089 |
| D03.02 Programming fundamentals | PEN-ED-0031, PEN-ED-0032, PEN-ED-0037 |
| D03.03 Python | PEN-ED-0031, PEN-ED-0032, PEN-ED-0033 |
| D03.04 Java | PEN-ED-0033 |
| D03.05 C | PEN-ED-0031 |
| D03.07 C# | PEN-ED-0033 |
| D03.08 JavaScript | PEN-ED-0032, PEN-ED-0039, PEN-ED-0040 |
| D03.15 Data structures and algorithms | PEN-ED-0034, PEN-ED-0035, PEN-ED-0036, PEN-ED-0037, PEN-ED-0038, PEN-ED-0089 |
| D03.18 Competitive programming | PEN-ED-0035 |
| D03.19 Web development | PEN-ED-0031, PEN-ED-0032, PEN-ED-0033, PEN-ED-0039 |
| D03.32 Cloud computing | PEN-ED-0032, PEN-ED-0071, PEN-ED-0072, PEN-ED-0073, PEN-ED-0074 |
| D03.33 DevOps | PEN-ED-0040 |
| D04.02 Machine learning | PEN-ED-0043, PEN-ED-0044, PEN-ED-0045, PEN-ED-0047, PEN-ED-0049 |
| D04.03 Deep learning | PEN-ED-0042, PEN-ED-0044, PEN-ED-0046, PEN-ED-0048 |
| D04.04 Generative AI | PEN-ED-0044 |
| D04.05 Large language models | PEN-ED-0042, PEN-ED-0045, PEN-ED-0047 |
| D04.06 Natural language processing | PEN-ED-0049 |
| D04.07 Computer vision | PEN-ED-0045 |
| D04.14 Data science | PEN-ED-0032, PEN-ED-0049 |
| D04.17 Statistics for data science | PEN-ED-0043 |
| D04.20 MLOps | PEN-ED-0044 |
| D04.22 AI research | PEN-ED-0048 |
| D04.25 Neural networks | PEN-ED-0001, PEN-ED-0042 |
| D05.01 Computer engineering | PEN-ED-0013 |
| D05.03 Electrical engineering | PEN-ED-0013 |
| D05.06 Mechanical engineering | PEN-ED-0013 |
| D05.07 Civil engineering | PEN-ED-0013 |
| D05.30 Analog and digital electronics | PEN-ED-0041 |
| D05.32 Control systems | PEN-ED-0087 |
| D05.33 Engineering mathematics | PEN-ED-0013, PEN-ED-0087, PEN-ED-0088 |
| D06.06 Economics | PEN-ED-0052, PEN-ED-0085 |
| D06.07 Microeconomics | PEN-ED-0050, PEN-ED-0051 |
| D06.08 Macroeconomics | PEN-ED-0050, PEN-ED-0053 |
| D06.09 Econometrics | PEN-ED-0050, PEN-ED-0051 |
| D06.11 Finance (business) | PEN-ED-0007 |
| D07.10 Financial mathematics | PEN-ED-0005 |
| D07.16 Actuarial science | PEN-ED-0005 |
| D08.01 Anatomy (medical) | PEN-ED-0054, PEN-ED-0055, PEN-ED-0056 |
| D08.02 Physiology (medical) | PEN-ED-0054, PEN-ED-0055, PEN-ED-0056, PEN-ED-0057 |
| D08.03 Biochemistry (medical) | PEN-ED-0057 |
| D08.04 Pathology | PEN-ED-0054, PEN-ED-0056, PEN-ED-0057, PEN-ED-0058 |
| D08.05 Pharmacology | PEN-ED-0054, PEN-ED-0055, PEN-ED-0056 |
| D08.07 Immunology (medical) | PEN-ED-0055 |
| D08.08 Medicine | PEN-ED-0058, PEN-ED-0059 |
| D09.01 History | PEN-ED-0083, PEN-ED-0084, PEN-ED-0093 |
| D09.02 World history | PEN-ED-0053 |
| D09.03 Regional and national history | PEN-ED-0093 |
| D09.04 Political science | PEN-ED-0083, PEN-ED-0084 |
| D09.06 Sociology | PEN-ED-0028 |
| D09.07 Psychology | PEN-ED-0028, PEN-ED-0053 |
| D09.16 Public administration | PEN-ED-0083, PEN-ED-0084, PEN-ED-0085 |
| D09.24 Education theory | PEN-ED-0030 |
| D10.01 English | PEN-ED-0023, PEN-ED-0029, PEN-ED-0095, PEN-ED-0096 |
| D10.03 Spanish | PEN-ED-0060, PEN-ED-0068, PEN-ED-0069 |
| D10.04 French | PEN-ED-0060, PEN-ED-0064, PEN-ED-0065, PEN-ED-0066 |
| D10.05 German | PEN-ED-0060, PEN-ED-0070 |
| D10.06 Mandarin Chinese | PEN-ED-0067 |
| D10.08 Korean | PEN-ED-0061, PEN-ED-0062, PEN-ED-0063, PEN-ED-0095 |
| D10.16 Grammar | PEN-ED-0061 |
| D10.18 Speaking | PEN-ED-0096 |
| D10.19 Listening | PEN-ED-0060, PEN-ED-0066, PEN-ED-0069, PEN-ED-0096 |
| D10.20 Reading | PEN-ED-0096 |
| D10.21 Writing | PEN-ED-0023, PEN-ED-0092, PEN-ED-0096 |
| D22.01 Quantum computing | PEN-ED-0001 |

### 12.4 By domain
| Key | Educator_IDs |
|---|---|
| D01 Mathematics | PEN-ED-0001, PEN-ED-0002, PEN-ED-0003, PEN-ED-0004, PEN-ED-0005, PEN-ED-0006, PEN-ED-0007, PEN-ED-0008, PEN-ED-0009, PEN-ED-0010, PEN-ED-0011, PEN-ED-0016, PEN-ED-0020, PEN-ED-0024, PEN-ED-0025, PEN-ED-0026, PEN-ED-0027, PEN-ED-0028, PEN-ED-0029, PEN-ED-0043, PEN-ED-0075, PEN-ED-0076, PEN-ED-0077, PEN-ED-0078, PEN-ED-0080, PEN-ED-0081, PEN-ED-0082, PEN-ED-0090, PEN-ED-0091, PEN-ED-0092, PEN-ED-0095 |
| D02 Natural Sciences | PEN-ED-0007, PEN-ED-0011, PEN-ED-0012, PEN-ED-0013, PEN-ED-0014, PEN-ED-0015, PEN-ED-0016, PEN-ED-0017, PEN-ED-0018, PEN-ED-0019, PEN-ED-0020, PEN-ED-0021, PEN-ED-0022, PEN-ED-0028, PEN-ED-0029, PEN-ED-0053, PEN-ED-0075, PEN-ED-0076, PEN-ED-0077, PEN-ED-0078, PEN-ED-0079, PEN-ED-0080, PEN-ED-0081, PEN-ED-0082, PEN-ED-0086, PEN-ED-0091, PEN-ED-0094 |
| D03 Computer Science and Information Technology | PEN-ED-0011, PEN-ED-0031, PEN-ED-0032, PEN-ED-0033, PEN-ED-0034, PEN-ED-0035, PEN-ED-0036, PEN-ED-0037, PEN-ED-0038, PEN-ED-0039, PEN-ED-0040, PEN-ED-0041, PEN-ED-0071, PEN-ED-0072, PEN-ED-0073, PEN-ED-0074, PEN-ED-0089 |
| D04 Artificial Intelligence and Data | PEN-ED-0001, PEN-ED-0032, PEN-ED-0042, PEN-ED-0043, PEN-ED-0044, PEN-ED-0045, PEN-ED-0046, PEN-ED-0047, PEN-ED-0048, PEN-ED-0049 |
| D05 Engineering | PEN-ED-0013, PEN-ED-0041, PEN-ED-0087, PEN-ED-0088 |
| D06 Business, Commerce, and Economics | PEN-ED-0007, PEN-ED-0050, PEN-ED-0051, PEN-ED-0052, PEN-ED-0053, PEN-ED-0085 |
| D07 Finance and Professional Financial Education | PEN-ED-0005 |
| D08 Medical and Health Sciences | PEN-ED-0054, PEN-ED-0055, PEN-ED-0056, PEN-ED-0057, PEN-ED-0058, PEN-ED-0059 |
| D09 Humanities and Social Sciences | PEN-ED-0028, PEN-ED-0030, PEN-ED-0053, PEN-ED-0083, PEN-ED-0084, PEN-ED-0085, PEN-ED-0093 |
| D10 Languages and Communication | PEN-ED-0023, PEN-ED-0029, PEN-ED-0060, PEN-ED-0061, PEN-ED-0062, PEN-ED-0063, PEN-ED-0064, PEN-ED-0065, PEN-ED-0066, PEN-ED-0067, PEN-ED-0068, PEN-ED-0069, PEN-ED-0070, PEN-ED-0092, PEN-ED-0095, PEN-ED-0096 |
| D22 Interdisciplinary and Emerging Fields | PEN-ED-0001 |

### 12.5 By examination
| Key | Educator_IDs |
|---|---|
| PEN-EX-001 JEE Main | PEN-ED-0075, PEN-ED-0076, PEN-ED-0077, PEN-ED-0078, PEN-ED-0079, PEN-ED-0080, PEN-ED-0081, PEN-ED-0082 |
| PEN-EX-002 JEE Advanced | PEN-ED-0075, PEN-ED-0076, PEN-ED-0077, PEN-ED-0078, PEN-ED-0079, PEN-ED-0080, PEN-ED-0081, PEN-ED-0082 |
| PEN-EX-003 NEET-UG | PEN-ED-0075, PEN-ED-0077, PEN-ED-0082 |
| PEN-EX-006 GATE | PEN-ED-0013, PEN-ED-0087, PEN-ED-0088, PEN-ED-0089, PEN-ED-0041, PEN-ED-0077 |
| PEN-EX-013 UPSC Civil Services Examination | PEN-ED-0083, PEN-ED-0084, PEN-ED-0085, PEN-ED-0086, PEN-ED-0077 |
| PEN-EX-021 Advanced Placement (AP) | PEN-ED-0002, PEN-ED-0007 |
| PEN-EX-034 GCSE | PEN-ED-0019, PEN-ED-0020, PEN-ED-0021, PEN-ED-0023, PEN-ED-0024, PEN-ED-0025, PEN-ED-0026, PEN-ED-0027, PEN-ED-0028, PEN-ED-0029, PEN-ED-0018 |
| PEN-EX-035 A Level (GCE) | PEN-ED-0021, PEN-ED-0022, PEN-ED-0019, PEN-ED-0023, PEN-ED-0024, PEN-ED-0025, PEN-ED-0026, PEN-ED-0028 |
| PEN-EX-045 Suneung (CSAT) | PEN-ED-0095 |
| PEN-EX-061 ENEM | PEN-ED-0090, PEN-ED-0091, PEN-ED-0092, PEN-ED-0093, PEN-ED-0094 |
| PEN-EX-067 USMLE (Steps 1-3) | PEN-ED-0054, PEN-ED-0056, PEN-ED-0059, PEN-ED-0055 |
| PEN-EX-075 Actuarial examinations (SOA, CAS and others) | PEN-ED-0005 |
| PEN-EX-076 AWS certifications | PEN-ED-0071, PEN-ED-0072, PEN-ED-0073, PEN-ED-0032 |
| PEN-EX-077 Microsoft Azure certifications | PEN-ED-0074, PEN-ED-0073 |
| PEN-EX-078 Google Cloud certifications | PEN-ED-0073 |
| PEN-EX-080 IELTS | PEN-ED-0096 |
| PEN-EX-086 HSK | PEN-ED-0067 |
| PEN-EX-087 TOPIK | PEN-ED-0061 |
| PEN-EX-088 DELF and DALF | PEN-ED-0064, PEN-ED-0065 |
| PEN-EX-089 DELE | PEN-ED-0068, PEN-ED-0069 |
| PEN-EX-090 Goethe-Zertifikat | PEN-ED-0070, PEN-ED-0060 |

### 12.6 By school board / curriculum
| Key | Educator_IDs |
|---|---|
| PEN-BD-004 GCSE and A Level (AQA, OCR, Pearson Edexcel, WJEC/Eduqas) | PEN-ED-0019, PEN-ED-0020, PEN-ED-0021, PEN-ED-0022, PEN-ED-0023, PEN-ED-0024, PEN-ED-0025, PEN-ED-0026, PEN-ED-0027, PEN-ED-0028, PEN-ED-0029, PEN-ED-0018 |
| PEN-BD-006 Central Board of Secondary Education (CBSE) | PEN-ED-0075 |
| PEN-BD-011 College Board Advanced Placement | PEN-ED-0002, PEN-ED-0007 |
| PEN-BD-020 National curriculum and Suneung pathway | PEN-ED-0095 |
| PEN-BD-025 BNCC and ENEM pathway | PEN-ED-0090, PEN-ED-0091, PEN-ED-0092, PEN-ED-0093, PEN-ED-0094 |

### 12.7 By country
| Key | Educator_IDs |
|---|---|
| Australia | PEN-ED-0010, PEN-ED-0055 |
| Brazil | PEN-ED-0090, PEN-ED-0091, PEN-ED-0092, PEN-ED-0093, PEN-ED-0094 |
| Canada | PEN-ED-0004 |
| Canada (UNVERIFIED) | PEN-ED-0073 |
| Germany (founding team moved to Berlin) | PEN-ED-0060 |
| India | PEN-ED-0013, PEN-ED-0075, PEN-ED-0076, PEN-ED-0077, PEN-ED-0078, PEN-ED-0079, PEN-ED-0080, PEN-ED-0081, PEN-ED-0082, PEN-ED-0083, PEN-ED-0084, PEN-ED-0085, PEN-ED-0086, PEN-ED-0087, PEN-ED-0088, PEN-ED-0089 |
| NOT_CAPTURED | PEN-ED-0002, PEN-ED-0003, PEN-ED-0005, PEN-ED-0007, PEN-ED-0008, PEN-ED-0009, PEN-ED-0014, PEN-ED-0015, PEN-ED-0016, PEN-ED-0018, PEN-ED-0022, PEN-ED-0032, PEN-ED-0033, PEN-ED-0034, PEN-ED-0035, PEN-ED-0036, PEN-ED-0037, PEN-ED-0038, PEN-ED-0039, PEN-ED-0040, PEN-ED-0041, PEN-ED-0042, PEN-ED-0043, PEN-ED-0044, PEN-ED-0046, PEN-ED-0047, PEN-ED-0048, PEN-ED-0049, PEN-ED-0050, PEN-ED-0051, PEN-ED-0052, PEN-ED-0053, PEN-ED-0054, PEN-ED-0056, PEN-ED-0057, PEN-ED-0058, PEN-ED-0059, PEN-ED-0061, PEN-ED-0062, PEN-ED-0063, PEN-ED-0064, PEN-ED-0065, PEN-ED-0066, PEN-ED-0067, PEN-ED-0068, PEN-ED-0069, PEN-ED-0070, PEN-ED-0071, PEN-ED-0072, PEN-ED-0074 |
| South Korea | PEN-ED-0095 |
| United Kingdom | PEN-ED-0017, PEN-ED-0019, PEN-ED-0020, PEN-ED-0021, PEN-ED-0023, PEN-ED-0024, PEN-ED-0025, PEN-ED-0026, PEN-ED-0027, PEN-ED-0028, PEN-ED-0029, PEN-ED-0030 |
| United Kingdom / global | PEN-ED-0096 |
| United States | PEN-ED-0001, PEN-ED-0006, PEN-ED-0011, PEN-ED-0012, PEN-ED-0031, PEN-ED-0045 |

### 12.8 By primary language
| Key | Educator_IDs |
|---|---|
| English | PEN-ED-0001, PEN-ED-0004, PEN-ED-0006, PEN-ED-0010, PEN-ED-0011, PEN-ED-0012, PEN-ED-0013, PEN-ED-0017, PEN-ED-0019, PEN-ED-0020, PEN-ED-0021, PEN-ED-0023, PEN-ED-0024, PEN-ED-0025, PEN-ED-0026, PEN-ED-0027, PEN-ED-0028, PEN-ED-0029, PEN-ED-0030, PEN-ED-0031, PEN-ED-0032, PEN-ED-0045, PEN-ED-0055, PEN-ED-0073, PEN-ED-0077, PEN-ED-0083, PEN-ED-0085, PEN-ED-0086, PEN-ED-0087, PEN-ED-0088, PEN-ED-0089, PEN-ED-0096 |
| Hindi | PEN-ED-0075, PEN-ED-0076, PEN-ED-0078, PEN-ED-0079, PEN-ED-0080, PEN-ED-0084 |
| Korean | PEN-ED-0095 |
| Local language with English subtitles | PEN-ED-0060 |
| NOT_CAPTURED | PEN-ED-0002, PEN-ED-0003, PEN-ED-0005, PEN-ED-0007, PEN-ED-0008, PEN-ED-0009, PEN-ED-0014, PEN-ED-0015, PEN-ED-0016, PEN-ED-0018, PEN-ED-0022, PEN-ED-0033, PEN-ED-0034, PEN-ED-0035, PEN-ED-0036, PEN-ED-0037, PEN-ED-0038, PEN-ED-0039, PEN-ED-0040, PEN-ED-0041, PEN-ED-0042, PEN-ED-0043, PEN-ED-0044, PEN-ED-0046, PEN-ED-0047, PEN-ED-0048, PEN-ED-0049, PEN-ED-0050, PEN-ED-0051, PEN-ED-0052, PEN-ED-0053, PEN-ED-0054, PEN-ED-0056, PEN-ED-0057, PEN-ED-0058, PEN-ED-0059, PEN-ED-0061, PEN-ED-0062, PEN-ED-0063, PEN-ED-0064, PEN-ED-0065, PEN-ED-0066, PEN-ED-0067, PEN-ED-0068, PEN-ED-0069, PEN-ED-0070, PEN-ED-0071, PEN-ED-0072, PEN-ED-0074, PEN-ED-0081, PEN-ED-0082 |
| Portuguese | PEN-ED-0090, PEN-ED-0091, PEN-ED-0092, PEN-ED-0093, PEN-ED-0094 |

### 12.9 By educational level
| Key | Educator_IDs |
|---|---|
| Advanced | PEN-ED-0042, PEN-ED-0044, PEN-ED-0047, PEN-ED-0048, PEN-ED-0061, PEN-ED-0074, PEN-ED-0096 |
| Beginner | PEN-ED-0001, PEN-ED-0002, PEN-ED-0007, PEN-ED-0008, PEN-ED-0016, PEN-ED-0031, PEN-ED-0032, PEN-ED-0033, PEN-ED-0037, PEN-ED-0038, PEN-ED-0039, PEN-ED-0043, PEN-ED-0049, PEN-ED-0060, PEN-ED-0061, PEN-ED-0063, PEN-ED-0064, PEN-ED-0065, PEN-ED-0067, PEN-ED-0068, PEN-ED-0069, PEN-ED-0070, PEN-ED-0073 |
| General audience | PEN-ED-0009, PEN-ED-0010, PEN-ED-0014, PEN-ED-0017, PEN-ED-0052 |
| Intermediate | PEN-ED-0032, PEN-ED-0035, PEN-ED-0036, PEN-ED-0037, PEN-ED-0038, PEN-ED-0039, PEN-ED-0040, PEN-ED-0042, PEN-ED-0043, PEN-ED-0044, PEN-ED-0046, PEN-ED-0047, PEN-ED-0049, PEN-ED-0060, PEN-ED-0062, PEN-ED-0066, PEN-ED-0069, PEN-ED-0071, PEN-ED-0072, PEN-ED-0073, PEN-ED-0074, PEN-ED-0096 |
| Postgraduate | PEN-ED-0045, PEN-ED-0051 |
| Professional | PEN-ED-0058, PEN-ED-0059, PEN-ED-0077, PEN-ED-0083, PEN-ED-0084, PEN-ED-0085, PEN-ED-0086, PEN-ED-0096 |
| School/Secondary | PEN-ED-0015, PEN-ED-0017, PEN-ED-0018, PEN-ED-0019, PEN-ED-0020, PEN-ED-0021, PEN-ED-0023, PEN-ED-0024, PEN-ED-0025, PEN-ED-0026, PEN-ED-0027, PEN-ED-0028, PEN-ED-0029, PEN-ED-0030, PEN-ED-0053, PEN-ED-0075, PEN-ED-0076, PEN-ED-0077, PEN-ED-0078, PEN-ED-0079, PEN-ED-0080, PEN-ED-0081, PEN-ED-0082, PEN-ED-0090, PEN-ED-0091, PEN-ED-0092, PEN-ED-0093, PEN-ED-0094, PEN-ED-0095 |
| UNSPECIFIED | PEN-ED-0003, PEN-ED-0022 |
| University | PEN-ED-0001, PEN-ED-0002, PEN-ED-0004, PEN-ED-0005, PEN-ED-0006, PEN-ED-0007, PEN-ED-0008, PEN-ED-0010, PEN-ED-0011, PEN-ED-0012, PEN-ED-0013, PEN-ED-0016, PEN-ED-0031, PEN-ED-0034, PEN-ED-0041, PEN-ED-0045, PEN-ED-0050, PEN-ED-0051, PEN-ED-0053, PEN-ED-0054, PEN-ED-0055, PEN-ED-0056, PEN-ED-0057, PEN-ED-0075, PEN-ED-0076, PEN-ED-0077, PEN-ED-0078, PEN-ED-0079, PEN-ED-0080, PEN-ED-0081, PEN-ED-0082, PEN-ED-0087, PEN-ED-0088, PEN-ED-0089 |

### 12.10 By learning objective
| Key | Educator_IDs |
|---|---|
| CAREER_ORIENTED_SKILLS | PEN-ED-0035, PEN-ED-0036, PEN-ED-0037, PEN-ED-0040, PEN-ED-0044, PEN-ED-0049 |
| COMPLETE_COURSE | PEN-ED-0002, PEN-ED-0005, PEN-ED-0006, PEN-ED-0007, PEN-ED-0011, PEN-ED-0012, PEN-ED-0013, PEN-ED-0019, PEN-ED-0031, PEN-ED-0032, PEN-ED-0033, PEN-ED-0044, PEN-ED-0045, PEN-ED-0046, PEN-ED-0050, PEN-ED-0051, PEN-ED-0056, PEN-ED-0057, PEN-ED-0061, PEN-ED-0073, PEN-ED-0075, PEN-ED-0077, PEN-ED-0090, PEN-ED-0095 |
| CONCEPTUAL_DEPTH | PEN-ED-0001, PEN-ED-0002, PEN-ED-0004, PEN-ED-0005, PEN-ED-0010, PEN-ED-0034, PEN-ED-0042, PEN-ED-0043, PEN-ED-0047, PEN-ED-0050, PEN-ED-0055, PEN-ED-0057, PEN-ED-0079 |
| EXAM_PREPARATION | PEN-ED-0013, PEN-ED-0019, PEN-ED-0020, PEN-ED-0021, PEN-ED-0022, PEN-ED-0023, PEN-ED-0024, PEN-ED-0025, PEN-ED-0026, PEN-ED-0027, PEN-ED-0028, PEN-ED-0029, PEN-ED-0041, PEN-ED-0054, PEN-ED-0056, PEN-ED-0058, PEN-ED-0059, PEN-ED-0075, PEN-ED-0076, PEN-ED-0077, PEN-ED-0078, PEN-ED-0079, PEN-ED-0080, PEN-ED-0081, PEN-ED-0082, PEN-ED-0083, PEN-ED-0084, PEN-ED-0085, PEN-ED-0086, PEN-ED-0087, PEN-ED-0088, PEN-ED-0089, PEN-ED-0090, PEN-ED-0091, PEN-ED-0092, PEN-ED-0093, PEN-ED-0094, PEN-ED-0095, PEN-ED-0096 |
| FOUNDATIONAL_CONCEPTS | PEN-ED-0001, PEN-ED-0007, PEN-ED-0009, PEN-ED-0014, PEN-ED-0015, PEN-ED-0016, PEN-ED-0017, PEN-ED-0018, PEN-ED-0030, PEN-ED-0031, PEN-ED-0037, PEN-ED-0038, PEN-ED-0043, PEN-ED-0052, PEN-ED-0053, PEN-ED-0054, PEN-ED-0060, PEN-ED-0061, PEN-ED-0063, PEN-ED-0064, PEN-ED-0065, PEN-ED-0067, PEN-ED-0068, PEN-ED-0070, PEN-ED-0093 |
| LABORATORY_DEMONSTRATIONS | PEN-ED-0017 |
| PRACTICAL_TUTORIALS | PEN-ED-0032, PEN-ED-0033, PEN-ED-0039, PEN-ED-0042, PEN-ED-0046, PEN-ED-0049, PEN-ED-0060, PEN-ED-0062, PEN-ED-0066, PEN-ED-0069 |
| PROBLEM_SOLVING | PEN-ED-0003, PEN-ED-0007, PEN-ED-0008, PEN-ED-0016, PEN-ED-0021, PEN-ED-0022, PEN-ED-0024, PEN-ED-0026, PEN-ED-0027, PEN-ED-0035, PEN-ED-0036 |
| PROFESSIONAL_CERTIFICATION | PEN-ED-0071, PEN-ED-0072, PEN-ED-0073, PEN-ED-0074 |
| PROJECT_BASED_LEARNING | PEN-ED-0032, PEN-ED-0039, PEN-ED-0042 |
| RESEARCH_LEVEL | PEN-ED-0045, PEN-ED-0047, PEN-ED-0048 |
| REVISION | PEN-ED-0018, PEN-ED-0019, PEN-ED-0020, PEN-ED-0023, PEN-ED-0024, PEN-ED-0025, PEN-ED-0026, PEN-ED-0028, PEN-ED-0029, PEN-ED-0053, PEN-ED-0054, PEN-ED-0055, PEN-ED-0059, PEN-ED-0075, PEN-ED-0091, PEN-ED-0092, PEN-ED-0094, PEN-ED-0095 |
| THEORETICAL_STUDY | PEN-ED-0005, PEN-ED-0006, PEN-ED-0011, PEN-ED-0012, PEN-ED-0013, PEN-ED-0034, PEN-ED-0041, PEN-ED-0045, PEN-ED-0051 |

## Section 13: Pencill Integration Specification
### 13.1 Design principles
The directory identifies *educators*; the engine must resolve *videos/playlists* afterwards. Never hard-code subjects, channels or exams: all behaviour is driven by the taxonomy, exam and board tables and by record fields.
### 13.2 Import model
Parse each Markdown table by header names (they equal the schema field names) and join on `Educator_ID`. Suggested relational layout:
```sql
educator(educator_id PK, educator_name, channel_name, entity_type, access_model, region_group, country, primary_language, additional_languages, official_website)
channel(educator_id FK, channel_url, channel_handle, youtube_channel_id UNIQUE NULL, id_verification_status)
taxonomy(taxonomy_id PK, parent_id FK, level, name, status)
educator_taxonomy(educator_id FK, taxonomy_id FK, evidence_source_ids)
educator_intent(educator_id FK, intent_code)
exam(exam_id PK, country, category, name, body, syllabus_ref, fact_status)
board(board_id PK, jurisdiction, name, ...)
educator_exam(educator_id FK, exam_id FK, mapping_status)   -- SOURCE_DESCRIBED | SYLLABUS_VERIFIED
educator_board(educator_id FK, board_id FK, mapping_status)
quality(educator_id FK, 8 component scores NULL, overall_score NULL, confidence, last_scored_date)
verification(educator_id FK, status, corroboration_level, last_verified_date, record_version)
source(source_id PK, url, title, class, note);  provenance(educator_id FK, source_id FK)
playlist_topic(playlist_id, educator_id FK, taxonomy_id FK, reviewed_by, reviewed_date)   -- filled by video-level stage
```
Use `YouTube_Channel_ID` as the primary channel key once captured; until then use `Educator_ID`. Deduplicate on (channel ID) first, then (handle), then normalised channel name; honour `Potential_Duplicates` notes (e.g. Easy Languages is a network of many channels; Physics Wallah and Unacademy operate several channels).
### 13.3 Retrieval and ranking
1. **Filter** by: taxonomy node (match same node, descendants, or ancestors with lower weight); `Educational_Level` bucket; learning-intent codes; exam/board IDs; language; `Verification_Status`; `Access_Model`.
2. **Rank** by `Overall_Score` when available. While `NOT YET SCORED`, fall back to a *provisional evidence tier*: `CHANNEL_VERIFIED...` > `UNVERIFIED` with `C2` > `C1` > `C0`; never present this tier as a quality score.
3. **Preference blending**: theory-vs-practice via intents (`THEORETICAL_STUDY`/`CONCEPTUAL_DEPTH` vs `PRACTICAL_TUTORIALS`/`PROJECT_BASED_LEARNING`); exam alignment only counts when the exam mapping is `SYLLABUS_VERIFIED`.
4. **Resolve content**: for each shortlisted educator, search that channel's playlists/videos for the taxonomy topic; check duration, captions, publication date, accuracy and level before recommending. Store accepted mappings in `playlist_topic` with reviewer and date.
5. **Freshness gate**: volatile subjects (certifications, exam patterns, laws) require `last_verified_date` within 12 months.
### 13.4 The three example intents resolved against this edition
These pools are computed from the records (taxonomy match, level and intent filters). They show what the filter returns today, including its limits; they are candidates for the video-resolution stage, not recommendations.
| Learner intent | Filter | Candidate pool today | Caveat |
|---|---|---|---|
| Python / Loops / Beginner / practical / no exam | taxonomy: Programming fundamentals or Python (incl. descendants and ancestors); level Beginner; intent PRACTICAL_TUTORIALS | PEN-ED-0032 freeCodeCamp.org [CHANNEL_VERIFIED_CONTENT_NOT_REVIEWED, C2]; PEN-ED-0033 Programming with Mosh [UNVERIFIED, C1] | Loop-level coverage unverified; resolve in playlists. Only 'Loops' node exists as illustrative. |
| Differential equations / first-order / University / theory + problems | taxonomy: Differential equations; level University; intents THEORETICAL_STUDY or PROBLEM_SOLVING | PEN-ED-0005 Bill Kinney Math [CHANNEL_VERIFIED_CONTENT_NOT_REVIEWED, C2]; PEN-ED-0006 Clemson University course videos (channel name NOT_CAPTURED) [UNVERIFIED, C2]; PEN-ED-0008 PatrickJMT [UNVERIFIED, C1]; PEN-ED-0011 MIT OpenCourseWare [UNVERIFIED, C2] | Rigour and accuracy unverified; Kinney and Macauley are instructor-authored university series per their own pages [S08][S09]. |
| JEE Advanced / Physics / Rotational mechanics / advanced exam prep | taxonomy: Rotational mechanics (or ancestors); exam = JEE Advanced; intent EXAM_PREPARATION | PEN-ED-0075 Physics Wallah - Alakh Pandey [UNVERIFIED, C1]; PEN-ED-0076 PW JEE Wallah [UNVERIFIED, C0]; PEN-ED-0078 Vedantu JEE [UNVERIFIED, C1]; PEN-ED-0079 Physics Galaxy [UNVERIFIED, C1]; PEN-ED-0080 Mohit Tyagi [UNVERIFIED, C0]; PEN-ED-0081 Etoos Education [UNVERIFIED, C0]; PEN-ED-0082 Motion Education [UNVERIFIED, C0] | Only the Physics Wallah record carries topic-title evidence for rotational motion [S81]; syllabus relevance and problem-solving depth require review against the official syllabus. |

### 13.5 Verification pipeline for ingestion
1. For each `UNVERIFIED` record resolve the handle or search by name through the YouTube Data API (e.g. a channel lookup by handle) and store the returned canonical channel ID; compare title and description with `Channel_Name`/`Official_Website`. 2. Flag renamed, inactive or terminated channels as `INACTIVE_OR_UNAVAILABLE`. 3. Pull playlist and video metadata (titles, durations, dates, caption availability) for topic mapping. 4. Queue content review and scoring. 5. Re-verify on a schedule: volatile subjects every 6-12 months, evergreen every 12-24 months. (API specifics are an implementation suggestion; confirm against the current API documentation.)
### 13.6 Governance
Keep `EDITORIAL_REVIEW_REQUIRED` cases (Section 11.3) out of automated recommendations until a policy decision is made. Exclude investment-advice content from finance recommendations unless clearly educational. Preserve provenance (`Official_Source_References`) for every assessment and audit trail for score changes.

## Section 14: Sources and References
All URLs below were returned by web searches on `2026-10-24`; pages were read through search extracts only. Source class: OFFICIAL, OWNER, INSTITUTIONAL, ACADEMIC, ENCYCLOPEDIC, EDITORIAL, COMMUNITY, COMMERCIAL (vendor or coaching-site, potential conflict of interest), ANALYTICS (low reliability for quality).

| Source_ID | URL | Title | Class | Used for |
|---|---|---|---|---|
| S01 | <https://www.3blue1brown.com/about> | 3Blue1Brown - About the channel | OWNER | Creator background; scope of topics |
| S02 | <https://www.3blue1brown.com/faq/> | 3Blue1Brown - FAQ | OWNER | YouTube unavailable in China; Bilibili volunteer mirror; community subtitles |
| S03 | <https://aperiodical.com/2023/09/eipi-to-watch-3blue1brown/> | The Aperiodical - 3Blue1Brown interview | EDITORIAL | Creator-supplied handle youtube.com/@3blue1brown |
| S04 | <https://amser.org/r29029/youtube_3blue1brown> | AMSER / Internet Scout record | INSTITUTIONAL | Library-curated record; channel URL containing channel ID |
| S05 | <https://vidiq.com/youtube-stats/channel/UCYO_jab_esuFRV4b17AJtAw> | VidIQ channel stats page | ANALYTICS | Channel ID in URL; location field |
| S06 | <https://en.wikipedia.org/wiki/3Blue1Brown> | Wikipedia - 3Blue1Brown | ENCYCLOPEDIC | Channel description |
| S07 | <https://libguides.usc.edu.au/data-science/math> | University of the Sunshine Coast library guide - Data science maths | INSTITUTIONAL | Essence of linear algebra playlist (16 videos) |
| S08 | <https://spark.bethel.edu/math-cs-faculty/3> | Bethel University SPARK - Bill Kinney Math YouTube Channel | INSTITUTIONAL | Faculty-authored record of own channel |
| S09 | <https://www.math.clemson.edu/~macaule/youtube.html> | Clemson University faculty page - YouTube channel and materials | INSTITUTIONAL | Course-video descriptions by the instructor |
| S10 | <https://www.uttyler.edu/academics/success-services/files/epic-math-resources.pdf> | UT Tyler Student Success - free math resources | INSTITUTIONAL | Channel URLs for Professor Leonard, blackpenredpen, Organic Chemistry Tutor, 3Blue1Brown, freeCodeCamp |
| S11 | <https://www.lesswrong.com/posts/MZHgJwJD7jR4REFDP/a-layman-s-guide-to-recreational-mathematics-videos> | LessWrong - guide to recreational mathematics videos | COMMUNITY | Dr Trefor Bazett handle; University of Victoria |
| S12 | <https://www.educatorstechnology.com/2022/12/8-great-youtube-channels-for-math.html> | Educators Technology - 8 math channels | EDITORIAL | Numberphile, Mathologer, PatrickJMT |
| S13 | <https://www.educatorstechnology.com/?p=73261> | Educators Technology - math channels list | EDITORIAL | Khan Academy, 3Blue1Brown, PatrickJMT, Professor Leonard |
| S14 | <https://www.educationalappstore.com/blog/best-physics-youtube-channels> | Educational App Store - physics channels | EDITORIAL | Physics outreach channels |
| S15 | <https://phys-office.phys.washington.edu/lectdemo/NavPages/Links.html> | University of Washington Physics Lecture Demonstration Facility - links | INSTITUTIONAL | Curated university physics demo/lecture channels |
| S16 | <https://guides.library.tulsacc.edu/physics/online/resources/videos> | Tulsa Community College library - physics videos | INSTITUTIONAL | Shankar (Yale) lecture series |
| S17 | <https://news.mit.edu/index%2Ephp/2014/lewin-courses-removed-1208> | MIT News - Lewin courses removed (2014-12-08) | OFFICIAL | MIT removal of Walter Lewin online courses |
| S18 | <https://www.physicsforums.com/showthread.php?p=4210069> | Physics Forums - favorite physics videos | COMMUNITY | Legacy NPTEL user URL; OCW/Yale/Stanford mentions |
| S19 | <https://www.educatorstechnology.com/2013/12/top-youtube-channels-for-science-and.html> | Educators Technology - science channels (2013) | EDITORIAL | Periodic Table of Videos; MinutePhysics (dated) |
| S20 | <https://www.cotham.bristol.sch.uk/_site/data/files/curriculum/D061DE1728756BA750E2F722BB516170.pdf> | Cotham School (Bristol) revision guide | INSTITUTIONAL | Direct YouTube handle URLs for UK revision channels |
| S21 | <https://www.midkent.ac.uk/news/blog/our-top-revision-sites> | Mid Kent College - top revision sites | INSTITUTIONAL | Mr Bruff, Hegarty Maths, Free Science Lessons |
| S22 | <https://www.midkent.ac.uk/news/blog/the-10-best-social-media-channels-for-gcse-exam-revision-in-2025> | Mid Kent College - GCSE revision channels 2025 | INSTITUTIONAL | Handles for Mr Bruff, Primrose Kitten |
| S23 | <https://www.thestudentroom.co.uk/revision/alevel-gcse-exams/best-places-online-for-maths-revision> | The Student Room - maths revision | COMMUNITY | Maths Genie, Corbettmaths, The GCSE Maths Tutor |
| S24 | <https://successatschool.org/advice/exams/6-youtube-channels-to-help-you-revise/283> | Success at School - 6 revision channels | EDITORIAL | Hegarty Maths, My GCSE Science, DrPhysicsA |
| S25 | <https://playboard.co/en/search?q=GCSE> | Playboard - GCSE channel directory | ANALYTICS | Channel self-descriptions (Corbettmaths, Physics Online, Primrose Kitten) |
| S26 | <https://www.thestudentroom.co.uk/showthread.php?p=90667702&t=6661712> | The Student Room - GCSE resources thread | COMMUNITY | Hegarty Maths, Cognito, Free Science Lessons |
| S27 | <https://takeielts.britishcouncil.org/take-ielts/prepare/videos> | British Council - TakeIELTS preparation videos | OFFICIAL | States the official TakeIELTS YouTube channel |
| S28 | <https://www.careers360.com/question-i-want-to-study-abroad-after-12th-now-i-am-in-class-11th-so-how-i-improve-my-english-for-toefl-or-ielts-exam> | Careers360 Q&A - IELTS/TOEFL | COMMUNITY | Mentions official IELTS and ETS TOEFL channels; IELTS Liz/Ryan |
| S29 | <https://www.ebsi.co.kr/ebs/pot/potn/retrieveUnivSubMain.ebs> | EBSi - Korean Educational Broadcasting System Suneung platform | OFFICIAL | Official free Suneung lecture platform |
| S30 | <https://www.kyeonggi.com/article/201911141098641> | Kyeonggi Ilbo - EBS Suneung services | EDITORIAL | EBS YouTube channel name EBS고교강의 |
| S31 | <https://dhnews.co.kr/news/view/179522313641048> | DH News - EBS Suneung full service | EDITORIAL | EBS YouTube live and explanation lectures |
| S32 | <https://tilnote.io/pages/6a8dbd7ec6e5775b1196070b> | Tilnote - EBSi free lecture guide | COMMERCIAL | EBSi is free, run by public broadcaster |
| S33 | <https://blog.youtube/intl/pt-br/culture-and-trends/preparacao-enem-youtube/> | YouTube Brasil blog - ENEM preparation | OFFICIAL | Platform-published list of ENEM channels |
| S34 | <https://www.bdm.ufpa.br/bitstreams/622aaf98-89e5-479c-a3ce-76317a3e6d6c/download> | UFPA undergraduate thesis - YouTube for maths content | ACADEMIC | Analyses Me Salva and Ferretto Matematica videos |
| S35 | <https://catracalivre.com.br/educacao/5-melhores-canais-no-youtube-para-aprender-exatas-para-o-enem/> | Catraca Livre - 5 channels for ENEM exact sciences | EDITORIAL | Ferretto, Prof Ivys, Jubilut |
| S36 | <https://querobolsa.com.br/revista/youtube-estudar-enem> | Quero Bolsa - 17 channels for ENEM | COMMERCIAL | Descomplica, Me Salva, Aulalivre |
| S37 | <https://querobolsa.com.br/revista/twitter-tiktok-youtube-conheca-perfis-dicas-estudo-seguir> | Quero Bolsa - study profiles | COMMERCIAL | Se Liga Nessa Historia |
| S38 | <https://www.superprof.com.br/blog/estudando-para-enem-sites/> | Superprof - ENEM study sites | COMMERCIAL | Descomplica, Me Salva, Aulalivre |
| S39 | <https://oimparcial.com.br/cidades/2015/10/confira-5-canais-de-video-aulas-para-estudar-para-o-enem/> | O Imparcial - ENEM channels (2015) | EDITORIAL | Jubilut, Me Salva, Descomplica (dated) |
| S40 | <https://en.wikipedia.org/wiki/Physics_Wallah> | Wikipedia - Physics Wallah | ENCYCLOPEDIC | Origin as YouTube channel (2016); company status |
| S41 | <https://www.careers360.com/question-iit-jee/advanced-k-top-teacher-you-tub-lecter> | Careers360 Q&A - JEE channels | COMMUNITY | Unacademy, PW, Vedantu mentions |
| S42 | <https://www.careers360.com/question-best-youtube-channels-for-iit-jee-full-detailed-lectures/amp> | Careers360 Q&A - JEE full lectures | COMMUNITY | Unacademy JEE, Etoos, Physics Galaxy, Motion |
| S43 | <https://www.sahildubey.com/2026/06/best-youtube-channel-for-jee-mechanics.html> | SEO blog - JEE mechanics channels (2026-06) | COMMERCIAL | Low-reliability; topic-level channel suggestions |
| S44 | <https://cracku.in/which-iit-will-conduct-jee-advanced-2027> | Cracku - JEE Advanced 2027 organising IIT | COMMERCIAL | Coaching-site report: IIT Delhi expected; official site jeeadv.ac.in |
| S45 | <https://cracku.in/jee-exam-details-2027> | Cracku - JEE 2027 exam details | COMMERCIAL | Two-stage JEE structure |
| S46 | <https://engineering.careers360.com/articles/jee-advanced-2027> | Careers360 - JEE Advanced 2027 | COMMERCIAL | Organising institute and syllabus status |
| S47 | <https://engineering.careers360.com/articles/best-youtube-channel-for-gate-preparation> | Careers360 - YouTube channels for GATE | COMMERCIAL | NPTEL, GATE Academy; GATE 2026 organiser |
| S48 | <https://www.newsbytesapp.com/news/career/here-are-top-youtube-channels-for-gate-aspirants/story> | NewsBytes - GATE channels | EDITORIAL | GATE Academy, GATEMATIC, Ravula, NPTEL |
| S49 | <https://www.careers360.com/question-best-youtube-channels-for-upsc-cse-exam> | Careers360 Q&A - UPSC channels | COMMUNITY | StudyIQ, Drishti IAS, Mrunal |
| S50 | <https://www.careers360.com/question-youtube-channels-with-full-detail-videos-subject-wise-lectures-for-upsc-preparation-in-english-only> | Careers360 Q&A - UPSC English channels | COMMUNITY | PMF IAS, Mrunal, Only IAS, Sleepy Classes |
| S51 | <https://www.careers360.com/keywords/youtube-channel-general?page=5> | Careers360 Q&A aggregate | COMMUNITY | Neso Academy for GATE CS |
| S52 | <https://www.placementpreparation.io/blog/best-youtube-channels-to-learn-data-structures-and-algorithms/> | PlacementPreparation - DSA channels | COMMERCIAL | Abdul Bari, freeCodeCamp, Mosh |
| S53 | <https://dev.to/naime_molla/top-10-free-resources-to-learn-data-structures-and-algorithms-in-2024-4i4j> | DEV - DSA resources | COMMUNITY | NeetCode, takeUforward, Abdul Bari |
| S54 | <https://designbeep.com/2025/04/03/35-best-youtube-channels-to-learn-programming-2025-a-comprehensive-guide/> | Designbeep - 35 programming channels | EDITORIAL | freeCodeCamp, Mosh, Abdul Bari, CS Dojo, mycodeschool |
| S55 | <https://bestcolleges.com/bootcamps/guides/best-youtube-channels-learn-coding> | BestColleges - coding channels | EDITORIAL | freeCodeCamp ordered course structure |
| S56 | <https://www.placementpreparation.io/blog/?p=16509> | PlacementPreparation - software engineering channels | COMMERCIAL | CS50, Fireship, Traversy Media |
| S57 | <https://dev.to/cwrcode/best-youtube-channel-for-learning-c-language-a3m> | DEV - C language channels | COMMUNITY | CS50, Abdul Bari, Jenny's lectures |
| S58 | <https://learningmole.com/youtube-educational-channels/> | LearningMole - educational channels | EDITORIAL | Khan Academy, freeCodeCamp, CrashCourse descriptions |
| S59 | <https://learnwithpath.com/blog/best-youtube-channels-for-machine-learning-2026> | LearnPath - ML channels 2026 | COMMERCIAL | Karpathy, StatQuest, DeepLearning.AI |
| S60 | <https://learnwithpath.com/blog/learn-python-for-ai-free-youtube-channels-2026> | LearnPath - Python for AI channels | COMMERCIAL | Karpathy Zero to Hero; Krish Naik |
| S61 | <https://kdnuggets.com/10-youtube-channels-keeping-you-ahead-in-ai> | KDnuggets - AI channels | EDITORIAL | Yannic Kilcher, Karpathy, StatQuest, DeepLearning.AI |
| S62 | <https://growtechie.substack.com/p/top-10-youtube-channels-to-learn> | GrowTechie - AI/ML channels | COMMUNITY | fast.ai, Raschka, Stanford Online |
| S63 | <https://pub.huizhou92.com/10-youtube-channels-thatll-actually-teach-you-ai-from-math-to-mindset-af9596f2e01d> | Medium - AI channels from math to mindset | COMMUNITY | Stanford Online CS229/CS231n |
| S64 | <https://learnwithpath.com/blog/best-youtube-channels-for-cloud-engineering-aws-azure-gcp-2026> | LearnPath - cloud channels 2026 | COMMERCIAL | Maarek, Digital Cloud Training, ExamPro, John Savill |
| S65 | <https://dev.to/exampro/free-youtube-channels-i-recommend-to-help-you-pass-aws-azure-certification-3463?comments_sort=oldest> | DEV (ExamPro) - free cloud cert channels | OWNER | First-party practitioner article by Andrew Brown |
| S66 | <https://flashgenius.net/blog-article/ultimate-guide-to-free-youtube-channels-for-tech-certs> | FlashGenius - tech cert channels | COMMERCIAL | Low-reliability; CompTIA/Cisco channels |
| S67 | <https://medschool.co/optimise/resources/medical-sciences-videos-to-accelerate-your-learning> | MedSchool.co - medical science videos | COMMERCIAL | Armando Hasudungan, Ninja Nerd, Osmosis |
| S68 | <https://forums.studentdoctor.net/posts/23752245> | Student Doctor Network thread | COMMUNITY | Osmosis, Ninja Nerd, Armando |
| S69 | <https://revistas.upch.edu.pe/index.php/RMH/article/download/5308/5596/15647> | Rev Med Hered 2024;35(1):65-67 - YouTube channels in medical learning | ACADEMIC | Peer-reviewed letter; Osmosis URL; usage survey (not quality evidence) |
| S70 | <https://blog.blueprintprep.com/medical/how-to-supplement-your-step-1-studying-with-youtube-videos/> | Blueprint Prep - Step 1 YouTube supplements | COMMERCIAL | DirtyUSMLE, Armando |
| S71 | <https://medlifemastery.com/?p=1329> | MedLifeMastery - pre-med channels | COMMERCIAL | Najeeb, MedCram, Harvard Medical School |
| S72 | <https://inomics.com/advice/top-youtube-channels-to-learn-econometrics-and-economics-49279> | INOMICS - economics channels | EDITORIAL | MRU, Ben Lambert, Economics Explained |
| S73 | <https://en.wikipedia.org/wiki/Easy_Languages_(YouTube)> | Wikipedia - Easy Languages | ENCYCLOPEDIC | Network of 40+ language channels |
| S74 | <https://blog.lingodeer.com/learn-korean-youtube-channels.md> | LingoDeer - Korean channels | COMMERCIAL | Vendor blog; Learn Korean in Korean handle; TTMIK |
| S75 | <https://www.pimsleur.com/blog/best-korean-youtube/> | Pimsleur - Korean channels | COMMERCIAL | Vendor blog; TTMIK, Seemile, Korean Unnie |
| S76 | <https://migaku.com/blog/language-fun/best-language-learning-youtube-channels> | Migaku - language channels | COMMERCIAL | Vendor blog; Easy Languages, Alexa, InnerFrench, Dreaming Spanish |
| S77 | <https://www.languagebird.com/?p=10370> | LanguageBird - language channels | COMMERCIAL | Vendor blog; Yoyo Chinese, Butterfly Spanish, Vincent, German with Jenny |
| S78 | <https://www.uopeople.edu/blog/best-educational-youtube-channels-for-college-students> | UoPeople - educational channels | EDITORIAL | CrashCourse subject range |
| S79 | <https://outlierkit.com/channel/jonahemmanuelofficial> | OutlierKit channel analysis | ANALYTICS | Low-reliability inferred audience; West African exam focus |
| S80 | <https://www.careers360.com/question-suggest-me-some-best-youtube-channels-of-all-subjects-for-iit-jee> | Careers360 Q&A - all-subject JEE channels | COMMUNITY | Mohit Tyagi, Physics Galaxy mentions |
| S81 | <https://www.scribd.com/document/427269636/class-11-imp-notes> | Scribd class 11 notes (PW video listing) | COMMUNITY | Video titles of a Rotational Motion series by Physics Wallah |
| S82 | <https://www.placementpreparation.io/blog/best-youtube-channels-to-learn-engineering-mathematics/> | PlacementPreparation - engineering maths channels | COMMERCIAL | Alex Maths Engineering; patrickJMT |
| S83 | <https://mathsgenie.co.uk/blog/maths-genie-vs-cognito-biology-revision> | Maths Genie blog (competitor comparison) | COMMERCIAL | First-party claims; treat cautiously |
| S84 | <https://sis.aceec.ac.in/^28876750/dcharacterizeo/xinfluencew/ucommissionc/chapter+8+rotational+motion+study+guide+answers.pdf> | Scraped page reproducing YouTube video descriptions | ANALYTICS | Low reliability: reproduces Physics Wallah description text incl. @PhysicsWallah URL |

*Not retrieved this session (needed for edition 0.2): official pages of exam bodies and boards (NTA, jeeadv.ac.in, College Board, IBO, Cambridge, CBSE, KICE, INEP, SEAB, etc.), YouTube channel pages, YouTube Data API results.*
