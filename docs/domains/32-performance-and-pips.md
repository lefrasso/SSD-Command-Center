# Domain: Performance & PIPs

> Confidential, role-gated composite performance view and structured improvement plans (PIPs). **AI is
> an advisory input to a manager's judgement — never an automated decision about a person.**

## 1. At a glance

| Field | Value |
|---|---|
| Domain ID | `performance` |
| Module route | `#/performance` (requires `view:pip`) |
| Prototype status | Implemented |
| Primary personas | POD Lead (+ HR-equivalent in production) |
| Source-of-truth systems (target) | Confidential/HR, SSD IQ (delivery evidence) |
| Upstream domains (depends on) | Quality (30), Escalations (31), Engagements (11), Identity/RBAC (01) |
| Downstream domains (consumed by) | HR processes (out of app) |
| Prototype source | `scripts/views/performance.js`, `scripts/ai.js` (`performanceSummary`) |

## 2. Purpose & problem statement

- **Why this domain exists** — Managing Partner CSA performance requires a fair, evidence-based,
  **confidential** view and, where needed, a structured improvement plan. This domain composes delivery
  evidence into a scorecard and manages PIPs — with strict guardrails.
- **Who cares** — POD Leads and HR-equivalent roles; the individual CSA (fairness).
- **Definition of done** — A restricted, audited performance view backed by real evidence, with PIP
  authoring/tracking and AI that is explicitly advisory.

## 3. Personas & permissions

| Persona | Access |
|---|---|
| POD Lead | Full (holds `view:pip`) |
| HR-equivalent | Full (production) |
| All others | **No access** (module + `pips` entity gated by `view:pip`) |

## 4. Key concepts & glossary

| Term | Meaning |
|---|---|
| Composite scorecard | Delivery, CPE, quality, escalations, utilization for a CSA. |
| PIP | Performance Improvement Plan: objectives, check-ins, outcome. |
| Coaching log | Dated notes of coaching conversations. |
| Advisory AI | AI summary that informs, never decides. |

## 5. Data model

- **PIP** entity (SoT = Confidential/HR): `csaId`, `status` (active/draft/closed), `opened`,
  `objectives[]`, `checkIns[{date,note}]`, `outcome` (met/not-met/in-progress).
- **Composite scorecard** derived from CSA + engagements + escalations (not persisted).

## 6. Features (current prototype)

1. **Confidential banner** — restricted to POD Lead + HR-equivalent; AI outputs advisory.
2. **CSA selector** (active/offboarding CSAs).
3. **Composite scorecard** — Delivery (completed/assigned), CPE, Quality, Escalations (linked),
   Utilization.
4. **Improvement plan (PIP)** — status, opened, outcome, objectives checklist, check-ins timeline; or
   "no active PIP" with a Draft PIP action.
5. **AI performance summary** — evidence-linked, advisory; lists evidence sources.
6. **Coaching log** — dated notes (from PIP check-ins or defaults).

## 7. User stories

### Epic: Fair, evidence-based view
- As **a POD Lead**, I want a composite scorecard from delivery evidence, so that performance
  conversations are grounded in facts.
- As **a POD Lead**, I want an advisory AI summary with its evidence, so that I prepare quickly while
  keeping judgement human.

### Epic: PIP management
- As **a POD Lead**, I want to draft and track a PIP (objectives, check-ins, outcome), so that
  improvement is structured and documented.

### Epic: Confidentiality
- As **a security/HR owner**, I want this area restricted and audited, so that personnel data is
  protected.

## 8. Business rules & logic

- **Access gate:** module + `pips` records require `view:pip`; unreachable otherwise (incl. deep link
  in production).
- **Guardrail:** AI summaries are advisory inputs; no automated personnel decisions.
- **Scorecard inputs:** completed/assigned engagements, CPE, quality, linked escalation count,
  utilization.
- **PIP outcome:** met / not-met (closed) or in-progress.

## 9. AI capabilities

| AI feature | Input | Output | Prototype | Production seam |
|---|---|---|---|---|
| Performance summary (advisory) | CSA + delivery data | evidence-linked narrative | `ai.js → performanceSummary` | Grounded model; strict guardrails; human-in-the-loop |

## 10. Screens & UI

- Confidential banner, CSA selector, composite scorecard grid, PIP card (objectives/check-ins), AI
  summary card + coaching log.

## 11. Integrations & source systems (production)

| System | Role | Direction | Notes |
|---|---|---|---|
| HR systems | PIP records, outcomes | in/out | SoT; restricted. |
| SSD IQ | Delivery/CPE/quality/escalation evidence | inbound | Scorecard. |
| Audit/logging | Access + change logs | outbound | Compliance. |

## 12. KPIs & metrics

Aggregate, privacy-safe metrics only:

| Metric | Definition | Target |
|---|---|---|
| Active PIPs | Count | Context-dependent |
| PIP success rate | Closed "met" / closed | Increase |
| Coaching cadence | Check-ins per active PIP | Regular |

## 13. Non-functional requirements

- **Security/Privacy:** strict RBAC; encryption; **access logging**; least exposure of PII.
- **Auditability:** every view and change logged.
- **Ethics:** advisory-only AI; explainable evidence; human decision recorded.

## 14. Prototype → production gaps

- [ ] **HR integration** for real PIP records + outcomes.
- [ ] **HR-equivalent** access (not only POD Lead) with access logging.
- [ ] **Draft PIP** authoring workflow (objectives, milestones, approvals).
- [ ] **Audit** every access/change; retention policy.
- [ ] Guardrail review of AI summaries (bias, fairness, explainability).

## 15. Backlog (epics → stories)

| ID | Epic | Story | Priority | Notes |
|---|---|---|---|---|
| PERF-1 | HR | Integrate PIP records/outcomes | Must | SoT |
| PERF-2 | Access | HR-equivalent role + access logging | Must | Compliance |
| PERF-3 | PIP | Authoring workflow + approvals | Should | Structure |
| PERF-4 | Audit | Full access/change audit + retention | Must | Governance |
| PERF-5 | Ethics | Fairness/explainability review of AI | Must | Responsible AI |

## 16. Open questions & assumptions

- **Q:** Which HR system holds PIPs? **A (assumption):** the org's HR platform; app is a restricted
  front-end.
- **Q:** Who besides POD Lead has access? **A (assumption):** HR-equivalent only.

## 17. References

- Prototype source: `scripts/views/performance.js`, `scripts/ai.js` (`performanceSummary`),
  `scripts/roles.js` (`view:pip`).
- Related: [Identity, Personas & RBAC](01-identity-personas-rbac.md), [Quality](30-quality-and-cpe.md),
  [Escalations](31-escalations-and-actions.md).
