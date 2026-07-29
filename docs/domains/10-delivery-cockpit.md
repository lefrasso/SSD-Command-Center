# Domain: Delivery Cockpit (Home)

> The role-personalised landing page — "what needs me today" — combining live KPIs, an AI daily
> briefing, a prioritised needs-attention list, portfolio charts and POD health.

## 1. At a glance

| Field | Value |
|---|---|
| Domain ID | `home` |
| Module route | `#/home` |
| Prototype status | Implemented |
| Primary personas | All (content adapts by role) |
| Source-of-truth systems (target) | SSD IQ (aggregates) |
| Upstream domains (depends on) | SSD IQ (02), AI (03), Identity (01) |
| Downstream domains (consumed by) | Navigates into Engagements, Escalations, SSD IQ |
| Prototype source | `scripts/views/home.js`, `scripts/store.js` (`computeKpis`, `sentimentBreakdown`) |

## 2. Purpose & problem statement

- **Why this domain exists** — Delivery leaders and CSAs open the console to answer one question:
  *what needs me right now?* The cockpit turns the whole system of records into a single, prioritised,
  role-aware starting point.
- **Who cares** — All personas; each sees a briefing and KPIs framed for their job.
- **Definition of done** — A live, role-aware home that summarises portfolio health, flags what needs
  action, and deep-links to the right place to act.

## 3. Personas & permissions

All roles see the cockpit; the **daily briefing** and emphasis differ by persona (Partner CSA →
own outreach; SDM → escalations/SLA; DPSM → capacity/onboarding; business-lt → portfolio; POD Lead →
at-risk + demand). Filters and POD health respect the role's data scope.

## 4. Key concepts & glossary

| Term | Meaning |
|---|---|
| Needs attention | Prioritised list: SLA breaches → at-risk engagements → new demand. |
| Daily briefing | AI headline + bullets + anomaly callouts, role-specific. |
| POD health | Per-POD tile: utilization, avg CPE, at-risk/open escalations, headcount. |
| Net sentiment | Portfolio sentiment index across channels. |

## 5. Data model

Read-only aggregates over SSD IQ; no entities owned. Key inputs: engagements, escalations,
deliveries, cpe, csas, sentiment, pods, plus `LEADERSHIP`.

## 6. Features (current prototype)

1. **Personalised header** — greeting by persona first name; **track** and **partner** filters.
2. **KPI grid** (`computeKpis`): Active engagements, On-time %, Rolling CPE, Open escalations (+SLA
   breaches hint), Utilization, Net sentiment — each colour-toned to targets.
3. **SSD Leadership card** — WW Lead, three TZ Leads, Business Manager (from `LEADERSHIP`).
4. **Daily briefing** (AI) — role-specific headline, bullets and **anomaly callouts**.
5. **Needs attention** — merged, priority-sorted list (SLA breaches p1, at-risk p2, new demand p3),
   top 9; each row deep-links to SSD IQ search for that customer/record.
6. **Charts** — Engagements by status (donut), Sentiment mix (donut, NLP-labelled), Avg CPE by track
   (bar).
7. **POD health tiles** — per POD: region · TZ · active CSAs, utilization, avg CPE, at-risk/open esc.

## 7. User stories

### Epic: Situational awareness
- As **any persona**, I want a role-specific briefing and KPI snapshot on landing, so that I instantly
  know portfolio health from my angle.
- As **a POD Lead**, I want a prioritised "needs attention" list, so that I act on the highest-risk
  items first.

### Epic: Act fast
- As **any user**, I want each attention item to deep-link to the record, so that I can act in one
  click.
- As **any user**, I want to filter the cockpit by track and partner, so that I can focus.

### Epic: Team health
- As **a POD/TZ Lead**, I want POD health tiles, so that I can spot an over-utilised or low-CPE POD
  quickly.

## 8. Business rules & logic

KPI formulas (`store.js → computeKpis`), "now" pinned to `2026-07-28T09:00:00Z`:

| KPI | Formula |
|---|---|
| Active engagements | count(status ∈ {assigned, in-delivery}) |
| On-time delivery % | deliveries with `completedDate ≤ dueDate` / total deliveries |
| Rolling CPE | mean(cpe.score), 1 dp (target ≥ 4.4) |
| Open escalations | count(status ≠ resolved) |
| SLA breaches | open escalations where `hoursSince(opened) > slaHours` |
| Utilization | mean(active CSA utilization) (healthy 80–90%) |
| Net sentiment | mean(net) of partner sentiment rollups for current period |

- **Needs-attention priority:** 1 = SLA-breaching escalation, 2 = at-risk engagement, 3 = new demand;
  sorted ascending, capped at 9.
- **Filters:** track/partner filter both KPIs context and the attention/charts; new-demand items are
  partner-agnostic.

## 9. AI capabilities

| AI feature | Input | Output | Prototype | Production seam |
|---|---|---|---|---|
| Daily briefing | role + dataset | headline, bullets, anomalies, sources | `ai.js → dailyBriefing` | Azure OpenAI grounded on SSD IQ |
| Sentiment mix (NLP) | cpe + messages | positive/neutral/negative counts | `store.js → sentimentBreakdown` | NLP sentiment service |

## 10. Screens & UI

- KPI grid, Leadership card, Daily briefing card, Needs-attention list, three charts, POD health grid.
- Filters: track, partner. Interactions: attention row → SSD IQ deep link.

## 11. Integrations & source systems (production)

Consumes aggregates from SSD IQ; leadership/org from a config/HR source. No direct external writes.

## 12. KPIs & metrics

The six cockpit KPIs above are the domain's headline metrics. Targets: on-time ≥ 90%, CPE ≥ 4.4,
utilization 80–90%, SLA breaches → 0.

## 13. Non-functional requirements

- **Security:** role scoping of KPIs and POD health; no confidential data on home.
- **Performance:** cockpit aggregates should be cached/materialised.
- **Accessibility:** charts have text equivalents; colour is not the only signal.

## 14. Prototype → production gaps

- [ ] Real-time/materialised **aggregates** from SSD IQ instead of client-side compute.
- [ ] **Role/TZ scoping** of KPIs (e.g. EMEA TZ Lead sees EMEA).
- [ ] **Personalised** attention ranking (ML priority) + snooze/assign.
- [ ] Externalise **leadership/org** from code.
- [ ] Configurable **targets/thresholds** per org.

## 15. Backlog (epics → stories)

| ID | Epic | Story | Priority | Notes |
|---|---|---|---|---|
| HOME-1 | Aggregates | Server-side KPI aggregation + cache | Must | Perf/accuracy |
| HOME-2 | Scoping | TZ/OU/role scoping of cockpit | Must | Real orgs |
| HOME-3 | Attention | Actionable items (assign/snooze/complete) | Should | Beyond deep link |
| HOME-4 | Briefing | Grounded AI briefing with citations | Should | Trust |
| HOME-5 | Config | Editable targets + leadership org | Could | Non-eng edits |

## 16. Open questions & assumptions

- **Q:** Should home scope to the user's TZ by default? **A (assumption):** yes for TZ Leads; global
  for WW Lead.
- **Q:** Which items belong in "needs attention" beyond the current three? **A:** candidates —
  pending reports (T-3W), failed QC, negative sentiment spikes.

## 17. References

- Prototype source: `scripts/views/home.js`, `scripts/store.js`, `scripts/ai.js` (`dailyBriefing`).
- Related: [Engagements](11-engagements-and-dispatch.md), [Escalations](31-escalations-and-actions.md),
  [Sentiment](33-sentiment.md), [Reporting](41-reporting-and-analytics.md).
