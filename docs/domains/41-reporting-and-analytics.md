# Domain: Reporting & Analytics

> Executive Success Programs insights, an operational Territory view (Time Zones **and** US OUs),
> AI-assisted **MBRs** (partner-facing and internal), and ask-your-data over SSD IQ.

## 1. At a glance

| Field | Value |
|---|---|
| Domain ID | `reporting` |
| Module route | `#/reporting` |
| Primary personas | POD Lead, SDM, DPSM, business-lt (MBR requires `run:mbr`) |
| Prototype status | Implemented |
| Source-of-truth systems (target) | SSD IQ, Power BI |
| Upstream domains (depends on) | SSD IQ (02), AI (03), all operational domains |
| Downstream domains (consumed by) | Leadership reviews, partner MBRs |
| Prototype source | `scripts/views/reporting.js`, `scripts/ai.js` (`execSummary`, `mbrNarrative`, `askData`) |

## 2. Purpose & problem statement

- **Why this domain exists** — Leaders and partners need trustworthy, narrated views of delivery: an
  executive scorecard, an operational read by territory, month-in-review packs (MBRs), and the ability
  to just ask questions of the data.
- **Who cares** — WW/TZ leads, DPSMs, SDMs, POD Leads; Delivery Partners (their MBR).
- **Definition of done** — Live, grounded reporting and MBR generation that replaces manual deck-building
  and is inclusive of both TZ and US-OU territory structures.

## 3. Personas & permissions

| Persona | Can do |
|---|---|
| business-lt | Executive view, territory, MBRs (`run:mbr`), ask-data |
| POD Lead / SDM | Territory, MBRs (`run:mbr`), ask-data |
| DPSM | Territory, ask-data (capacity lens) |

## 4. Key concepts & glossary

| Term | Meaning |
|---|---|
| Executive View | Portfolio scorecard for Success Programs (FY27). |
| Territory Ops | Operational read grouped by TZ / Region-OU / Partner / Program. |
| MBR | Monthly Business Review — Delivery Partner (external) or SSD Business (internal). |
| Ask-your-data | NL Q&A over SSD IQ KPIs. |
| OU | US Organizational Unit — inclusive territory grouping alongside TZ. |

## 5. Data model

Read-only aggregates across SSD IQ (engagements, deliveries, cpe, escalations, csas, sentiment,
partners, pods). Reference: `PERIODS` (2026-04…07), `TZ_MAP`, `TRACKS`.

## 6. Features (current prototype)

Four tabs:

1. **Executive View** — KPI grid (deliveries, on-time, CPE, active engagements, open escalations,
   utilization, net sentiment), **AI executive summary**, and charts: deliveries by month, CPE trend,
   deliveries by Success Program, by time zone, by partner, escalations by severity. Marked
   *representative · pending real PBI*.
2. **Territory Ops** — **group by** Time Zone / Territory (Region / OU) / Partner / Success Program,
   with combinable filters (TZ, program, partner, status); operational KPIs, **AI operational
   summary**, a per-group table (engagements, active, at-risk, on-time, open esc, SLA breach, CSAs,
   utilization, CPE) and charts.
3. **MBR Builder** — choose **Delivery Partner MBR** or **SSD Business MBR (internal)** + period,
   **Generate**, then a sectioned, printable review (Executive summary with KPIs + narrative, delivery
   volume, CPE, escalations/risk, workforce/capacity, priorities). Print/PDF supported.
4. **Ask-your-data** — NL questions (e.g. "CPE trend for Avanade", "open escalations", "utilization",
   "on-time delivery") answered from SSD IQ.

## 7. User stories

### Epic: Executive insight
- As **a leader**, I want a portfolio scorecard with an AI summary, so that I brief on delivery health
  quickly.
- As **a leader**, I want breakdowns by program, time zone and partner, so that I see the mix.

### Epic: Operational territory read
- As **a TZ/WW lead**, I want to group operations by TZ **or** US OU and filter freely, so that I get an
  inclusive, operational read.
- As **an operator**, I want at-risk/SLA/on-time per group, so that I target intervention.

### Epic: MBRs
- As **a POD Lead/SDM/leader**, I want one-click partner and internal MBRs, so that I stop building
  decks by hand.
- As **a leader**, I want to print/export the MBR, so that I can share it.

### Epic: Ask-your-data
- As **any permitted user**, I want to ask questions in natural language, so that I get grounded answers
  without a report.

## 8. Business rules & logic

- **KPIs** reuse `computeKpis` (see [Cockpit](10-delivery-cockpit.md)).
- **Territory grouping:** TZ / Region-OU / Partner / Program; metrics filtered by the combined
  selection; groups with no data hidden.
- **On-time:** `completedDate ≤ dueDate`.
- **MBR content** grounded on the partner's or portfolio's real records for the period; partner MBR
  uses `mbrNarrative`, business MBR uses `execSummary`.
- **`run:mbr`** gate for MBR generation.

## 9. AI capabilities

| AI feature | Input | Output | Prototype | Production seam |
|---|---|---|---|---|
| Executive summary | portfolio KPIs | narrative | `ai.js → execSummary` | Grounded model |
| Operational summary | filtered scope | narrative + SLA pressure | inline in `reporting.js` | Grounded model |
| Partner MBR narrative | partner + period | MBR text | `ai.js → mbrNarrative` | Grounded model |
| Ask-your-data | question | grounded KPI answer + sources | `ai.js → askData` | RAG over SSD IQ |

## 10. Screens & UI

- Tabs (Executive, Territory, MBR, Ask); KPI grids; many charts; grouped territory table with filters;
  sectioned MBR document with print; ask box with suggested queries.

## 11. Integrations & source systems (production)

| System | Role | Direction | Notes |
|---|---|---|---|
| Power BI / warehouse | Delivery metrics, executive datasets | inbound | Replace representative charts. |
| SSD IQ | Operational aggregates | inbound | Territory/MBR. |
| Office/Graph | Export MBR to PPTX/PDF | outbound | Prototype uses browser print. |

## 12. KPIs & metrics

Surfaces the portfolio KPIs (on-time ≥ 90%, CPE ≥ 4.4, utilization 80–90%, SLA breaches → 0) sliced by
month, program, TZ/OU and partner.

## 13. Non-functional requirements

- **Trust:** figures must reconcile with Power BI SoT (executive view currently representative).
- **Security:** MBR/reporting scoped by role; partner MBRs contain only that partner's data.
- **Export fidelity:** MBR export must be presentation-quality.

## 14. Prototype → production gaps

- [ ] Bind Executive View to the **real FY27 Success Programs PBI**/warehouse (remove "representative").
- [ ] First-class **US OU** hierarchy (not only region-as-OU) for territory grouping.
- [ ] **MBR export to PowerPoint** (User Voice top request) + save/share.
- [ ] Ask-your-data via **RAG** with citations + broader question coverage.
- [ ] Scheduled/subscribable reports and MBRs.

## 15. Backlog (epics → stories)

| ID | Epic | Story | Priority | Notes |
|---|---|---|---|---|
| REP-1 | Exec | Bind to real PBI/warehouse datasets | Must | Trust |
| REP-2 | Territory | First-class US OU hierarchy | Should | Inclusivity |
| REP-3 | MBR | Export to PowerPoint + save/share | Must | Top User Voice ask |
| REP-4 | Ask | RAG ask-your-data with citations | Should | Coverage |
| REP-5 | Delivery | Scheduled/subscribable reports | Could | Convenience |

## 16. Open questions & assumptions

- **Q:** Source of the executive dataset? **A (assumption):** the FY27 Success Programs PBI/warehouse.
- **Q:** Full US OU tree vs region proxy? **A (assumption):** OU tree needed for the US; regions roll to
  TZ elsewhere.

## 17. References

- Prototype source: `scripts/views/reporting.js`, `scripts/ai.js` (`execSummary`, `mbrNarrative`,
  `askData`), `scripts/store.js` (`computeKpis`).
- Related: [Delivery Cockpit](10-delivery-cockpit.md), [Delivery Partners](23-delivery-partners.md),
  [Capacity](21-capacity-and-forecasting.md), [Escalations](31-escalations-and-actions.md).
