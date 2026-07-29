# Capability: Partner CSA Lifecycle `CAP-09`

> The end-to-end journey of a Partner CSA — sourcing → selection → onboarding → active → offboarding —
> with a structured onboarding plan, readiness scoring and offboarding checklist.

## Summary

| Field | Value |
|---|---|
| Capability ID | `CAP-09` |
| Area | Workforce |
| Primary personas | POD Lead, DPSM, business-lt |
| Priority | Must |
| Target phase | P1 |
| Prototype reference | `scripts/views/lifecycle.js` |
| Depends on | [CAP-10 Delivery Partners](CAP-10-delivery-partners.md), [CAP-07 PODs](CAP-07-pods-and-people.md) |

## 1. Problem & outcome

- **Problem:** Getting a Partner CSA productive (and offboarding cleanly) is multi-stage with owners and
  tasks spread across tools.
- **Outcome:** A visible pipeline with per-CSA onboarding tracking (owners, tasks, readiness) and
  offboarding risk management.
- **Value:** Consistent ramp; safe offboarding; faster time-to-productive.

## 2. Functional requirements

- **FR-LC-1** — Present a **pipeline** board (sourcing → selection → onboarding → active → offboarding).
- **FR-LC-2** — Present a per-CSA **profile** with a lifecycle timeline and key attributes.
- **FR-LC-3** — Present an **onboarding tracker** grouped by phase with tasks, owners and due dates.
- **FR-LC-4** — Compute and show an AI **onboarding readiness** score with guidance.
- **FR-LC-5** — Present an **offboarding checklist** and AI **offboarding risk** (open engagements, KT).
- **FR-LC-6** — Gate stage transitions on mock-delivery pass and shadowing completion (production).
- **FR-LC-7** — Show a **hiring pipeline** summary (open requisitions by stage) that feeds the lifecycle,
  linking to HC Tracking ([CAP-08](CAP-08-capacity-and-forecasting.md)).

## 3. Business rules

- **BR-LC-1** — Onboarding plan = 5 phases / 17 tasks: Pre-boarding (DPSM/Ops), Tools & access (Ops),
  Bootcamp (POD Lead), Ramp & shadowing (POD Lead), Sign-off (POD Lead).
- **BR-LC-2** — Readiness % = onboarding tasks done / 17; ≥80% ready, 40–79% on track, <40% early.
- **BR-LC-3** — Offboarding tasks: reassign open engagements → KT → access removal → vendor sign-off.
- **BR-LC-4** — Offboarding risk: open engagements still assigned ⇒ reassign before access removal.

## 4. User stories & acceptance criteria

### Story: Consistent onboarding
- **As a** POD Lead **I want** a phase-based onboarding plan with owners **so that** every CSA ramps
  consistently.
- **AC:** Given an onboarding CSA, When I open the tracker, Then tasks are grouped by phase with owners
  and a readiness score.

### Story: Safe offboarding
- **As a** DPSM **I want** offboarding risk flags **so that** we reassign work before removing access.
- **AC:** Given an offboarding CSA with open engagements, When I view risk, Then it warns to reassign
  before access removal.

## 5. Data & system of record

**CSA** `lifecycle` + derived onboarding/offboarding progress; onboarding/offboarding task status
(production SoT = Operations/HR + provisioning systems).

## 6. AI touchpoints

| AI feature | Input | Output | Guardrail | Ref |
|---|---|---|---|---|
| Onboarding readiness | task progress | % + guidance | advisory | [05](../05-ai-and-copilot-platform.md) |
| Offboarding risk | open engagements + KT | risk narrative | advisory | [05](../05-ai-and-copilot-platform.md) |

## 7. Integrations

Operations/HR (lifecycle), access provisioning (Entra, ADO, Power BI, Teams, SharePoint, Forms),
Quality (mock deliveries), Enablement (shadowing). See [03](../03-integrations.md).

## 8. NFR & security notes

Auditable access provisioning/removal; NDA/background verification tracked; lifecycle synced to Operations.

## 9. KPIs

Time-to-ready, onboarding readiness, offboarding compliance.

## 10. Open questions & assumptions

- **Q:** Who signs off readiness? **A (assumption):** POD Lead.
- **Q:** Sourcing/selection managed here or upstream? **A:** visible here; managed with DPSM tooling.
