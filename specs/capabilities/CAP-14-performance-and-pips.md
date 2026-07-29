# Capability: Performance & PIPs `CAP-14`

> Confidential, role-gated composite performance view and structured improvement plans. **AI is an
> advisory input to a manager's judgement — never an automated decision about a person.**

## Summary

| Field | Value |
|---|---|
| Capability ID | `CAP-14` |
| Area | Quality & Risk |
| Primary personas | POD Lead (+ HR-equivalent) — requires `view:pip` |
| Priority | Should |
| Target phase | P2 |
| Prototype reference | `scripts/views/performance.js`, `scripts/ai.js` (`performanceSummary`) |
| Depends on | [CAP-01 Identity](CAP-01-identity-and-access.md), [04 Security](../04-security-privacy-compliance.md), [CAP-12 Quality](CAP-12-quality-and-cpe.md) |

## 1. Problem & outcome

- **Problem:** Performance management needs a fair, evidence-based, **confidential** view and structured
  improvement plans.
- **Outcome:** A restricted, audited performance view backed by real evidence, with PIP authoring/
  tracking and explicitly advisory AI.
- **Value:** Fair, faster, well-documented performance conversations — with personnel data protected.

## 2. Functional requirements

- **FR-PERF-1** — Restrict the capability and `pips` data to `view:pip` (POD Lead + HR-equivalent);
  enforce at the API and on deep links.
- **FR-PERF-2** — Show a **composite scorecard**: delivery (completed/assigned), CPE, quality,
  escalations, utilization.
- **FR-PERF-3** — Manage a **PIP**: status, opened, objectives, check-ins, outcome; author new PIPs
  (production).
- **FR-PERF-4** — Provide an **AI performance summary** that is evidence-linked and **advisory**, listing
  its sources.
- **FR-PERF-5** — Maintain a **coaching log**.
- **FR-PERF-6** — Integrate HR for real PIP records/outcomes; **audit** every access and change.

## 3. Business rules

- **BR-PERF-1** — Access gate: module + `pips` require `view:pip`; unreachable otherwise (incl. deep link).
- **BR-PERF-2** — **Guardrail:** AI is advisory; no automated personnel decision.
- **BR-PERF-3** — Scorecard inputs: completed/assigned engagements, CPE, quality, linked escalations,
  utilization.
- **BR-PERF-4** — PIP outcome: met / not-met (closed) or in-progress.

## 4. User stories & acceptance criteria

### Story: Evidence-based, confidential
- **As a** POD Lead **I want** a composite scorecard + advisory AI summary **so that** I prepare
  performance conversations grounded in facts, while judgement stays human.
- **AC:**
  - Given I hold `view:pip`, When I open a CSA, Then I see their scorecard, PIP and an advisory,
    evidence-linked AI summary.
  - Given a role without `view:pip`, When they request this capability or a `pips` record, Then access is
    denied and logged.

## 5. Data & system of record

| Entity | Fields | R/W | SoT |
|---|---|---|---|
| PIP | csaId, status, opened, objectives, checkIns, outcome | R/W | Confidential/HR |
| Composite scorecard | derived | R | SSD IQ (delivery evidence) |

## 6. AI touchpoints

| AI feature | Input | Output | Guardrail | Ref |
|---|---|---|---|---|
| Performance summary | CSA + delivery data | evidence-linked narrative | advisory/human-decides/never adverse-auto | [05](../05-ai-and-copilot-platform.md) |

## 7. Integrations

HR (PIP records/outcomes), SSD IQ (evidence), audit/logging. See [03](../03-integrations.md).

## 8. NFR & security notes

Strict RBAC + encryption + **access logging** (`NFR-SEC-3/4`); explainable, fairness-reviewed AI;
retention policy for personnel data.

## 9. KPIs (aggregate, privacy-safe)

Active PIPs, PIP success rate (closed "met"/closed), coaching cadence.

## 10. Open questions & assumptions

- **Q:** Which HR system holds PIPs? **A (assumption):** the org HR platform; Compass is a restricted
  front-end.
- **Q:** Who beyond POD Lead has access? **A (assumption):** HR-equivalent only.
