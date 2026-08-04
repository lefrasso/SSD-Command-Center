# 07 — KPIs & Reporting

> The KPI catalog (definitions, formulas, targets) and the reporting surfaces: Executive View,
> Territory Ops (inclusive of time zones **and** US OUs), and the two MBRs (Delivery Partner + internal
> SSD Business). These double as the console's headline metrics.

## 1. KPI catalog

Formulas from the prototype (`scripts/store.js → computeKpis`), "now" pinned in the prototype to
`2026-07-28T09:00:00Z`. Production computes these server-side over SSD IQ / Fabric. HC & hiring metrics
derive from the **HC Consolidation** dataset (`data/generate.js → hiring`, POD `hcTarget`).

| KPI | Definition / formula | Target |
|---|---|---|
| **Global deliveries completed** | Count of completed deliveries per partner/period | Growth period-over-period |
| **On-time delivery %** | deliveries with `completedDate ≤ dueDate` / total deliveries | ≥ 90% |
| **Rolling CPE** | mean(`cpe.score`), 1 dp | ≥ 4.4 / 5 |
| **Active engagements** | count(status ∈ {assigned, in-delivery}) | — (volume) |
| **Open escalations** | count(status ≠ resolved) | Trending down |
| **SLA breaches** | open escalations where `hoursSince(opened) > slaHours` | 0 |
| **Mean time to resolve** | mean(resolved − opened) | Within track SLA |
| **Utilization** | mean(active CSA `utilization`) | 80–90% band |
| **Net sentiment** | mean(net) of partner sentiment rollups (period) | ≥ 0 and rising |
| **Onboarding time-to-productive** | onboarding start → readiness sign-off | Trending down |
| **Proactive coverage (T-3W)** | in-window engagements with outreach started / in-window | ≥ 80% |
| **QC pass rate** | QCs ≥ 4/5 / total QCs | ≥ 80% |
| **S500 eligibility rate** | eligible / active CSAs | Increase |
| **Coverage gaps** | Program × time-zone cells with no accredited, language-capable CSA | 0 |
| **Active HC** | Count of active Partner CSAs | Meet plan |
| **Future HC** | Active HC + open hiring requisitions (pipeline) | ≥ required |
| **Headcount gap to plan** | max(0, required − future HC) | 0 |
| **Open requisitions** | Hiring reqs with stage ≠ Hired | Fill to plan |
| **Fill rate** | hired / all requisitions | Increase |
| **Avg time-to-hire** | mean(hiredDate − opened), days | Decrease |
| **Planned starts (90d)** | open reqs with targetStart within 90 days | Meet ramp plan |
| **Requests completed** | Count of completed delivery requests (period) | Growth |
| **Requests upcoming** | Count of scheduled, not-yet-delivered requests | Healthy pipeline |
| **Reports pending** | Requests overdue for their delivery report (with labor logged / *Has Labor*) | Trend to 0 |
| **Reports-pending aging** | Pending split by `≤7 / >7 / >14 / >21` days (emphasis on >14 & >21) | Shrink the tail |
| **Delivered hours** | Σ labor hours on completed Success-Programs requests | Track |
| **Delivered events** | Count of completed Success-Programs delivery events | Track |
| **Delivered hours in Reports-Pending state** | Labor hours logged on requests still pending report | Minimise |
| **Upcoming deliveries (7d / 30d)** | Scheduled deliveries within the next week / month | Meet plan |
| **CPE surveys received** | Completed CPE surveys (period) | Increase |
| **VSAT / DSAT** | Count of very-satisfied / dissatisfied CPE responses | ↑ VSAT · ↓ DSAT |
| **Avg satisfaction score** | mean(CPE `satisfactionScore`, 1–5) | ≥ 4.4 |
| **Unanswered CPE surveys** | Surveys sent but never completed | Minimise |
| **Off-strategy deliveries** | Requests delivered that don't belong to Success Programs (`SCOP`/ROSS) | 0 |
| **S500 readiness rate** | S500-ready (reconciled) CSAs / active CSAs | Increase |
| **S500 cx served by non-ready CSAs** | S500 customers served by non-S500-ready CSAs | 0 |
| **ESXP profile completion** | Active CSAs with a 100%-complete ESXP profile | 100% |
| **Quality checks logged** | QCs recorded (target ≥ 1 per CSA per month) | ≥ 1 / CSA / month |
| **8-week pipeline hours** | Forecast labor hours per CSA per ISO week (next 8 weeks) | Balanced load |

## 2. Reporting surfaces

### 2.1 Executive View
Portfolio scorecard for Success Programs (the FY-scope executive dashboard). KPI grid + AI executive
summary + charts: deliveries by month, CPE trend, deliveries by program/time-zone/partner, escalations
by severity. **Bind to the real Power BI executive dataset** in production (the prototype view is
representative). Spec: [CAP-17](capabilities/CAP-17-reporting-and-mbr.md).

### 2.2 Territory Ops (operational, inclusive)
Group operations by **Time Zone**, **Territory (Region / OU)**, **Partner**, or **Success Program**,
with combinable filters (TZ, program, partner, status). Per-group operational metrics (engagements,
active, at-risk, on-time, open esc, SLA breach, CSAs, utilization, CPE) + AI operational summary.
**US territories roll up to OUs** — the grouping is inclusive of both TZ and OU. Requirement source:
the explicit ask to "add the perspective of the Territory… in the US territories are OUs, be inclusive…
flexibility to select any filter… the perspective should be operational."

### 2.3 Delivery Partner MBR (external)
Per-partner, per-period Monthly Business Review: executive summary (KPIs + AI narrative), delivery
volume by program, CPE, escalations/risk, highlights, next steps. **Export to PowerPoint** is a
committed production requirement (top User Voice ask). Template source: the partner MBR proposal
provided by the business.

### 2.4 SSD Business MBR (internal)
Internal monthly review: portfolio KPIs + AI executive summary, delivery performance, delivery by
territory (TZ), escalations/operational risk, workforce & capacity, priorities. Template source: the
internal FY MBR deck provided by the business.

### 2.5 Ask-your-data
NL questions answered from SSD IQ with sources (e.g. "CPE trend for <partner>", "open escalations",
"utilization", "on-time delivery"). Production: RAG with citations. See [05 — AI](05-ai-and-copilot-platform.md).

### 2.6 POD Lead Report (Success Programs Insights & Operations)
The operational, POD-Lead-facing report that Compass productises natively (source of truth for the
metrics below; today a standalone Power BI report). Filters: **POD Lead, Date (FY / quarter), Supplier,
Partner CSA, SDM, RMOT status**. Three pages:

1. **POD Snapshot** — the "what needs me today" actionable page: **Request # Summary** (Completed /
   Upcoming / Reports Pending); **Reports Pending Breakdown** (*Has Labor*, `≤7 / >7 / >14 / >21` days,
   emphasis on >14 & >21); **Quality Checks** per CSA over 3 months + current (active POD members only,
   excludes MOCK events; target ≥ 1/CSA/month); **Reports Pending per CSA**; **Survey CPE** (3 months);
   **Open Escalations** by month; **Completed Requests** and **Current & Upcoming Requests** by month
   (to spot CSAs with low completed or low upcoming volume). *These visuals are unaffected by the date
   filter* — they intentionally show the rolling window.
2. **CPE, Accreditations & Quality** — KPI band (**CPE surveys received, VSAT, DSAT, Quality Checks,
   Escalations**); **Accreditations distribution** by Program; **S500-ready** split (True/False,
   reconciled); **Partner CSAs' accreditations** (Primary Skill, Rating 0–5, Professional Service Name,
   Is Active, `_S500reconciled`); **ESXP profile not completed** (`≤ 50%`; should always be empty);
   **Received CPEs** (PFE detail, satisfaction score, company, RossID, survey status); **Avg
   satisfaction score**; **Unanswered CPE surveys**; **Quality checks** log (QC date, MS quarter, title,
   QC URL); **Escalations** log (current vs submitting POD Lead, escalation event name + category).
3. **Delivery & Operations** — KPI band (**delivered hours, delivered events, upcoming deliveries,
   upcoming in next week / month, delivered hours in Reports-Pending state, reports pending, total
   active Partner CSAs**); **Events assigned to Partner CSAs** (Request Tracking ID, DeliveryProduct,
   EDEDeliveryLinkId, IsTRAI, first scheduled arrival); **Off-strategy deliveries** (non-SP `SCOP`/ROSS
   — should be empty); **S500 customers served by non-S500-ready CSAs**; **Pipeline for the next 8
   weeks** (forecast hours per CSA per ISO week; a fixed-date visual, unaffected by the date/RMOT
   filters). Spec: [CAP-07](capabilities/CAP-07-pods-and-people.md), [CAP-17](capabilities/CAP-17-reporting-and-mbr.md).

## 3. Reporting requirements

- **FR-REPORT-1** — Executive View binds to the real Power BI/warehouse dataset (RLS aligned to RBAC/TZ/OU).
- **FR-REPORT-2** — Territory Ops supports grouping by TZ / Region-OU / Partner / Program with combinable filters.
- **FR-REPORT-3** — US OU hierarchy is first-class (not only region-as-proxy).
- **FR-REPORT-4** — Partner MBR and internal Business MBR generate as sectioned, presentation-quality
  documents; **export to PowerPoint/PDF**.
- **FR-REPORT-5** — Ask-your-data returns grounded answers with citations.
- **FR-REPORT-6** — All figures reconcile to the Power BI source of truth.
- **FR-REPORT-7** — Reports/MBRs are role-scoped; partner MBRs contain only that partner's data.
- **FR-REPORT-8** — Provide the **POD Lead Report** (§2.6) natively — POD Snapshot, CPE/Accreditations/
  Quality, and Delivery/Operations pages — filterable by POD Lead / Date / Supplier / Partner CSA / SDM /
  RMOT status, and scoped to the signed-in POD Lead by default. Fixed-window visuals (rolling 3-month,
  8-week pipeline) are deliberately unaffected by the date filter.

## 4. Prototype → production gaps

- [ ] Bind Executive View to the **real** Power BI dataset (remove "representative").
- [ ] First-class **US OU** hierarchy for Territory Ops.
- [ ] Productise the **POD Lead Report** (§2.6) natively over the SP operations dataset; reconcile the
  **RMOT status lag** (report state trails the source refresh) so pending/complete counts are trustworthy.
- [ ] **MBR export to PowerPoint** + save/share.
- [ ] Scheduled/subscribable reports and MBRs.
- [ ] Server-side KPI aggregation (materialised) for scale.

## 5. References

- Prototype: `scripts/store.js` (`computeKpis`), `scripts/views/reporting.js` (exec/territory/MBR/ask),
  `scripts/ai.js` (`execSummary`, `mbrNarrative`, `askData`).
- Related: [CAP-17 Reporting/Territory/MBR](capabilities/CAP-17-reporting-and-mbr.md),
  [CAP-05 Reports Pending](capabilities/CAP-05-reports-pending-t3w.md), [05 AI](05-ai-and-copilot-platform.md).
