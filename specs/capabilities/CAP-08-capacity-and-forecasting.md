# Capability: Capacity & Forecasting `CAP-08`

> Demand forecasting, headcount mapping & assignment, coverage analysis (**≥ 1 CSA per Program, per
> language, per time zone**), and **Active & Future HC consolidation + hiring progress** (representative
> of the *Active & Future SP HC Consolidation* PBI).

## Summary

| Field | Value |
|---|---|
| Capability ID | `CAP-08` |
| Area | Workforce |
| Primary personas | CSA Manager, POD Lead, Operations Manager, TZ Lead, WW Lead, Business Manager (edits require `edit:capacity`) |
| Priority | Should |
| Target phase | P2 |
| Prototype reference | `scripts/views/capacity.js` (tabs: Forecast & Coverage / HC Tracking / Hiring Progress), `data/generate.js` (`hiring`, POD `hcTarget`/`hcActive`) |
| Depends on | [CAP-07 PODs](CAP-07-pods-and-people.md), [CAP-04 Dispatch](CAP-04-engagements-and-dispatch.md) |

## 1. Problem & outcome

- **Problem:** Delivery must have enough of the right people in the right place; gaps surface too late.
- **Outcome:** Forecast demand, map to headcount by Family, and prove coverage across time zone and language.
- **Value:** Proactive hiring/assignment; no coverage blind spots.

## 2. Functional requirements

- **FR-CAP-1** — Show KPIs: Active CSAs, Avg utilization, Headcount gap, Coverage gaps (program × TZ).
- **FR-CAP-2** — Show a **headcount mapping** table per Family: headcount, demand, required, gap,
  recommendation.
- **FR-CAP-3** — Show a **coverage matrix** (program × time zone), highlighting zero-coverage cells.
- **FR-CAP-4** — Show **language coverage** per TZ (target ≥1 CSA per program/language/TZ).
- **FR-CAP-5** — Provide AI **forecast & coverage** insight prescribing where to assign/hire.
- **FR-CAP-6** — Generate **hire/assign tasks** from gaps (production).
- **FR-CAP-7** — **HC Tracking (Active & Future):** consolidate **Active HC**, **hiring pipeline** and
  **Future HC** (= active + pipeline) vs **required** and **target**, by Family and by time zone.
- **FR-CAP-8** — **Hiring Progress:** show open requisitions, a **pipeline funnel** (Sourcing → Screening
  → Interview → Offer → Hired), **fill rate**, **avg time-to-hire**, **planned starts** (by month / next
  90 days), and an open-requisitions list.

## 3. Business rules

- **BR-CAP-1** — Required headcount = `ceil(open demand for Family / capacity-per-CSA)` (prototype = 4; configurable).
- **BR-CAP-2** — Gap = required − current active headcount in the Family (positive = assign/hire).
- **BR-CAP-3** — Coverage cell = active CSAs **accredited in the Program** who **speak a language
  supported in that time zone**. There is **no territory restriction** — a CSA can deliver in any time
  zone if the language matches.
- **BR-CAP-4** — Coverage target: **≥ 1 per program, per language, per time zone**.
- **BR-CAP-5** — Future HC = Active HC + open requisitions (pipeline); Gap-to-plan = max(0, required − future).
- **BR-CAP-6** — Fill rate = hired / all requisitions; time-to-hire = hiredDate − opened (days);
  requisition `stage` ∈ {Sourcing, Screening, Interview, Offer, Hired}; `type` ∈ {Growth, Backfill}.

## 4. User stories & acceptance criteria

### Story: Forecast headcount
- **As a** DPSM **I want** required headcount from live demand **so that** I plan hiring on facts.
- **AC:** Given open demand per track, When the table renders, Then required = ceil(demand/capacity) and
  gap is highlighted.

### Story: Prove coverage
- **As a** TZ Lead **I want** a program × TZ coverage matrix **so that** I ensure every program is
  covered in my TZ.
- **AC:** Given a program with zero CSAs in a TZ, When the matrix renders, Then that cell is flagged as a
  coverage gap.

## 5. Data & system of record

Derived from **CSA** (active, tracks, podId→tz/region) and **Engagement** (open, track); reference
region→language map.

## 6. AI touchpoints

| AI feature | Input | Output | Guardrail | Ref |
|---|---|---|---|---|
| Forecast & coverage insight | demand + CSAs + coverage | narrative + action | advisory | [05](../05-ai-and-copilot-platform.md) |

## 7. Integrations

Dispatch/pipeline (forward demand), Operations/HR (headcount, languages, TZ), hiring/sourcing
(requisitions). See [03](../03-integrations.md).

## 8. NFR & security notes

`edit:capacity` gate; matrix colour + numbers; language as first-class dimension (`NFR-I18N-2`).

## 9. KPIs

Headcount gap (0), coverage gaps (0), utilization (80–90%), forecast accuracy.

## 10. Open questions & assumptions

- **Q:** Capacity per CSA = 4 concurrent? **A (assumption):** placeholder; configurable per program.
- **Q:** Language source? **A (assumption):** from CSA profile in production (region proxy today).
