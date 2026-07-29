# Domain: Reports Pending / T-3W Proactive

> Surface overdue delivery reports **and** track whether the proactive engagement process (the Day 0–3
> outreach the CSA runs ~3 weeks out) is preventing reports from becoming pending in the first place.

## 1. At a glance

| Field | Value |
|---|---|
| Domain ID | `reports-pending` |
| Module route | `#/reports-pending` |
| Prototype status | Implemented |
| Primary personas | All |
| Source-of-truth systems (target) | Dispatch + delivery reporting (Power BI), SSD IQ |
| Upstream domains (depends on) | Engagements (11), SSD IQ (02), AI (03) |
| Downstream domains (consumed by) | Reporting (41), Cockpit (10) |
| Prototype source | `scripts/views/reportspending.js` |

## 2. Purpose & problem statement

- **Why this domain exists** — Pending (overdue) delivery reports are a lagging symptom. The real fix
  is **proactive engagement**: completing the Day 0–3 outreach within the ~3-week (T-3W) window before
  a report is due. This domain shows both the *problem* (what's pending) and the *prevention* (is the
  proactive process happening).
- **Who cares** — POD Leads, CSAs, SDMs and leaders responsible for on-time delivery reporting.
- **Definition of done** — A view that lists pending reports with aging and reasons, and a T-3W tracker
  that flags engagements likely to slip because outreach hasn't started — with enforcement hooks.

## 3. Personas & permissions

All roles can view. Actioning (e.g. enforcing outreach) routes back to [Engagements](11-engagements-and-dispatch.md).

## 4. Key concepts & glossary

| Term | Meaning |
|---|---|
| Pending report | An engagement whose `dueDate` has passed (overdue). |
| T-3W window | Engagements due within 21 days (≈ three weeks). |
| Proactive coverage | % of in-window engagements that have started Day 0 outreach. |
| Proactive status | On track (≥3 outreach) / In progress / Not started / Overdue. |

## 5. Data model

Derived entirely from **Engagement** records (no new entity). Key fields used: `dueDate`, `outreach`,
`atRisk`, `assignedTo` → CSA → POD (`tz`, `region`), `track`.

## 6. Features (current prototype)

1. **Filters** — Success Program (track) and Territory (time zone).
2. **KPIs** — Reports pending (overdue, avg days overdue), In T-3W window (due ≤ 21d), Proactive
   coverage %, T-3W not started (in-window with zero outreach).
3. **AI insight** — summarises pending volume/aging, proactive coverage, worst track, and prescribes
   enforcement when coverage < 80%.
4. **Charts** — Pending report aging buckets (1–7, 8–14, 15–30, 30+ days) and Proactive (T-3W) status
   donut.
5. **Reports pending table** — customer, CSA, track, territory (TZ · region), due, days overdue,
   outreach count, reason.
6. **T-3W proactive tracker** — in-window engagements with per-day (Day 0–3) outreach chips and a
   proactive status pill.

## 7. User stories

### Epic: See what's pending
- As **a POD Lead**, I want overdue reports listed with aging and reasons, so that I can chase the
  right ones first.
- As **a leader**, I want pending reports broken down by track and territory, so that I can target
  systemic issues.

### Epic: Prevent, don't just report
- As **a POD Lead**, I want a T-3W tracker showing which engagements haven't started outreach, so that
  I can intervene before they become pending.
- As **a CSA**, I want to see my in-window engagements and outreach status, so that I stay proactive.
- As **an operator**, I want proactive-coverage % as a KPI, so that I can prove the process is working.

## 8. Business rules & logic

- **`daysUntil(dueDate)`** relative to pinned now (`2026-07-28T09:00:00Z`).
- **Pending:** active engagement (not complete) with `daysUntil < 0`.
- **In T-3W window:** active with `0 ≤ daysUntil ≤ 21`.
- **Proactive status:** overdue if past due; **Not started** if 0 outreach; **On track** if ≥ 3
  outreach; else **In progress**.
- **Proactive coverage:** in-window with `outreach.day0` / all in-window (100% if none in window).
- **Reason:** "No proactive outreach (T-3W missed)" if 0 outreach; else "At-risk engagement" if
  at-risk; else "Delivery running late".
- **Aging buckets:** |daysUntil| in 1–7 / 8–14 / 15–30 / 30+.

## 9. AI capabilities

| AI feature | Input | Output | Prototype | Production seam |
|---|---|---|---|---|
| Pending & T-3W insight | filtered engagements | narrative + prescribed action | inline in `reportspending.js` | Grounded model over SSD IQ |

## 10. Screens & UI

- Filters (track, TZ), KPI grid, AI insight card, two charts, pending table, T-3W tracker table with
  Day 0–3 chips and status pills.

## 11. Integrations & source systems (production)

| System | Role | Direction | Notes |
|---|---|---|---|
| Delivery reporting (Power BI) | Report due/submitted status | inbound | Real "pending" signal. |
| Dispatch | Outreach signals, due dates | inbound | Drives T-3W. |
| Notifications (Teams/email) | Nudge CSAs on not-started items | outbound | Enforcement. |

## 12. KPIs & metrics

| Metric | Definition | Target |
|---|---|---|
| Reports pending | Count overdue | Trend to 0 |
| Avg days overdue | Mean overdue age | Minimise |
| Proactive coverage | In-window with outreach started | ≥ 80% |
| T-3W not started | In-window with 0 outreach | 0 |

## 13. Non-functional requirements

- **Accuracy:** "pending" must reflect the real reporting system, not a proxy.
- **Timeliness:** T-3W tracker must update as outreach happens.
- **Accessibility:** status not conveyed by colour alone (labels present).

## 14. Prototype → production gaps

- [ ] Use the **real report submission** status (Power BI/delivery system) for "pending", not just
  `dueDate`.
- [ ] Real **outreach signals** to compute proactive status (currently modelled flags).
- [ ] **Nudges/enforcement**: notify CSA/POD Lead on not-started in-window items; SLA on outreach.
- [ ] Drill-through from a row into the **engagement** and **messages**.
- [ ] Trend proactive coverage over time.

## 15. Backlog (epics → stories)

| ID | Epic | Story | Priority | Notes |
|---|---|---|---|---|
| RP-1 | Accuracy | Ingest real report-submission status | Must | True "pending" |
| RP-2 | Prevention | Auto-nudge not-started in-window engagements | Must | Close the loop |
| RP-3 | Signals | Compute proactive status from real outreach | Should | Accuracy |
| RP-4 | UX | Drill-through to engagement/messages | Should | Action |
| RP-5 | Trend | Proactive-coverage trend chart | Could | Insight |

## 16. Open questions & assumptions

- **Q:** Is 21 days the right T-3W window? **A (assumption):** yes (three weeks); make configurable.
- **Q:** What defines "report submitted"? **A:** the delivery reporting system's status field.

## 17. References

- Prototype source: `scripts/views/reportspending.js`.
- Related: [Engagements](11-engagements-and-dispatch.md), [Reporting](41-reporting-and-analytics.md),
  [Delivery Cockpit](10-delivery-cockpit.md).
