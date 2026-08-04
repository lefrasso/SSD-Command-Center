# Domain: Enablement

> Accreditations, S500 eligibility, SDM onboarding, User Voice and shadowing management — the skilling
> and readiness backbone for the delivery workforce.

> **Source alignment — POD Lead Report.** Accreditations add **Primary Skill**, **Rating (0–5)**,
> **Professional Service Name** and **Is Active**, plus an **accreditations distribution** by Program.
> **S500 readiness** (marked ready in SharePoint, **reconciled** via `_S500reconciled`) is distinct from
> S500 **eligibility**; an S500 customer must be served by an S500-ready CSA. Canonical spec:
> [CAP-11](../../specs/capabilities/CAP-11-enablement.md).

## 1. At a glance

| Field | Value |
|---|---|
| Domain ID | `enablement` |
| Module route | `#/enablement` |
| Prototype status | Implemented |
| Primary personas | All |
| Source-of-truth systems (target) | Skilling/accreditation, HR, product backlog (User Voice) |
| Upstream domains (depends on) | PODs (20), Lifecycle (22), SSD IQ (02) |
| Downstream domains (consumed by) | Capacity (21, coverage by skill), Dispatch (11, best-fit) |
| Prototype source | `scripts/views/enablement.js` |

## 2. Purpose & problem statement

- **Why this domain exists** — Delivery quality depends on **skilled, accredited** people, clear
  **eligibility** for premium programs (S500), well-onboarded **SDMs**, structured **shadowing**, and a
  channel for the field to shape the product (**User Voice**). This domain consolidates those enablement
  concerns.
- **Who cares** — POD Leads, DPSMs (skills/coverage), SDM managers, product owners, all CSAs.
- **Definition of done** — Live accreditation records, rule-based S500 eligibility, SDM onboarding
  tracking, shadowing assignments, and a working User Voice loop.

## 3. Personas & permissions

All roles can view. Editing (e.g. accreditation status, S500 decisions) would be restricted to
enablement/DPSM/POD-Lead roles in production.

## 4. Key concepts & glossary

| Term | Meaning |
|---|---|
| Accreditation | A skill/certification a CSA holds (modelled as CSA `skills`). |
| S500 | Eligibility tier: CPE ≥ 4.4, quality ≥ 4.4, tenure ≥ 6 months. |
| SDM onboarding | 6-step readiness path for Service Delivery Managers. |
| Shadowing | Mentor/mentee pairing for ramping CSAs. |
| User Voice | Idea intake with voting and status. |

## 5. Data model

- **Accreditations:** derived from CSA `skills[]` (SoT target = skilling/accreditation system).
- **S500 eligibility:** computed from CSA `cpe`, `quality`, `tenureMonths`.
- **SDM onboarding:** SDM list + `SDM_ONBOARD` 6-step checklist (deterministic progress).
- **User Voice:** in-session list `{ title, votes, status }` (SoT target = product backlog).
- **Shadowing:** mentee (ramping CSAs) ↔ mentor (active CSA, same POD/track) pairs with status.

## 6. Features (current prototype)

Tabbed module (`renderEnablement` → dispatch by tab):

1. **Accreditations** — KPIs (accredited CSAs, distinct accreditations, avg per CSA), top
   accreditations, and a CSA-by-accreditation table.
2. **S500 Eligibility** — KPIs (eligible, not-yet, eligibility rate), rule note, and a table with
   CPE/quality/tenure and eligibility reason.
3. **SDM Onboarding** — SDM progress table + the onboarding checklist.
4. **User Voice** — submit an idea, vote, and see status (Planned/Shipped/Under review/New).
5. **Shadowing** — KPIs (pairs, in progress, completed) + mentor/mentee assignments table.

## 7. User stories

### Epic: Accreditations
- As **a POD Lead/DPSM**, I want to see accreditations across CSAs, so that I know our skill coverage.
- As **a CSA**, I want my accreditations recorded, so that dispatch matches me to the right work.

### Epic: S500 eligibility
- As **an enablement owner**, I want S500 eligibility computed from CPE/quality/tenure, so that
  eligibility is objective and current.
- As **a CSA/manager**, I want the reason when not eligible, so that I know what to improve.

### Epic: SDM onboarding
- As **an SDM manager**, I want a structured SDM onboarding path and progress, so that new SDMs ramp
  consistently.

### Epic: User Voice
- As **any user**, I want to submit and vote on ideas, so that the field shapes the product.

### Epic: Shadowing
- As **a POD Lead**, I want mentor/mentee shadowing pairs and status, so that ramping CSAs learn on
  real engagements.

## 8. Business rules & logic

- **S500 eligibility:** `cpe ≥ 4.4 AND quality ≥ 4.4 AND tenureMonths ≥ 6`; reason picks the first
  failing criterion.
- **Shadowing pairing:** mentee = sourcing/selection/onboarding CSA; mentor = an active CSA in the same
  POD (fallback: shares a track).
- **SDM onboarding:** 6 steps (role/scope, escalation training, ADO/Power BI access, partner health
  dashboards, shadow live escalations, readiness sign-off).
- **User Voice status:** New → Under review → Planned → Shipped.

## 9. AI capabilities

No dedicated AI in the prototype. Candidate future AI: recommend next accreditation per CSA; predict
S500 readiness date; auto-suggest mentor pairing.

## 10. Screens & UI

- Five tabs (Accreditations, S500 Eligibility, SDM Onboarding, User Voice, Shadowing), each with KPIs
  and tables; User Voice has submit/vote controls.

## 11. Integrations & source systems (production)

| System | Role | Direction | Notes |
|---|---|---|---|
| Skilling/accreditation platform | Accreditation records | inbound | SoT for skills. |
| HR | Tenure, SDM roster | inbound | S500 + SDM onboarding. |
| CPE/Quality | CPE + quality scores | inbound | S500 inputs. |
| Product backlog (ADO/Planner) | User Voice ideas | in/out | Real feedback loop. |

## 12. KPIs & metrics

| Metric | Definition | Target |
|---|---|---|
| Accreditation coverage | CSAs per key accreditation | ≥ threshold |
| S500 eligibility rate | Eligible / active CSAs | Increase |
| SDM readiness | SDMs at 100% onboarding | Increase |
| Shadowing completion | Completed / pairs | Increase |
| Idea throughput | User Voice New → Shipped | Track |

## 13. Non-functional requirements

- **Accuracy:** accreditations/tenure sourced from systems of record.
- **Fairness/transparency:** S500 rules explicit and auditable.
- **Security:** editing enablement data restricted appropriately.

## 14. Prototype → production gaps

- [ ] Real **accreditation** source (not CSA `skills` proxy); expiry/renewal.
- [ ] Persisted **S500** decisions + history (not just live computation).
- [ ] Real **SDM onboarding** task tracking.
- [ ] **User Voice** persistence + backlog integration + dedupe/merge.
- [ ] Shadowing **scheduling** + outcomes feeding lifecycle sign-off.
- [ ] AI: next-best accreditation, S500 readiness prediction, mentor matching.

## 15. Backlog (epics → stories)

| ID | Epic | Story | Priority | Notes |
|---|---|---|---|---|
| EN-1 | Accreditations | Integrate skilling platform + expiry | Must | SoT |
| EN-2 | S500 | Persist eligibility + history + appeals | Must | Governance |
| EN-3 | SDM | Real SDM onboarding tracking | Should | Consistency |
| EN-4 | User Voice | Persist + backlog integration | Should | Feedback loop |
| EN-5 | Shadowing | Scheduling + outcomes → lifecycle | Should | Ramp gate |
| EN-6 | AI | Accreditation/mentor recommendations | Could | Optimisation |

## 16. Open questions & assumptions

- **Q:** Are accreditations the same as the `skills` used in dispatch? **A (assumption):** yes — unify
  on the accreditation source.
- **Q:** Who approves S500? **A (assumption):** enablement/DPSM based on the rule + review.

## 17. References

- Prototype source: `scripts/views/enablement.js`.
- Related: [PODs & People](20-pods-and-people.md), [Lifecycle](22-partner-csa-lifecycle.md),
  [Capacity](21-capacity-and-forecasting.md), [Quality](30-quality-and-cpe.md).
