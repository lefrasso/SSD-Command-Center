# Capability: Reports Pending & T-3W Proactive `CAP-05`

> Surface overdue delivery reports **and** track whether the proactive engagement process (Day 0–3
> outreach ~3 weeks out) is preventing them — the prevention, not just the symptom.

## Summary

| Field | Value |
|---|---|
| Capability ID | `CAP-05` |
| Area | Delivery |
| Primary personas | POD Lead, Partner CSA, SDM, business-lt |
| Priority | Must |
| Target phase | P1 |
| Prototype reference | `scripts/views/reportspending.js` |
| Depends on | [CAP-04 Dispatch](CAP-04-engagements-and-dispatch.md), [02 Data](../02-data-and-system-of-record.md) |

## 1. Problem & outcome

- **Problem:** Pending (overdue) delivery reports are a lagging symptom; the real fix is proactive
  engagement in the T-3W window.
- **Outcome:** A view listing pending reports with aging/reasons **and** a T-3W tracker that flags
  engagements likely to slip because outreach hasn't started — with enforcement hooks.
- **Value:** Prevents pending reports; proves the proactive process is working.

## 2. Functional requirements

- **FR-RPEND-1** — List **pending reports** (overdue) with customer, CSA, track, territory (TZ·region),
  due date, days overdue and reason.
- **FR-RPEND-2** — Show KPIs: Reports pending (+avg days overdue), In T-3W window, Proactive coverage %,
  T-3W not started.
- **FR-RPEND-3** — Show a **T-3W tracker** of in-window engagements with per-day (Day 0–3) outreach
  status and a proactive status pill.
- **FR-RPEND-4** — Show charts: pending-report **aging buckets** and proactive **status** distribution.
- **FR-RPEND-5** — Filter by Success Program and Territory (TZ).
- **FR-RPEND-6** — Use the **real report-submission status** (delivery reporting) for "pending" in
  production, not just `dueDate`.
- **FR-RPEND-7** — **Nudge/enforce**: notify CSA/POD Lead on not-started in-window engagements (production).

## 3. Business rules

- **BR-RPEND-1** — Pending = active engagement with `daysUntil(dueDate) < 0`.
- **BR-RPEND-2** — In T-3W window = active with `0 ≤ daysUntil ≤ 21`.
- **BR-RPEND-3** — Proactive status: Overdue if past due; **Not started** if 0 outreach; **On track** if
  ≥3 outreach; else **In progress**.
- **BR-RPEND-4** — Proactive coverage = in-window with Day 0 outreach / all in-window (100% if none).
- **BR-RPEND-5** — Aging buckets: |daysUntil| in 1–7 / 8–14 / 15–30 / 30+.

## 4. User stories & acceptance criteria

### Story: Prevent, don't just report
- **As a** POD Lead **I want** to see in-window engagements with no outreach **so that** I intervene
  before they become pending.
- **AC:**
  - Given an engagement due in ≤21 days with 0 outreach, When the tracker renders, Then it shows "Not
    started" and (production) triggers a nudge.
  - Given proactive coverage < 80%, When the insight renders, Then it prescribes enforcing T-3W on the
    not-started items.

### Story: Chase the right ones
- **As a** POD Lead **I want** pending reports sorted by aging with reasons **so that** I chase the worst
  first.
- **AC:** Given pending reports, When listed, Then they are sorted by days overdue with a reason each.

## 5. Data & system of record

Derived from **Engagement** (`dueDate`, `outreach`, `atRisk`, `assignedTo`→CSA→POD). Production adds the
**delivery-reporting** submission status as SoT for "submitted".

## 6. AI touchpoints

| AI feature | Input | Output | Guardrail | Ref |
|---|---|---|---|---|
| Pending & T-3W insight | filtered engagements | narrative + prescribed action | advisory | [05](../05-ai-and-copilot-platform.md) |

## 7. Integrations

Delivery reporting (Power BI/system) for real pending status; Dispatch for outreach signals;
notifications (Teams/email) for nudges. See [03](../03-integrations.md).

## 8. NFR & security notes

Accuracy tied to the real reporting system; status labelled (not colour-only).

## 9. KPIs

Reports pending (→0), avg days overdue, proactive coverage (≥80%), T-3W not started (0).

## 10. Open questions & assumptions

- **Q:** Is 21 days the right T-3W window? **A (assumption):** yes; make configurable.
- **Q:** What defines "submitted"? **A:** the delivery reporting system's status field.
