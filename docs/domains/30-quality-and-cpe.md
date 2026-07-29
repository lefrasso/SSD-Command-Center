# Domain: Quality & CPE

> Experience management, quality checks and mock-delivery QC — all measured against the **Proactive
> Delivery CPE Recommended Practices**.

## 1. At a glance

| Field | Value |
|---|---|
| Domain ID | `quality` |
| Module route | `#/quality` |
| Prototype status | Implemented |
| Primary personas | POD Lead, Partner CSA, SDM, business-lt |
| Source-of-truth systems (target) | CPE/Forms, SSD IQ |
| Upstream domains (depends on) | Engagements (11), Lifecycle (22), SSD IQ (02), AI (03) |
| Downstream domains (consumed by) | Performance (32), Reporting/MBR (41), Enablement/S500 (24) |
| Prototype source | `scripts/views/quality.js`, `scripts/ai.js` (`scoreQuality`) |

## 2. Purpose & problem statement

- **Why this domain exists** — Consistent, high-quality delivery is the product. This domain measures
  experience (**CPE**), runs structured **quality checks** against recommended practices, and gates
  ramping CSAs with **mock deliveries** — turning quality from opinion into evidence.
- **Who cares** — POD Leads (coaching), CSAs (their scores), SDMs/leaders (quality trend).
- **Definition of done** — Live CPE analytics, a working QC form + reporting, and a mock-delivery QC
  process integrated with the CSA lifecycle.

## 3. Personas & permissions

| Persona | Can do |
|---|---|
| POD Lead | Run QC, review mock deliveries, coach on CPE |
| Partner CSA | See own CPE/quality and practice checks |
| SDM / business-lt | View quality trends and reporting |

## 4. Key concepts & glossary

| Term | Meaning |
|---|---|
| CPE | Customer & Partner Experience score (target ≥ 4.4 / 5). |
| Recommended Practices | The 6-point proactive delivery checklist. |
| Quality Check (QC) | An 8-criterion structured review producing a 0–5 score (≥ 4 = pass). |
| Mock delivery | A rehearsed delivery under QC review before first live engagement. |
| Verbatim | A free-text CPE comment with sentiment. |

## 5. Data model

- **CPE Feedback** entity (SoT = CPE/Forms): `engagementId`, `score`, `track`, `verbatim`, `date`,
  `sentiment`.
- **QC submissions** (prototype: in-session) — `{ customer, track, date, score, pass }`.
- Reference: `PRACTICES` (6), `QC_CRITERIA` (8), `MOCK_QC_GUIDE` (6), ratings Met/Partial/Not met.

### Recommended Practices (6)
Day 0 outreach completed · Day 1 sync scheduled · Stakeholders engaged (Day 2+) · Milestone plan
baselined · Artifacts captured · CPE survey requested.

### Quality Check criteria (8)
Scope & success criteria documented · Day 0–3 outreach on time · Stakeholders identified & engaged ·
Milestone plan baselined & tracked · Technical guidance accurate & actionable · Artifacts captured &
shared · Risks & blockers escalated appropriately · CPE survey requested at close.

## 6. Features (current prototype)

Tabbed module:

1. **CPE & Trends** — KPIs (rolling CPE vs target 4.4, responses, positive share), CPE trend line, CPE
   by track, per-engagement **Recommended Practices check** with **AI auto-score**, and recent CPE
   verbatims with sentiment.
2. **Quality Checks** — a QC **form** (8 criteria, AI-pre-filled ratings), live score calc, **submit**;
   reporting KPIs (avg QC score, pass rate ≥ 4/5, QCs on record), avg QC by track, recent QC list.
3. **Mock Deliveries** — mock-delivery records for ramping CSAs (sourcing/selection/onboarding), pass
   rate, and a review drawer scored against the **Mock Delivery QC Guide** with an AI reviewer note.

## 7. User stories

### Epic: Experience (CPE)
- As **a POD Lead**, I want CPE trends and by-track breakdowns, so that I see where experience dips.
- As **a CSA**, I want a recommended-practices check per engagement with an AI score, so that I know
  how to improve.

### Epic: Quality checks
- As **a POD Lead**, I want a structured QC form with AI pre-fill, so that reviews are fast and
  consistent.
- As **a leader**, I want QC pass rate by track, so that I monitor delivery quality.

### Epic: Mock deliveries
- As **a POD Lead**, I want to review mock deliveries against a QC guide before first live delivery, so
  that CSAs are ready.
- As **a CSA**, I want mock feedback, so that I improve before customer impact.

## 8. Business rules & logic

- **QC score** = Σ(criterion ratings, 0–2) / (8×2) × 5, 1 dp; **pass ≥ 4/5**.
- **AI auto-score** (`scoreQuality`): base 2.6 + outreach×0.35 + milestone-completion×1.2, capped at 5;
  advises improvement if < 4.
- **QC pre-fill:** ratings inferred from outreach/milestones/status.
- **Mock pass gate:** intended to precede first supervised delivery (see [Lifecycle](22-partner-csa-lifecycle.md)).
- **CPE target:** ≥ 4.4; sentiment from score (≥4.3 positive, ≥3.6 neutral, else negative).

## 9. AI capabilities

| AI feature | Input | Output | Prototype | Production seam |
|---|---|---|---|---|
| CPE/QC auto-score | engagement | 0–5 score + guidance | `ai.js → scoreQuality` | Grounded model + practice rubric |
| QC pre-fill | engagement signals | suggested criterion ratings | inline in `quality.js` | Model + evidence |
| Mock reviewer note | mock record | qualitative note | inline in `quality.js` | Model |

## 10. Screens & UI

- Three tabs; CPE charts + practice checklist + verbatims; QC form with rating selects + score +
  submit; mock table + review drawer.

## 11. Integrations & source systems (production)

| System | Role | Direction | Notes |
|---|---|---|---|
| CPE/Forms | Survey scores + verbatims | inbound | SoT for CPE. |
| SSD IQ | Engagements, milestones, outreach | inbound | Evidence for QC. |
| Doc/artifact store | Evidence links | inbound | "Artifacts captured". |

## 12. KPIs & metrics

| Metric | Definition | Target |
|---|---|---|
| Rolling CPE | Mean CPE score | ≥ 4.4 |
| Positive share | % positive CPE | High |
| QC pass rate | QCs ≥ 4/5 | ≥ 80% |
| Mock pass rate | Mocks passed | ≥ 70% |

## 13. Non-functional requirements

- **Integrity:** QC records immutable + attributed; evidence-linked.
- **Privacy:** CPE verbatims may contain customer info — handle appropriately.
- **Consistency:** shared rubric across reviewers.

## 14. Prototype → production gaps

- [ ] Persist **QC submissions** (with reviewer, evidence links, history) vs in-session.
- [ ] Real **CPE ingestion** from the survey platform.
- [ ] **Mock delivery** scheduling + records tied to lifecycle sign-off.
- [ ] Evidence attachment for QC criteria (artifacts).
- [ ] Feed QC/CPE into **Performance** and **S500 eligibility** consistently.

## 15. Backlog (epics → stories)

| ID | Epic | Story | Priority | Notes |
|---|---|---|---|---|
| QA-1 | QC | Persist QC with reviewer/evidence/history | Must | System of record |
| QA-2 | CPE | Ingest CPE surveys + verbatims | Must | SoT |
| QA-3 | Mock | Mock scheduling + lifecycle gate | Should | Ramp quality |
| QA-4 | Evidence | Attach artifacts to QC criteria | Should | Auditable |
| QA-5 | Feed | CPE/QC → Performance + S500 | Should | Consistency |

## 16. Open questions & assumptions

- **Q:** Who can submit a QC — POD Lead only or peers? **A (assumption):** POD Lead (+ SDM review).
- **Q:** Is the recommended-practices rubric fixed? **A:** treat as configurable content.

## 17. References

- Prototype source: `scripts/views/quality.js`, `scripts/ai.js` (`scoreQuality`).
- Related: [Engagements](11-engagements-and-dispatch.md), [Performance](32-performance-and-pips.md),
  [Enablement/S500](24-enablement.md), [Reporting/MBR](41-reporting-and-analytics.md).
