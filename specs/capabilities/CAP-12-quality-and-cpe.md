# Capability: Quality & CPE `CAP-12`

> Experience management, quality checks and mock-delivery QC — measured against the Proactive Delivery
> **CPE Recommended Practices**.

## Summary

| Field | Value |
|---|---|
| Capability ID | `CAP-12` |
| Area | Quality & Risk |
| Primary personas | POD Lead, CSA Manager, Partner CSA, CSA, SDM, leadership |
| Priority | Must |
| Target phase | P1 |
| Prototype reference | `scripts/views/quality.js`, `scripts/ai.js` (`scoreQuality`) |
| Depends on | [CAP-04 Dispatch](CAP-04-engagements-and-dispatch.md), [CAP-09 Lifecycle](CAP-09-partner-csa-lifecycle.md) |

## 1. Problem & outcome

- **Problem:** Quality is judged inconsistently; CPE isn't operationalised; ramping CSAs deliver live
  without a rehearsal gate.
- **Outcome:** Live CPE analytics, a structured QC form + reporting, and a mock-delivery QC process tied
  to the lifecycle.
- **Value:** Consistent, evidence-based quality; better experience; safer ramp.

## 2. Functional requirements

- **FR-QUALITY-1** — **CPE analytics:** rolling CPE (target ≥4.4), responses, positive share, trend and
  by-track breakdown; recent verbatims with sentiment.
- **FR-QUALITY-2** — **Recommended Practices check** per engagement with an AI **auto-score**.
- **FR-QUALITY-3** — **Quality Check form** (8 criteria, AI-pre-filled ratings) with live score and submit.
- **FR-QUALITY-4** — **QC reporting:** avg QC score, pass rate (≥4/5), by-track; recent QCs; persist
  submissions with reviewer/evidence (production).
- **FR-QUALITY-5** — **Mock deliveries:** records for ramping CSAs scored vs the Mock Delivery QC Guide;
  pass gates first live delivery.

## 3. Business rules

- **BR-QUALITY-1** — QC score = Σ(criterion ratings 0–2) / (8×2) × 5, 1 dp; **pass ≥ 4/5**.
- **BR-QUALITY-2** — AI auto-score (prototype): `2.6 + outreach×0.35 + milestone-completion×1.2`, cap 5.
- **BR-QUALITY-3** — CPE target ≥ 4.4; sentiment from score (≥4.3 positive, ≥3.6 neutral, else negative).
- **BR-QUALITY-4** — Recommended Practices (6): Day 0 outreach; Day 1 sync; stakeholders engaged;
  milestone plan baselined; artifacts captured; CPE survey requested.
- **BR-QUALITY-5** — Mock pass precedes first supervised delivery ([CAP-09](CAP-09-partner-csa-lifecycle.md)).

## 4. User stories & acceptance criteria

### Story: Structured QC
- **As a** POD Lead **I want** a QC form with AI pre-fill **so that** reviews are fast and consistent.
- **AC:** Given an engagement, When I open the QC form, Then ratings are pre-filled from its signals;
  When I submit, Then a score (pass if ≥4) is recorded with reviewer + date.

### Story: Ramp gate
- **As a** POD Lead **I want** to review mock deliveries before first live delivery **so that** CSAs are
  ready.
- **AC:** Given an onboarding CSA, When their mock is scored, Then a pass gates first supervised delivery.

## 5. Data & system of record

| Entity | Fields | R/W | SoT |
|---|---|---|---|
| CPE Feedback | engagementId, score, track, verbatim, date, sentiment | R | CPE/Forms |
| QC submission | customer, track, date, score, pass, reviewer, evidence | R/W | SSD IQ (new) |

## 6. AI touchpoints

| AI feature | Input | Output | Guardrail | Ref |
|---|---|---|---|---|
| CPE/QC auto-score | engagement | 0–5 + guidance | advisory | [05](../05-ai-and-copilot-platform.md) |
| QC pre-fill | signals | suggested ratings | advisory | [05](../05-ai-and-copilot-platform.md) |

## 7. Integrations

CPE/Forms (surveys + verbatims), SSD IQ (engagement evidence), doc/artifact store (evidence). See [03](../03-integrations.md).

## 8. NFR & security notes

QC records immutable + attributed + evidence-linked; verbatims may contain customer info — govern access.

## 9. KPIs

Rolling CPE (≥4.4), positive share, QC pass rate (≥80%), mock pass rate (≥70%).

## 10. Open questions & assumptions

- **Q:** Who submits a QC? **A (assumption):** POD Lead (+ SDM review).
- **Q:** Is the rubric fixed? **A:** configurable content.
